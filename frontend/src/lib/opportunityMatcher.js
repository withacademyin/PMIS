/**
 * Dynamic Opportunity-Institution Matching Engine
 * 
 * Computes:
 * 1. Haversine distance & travel time estimation
 * 2. Trade & qualification affinity (EXACT, RELATED, ALLIED)
 * 3. Travel catchment buckets (30, 45, 60 minutes)
 * 4. Recommended intervention actions (Campus Camp vs Talent Bulletin)
 * 5. Reverse matchability (opportunities matching a specific institute)
 */

export const TRADE_CLUSTERS = {
  electrician: ['electrician', 'electrical', 'wireman', 'electronic', 'electronics', 'solar', 'instrumentation'],
  fitter: ['fitter', 'mechanical', 'machinist', 'turner', 'tool and die', 'maintenance'],
  welder: ['welder', 'fabrication', 'sheet metal'],
  copa: ['copa', 'computer', 'information technology', 'software', 'data entry', 'it', 'web'],
  mechanic: ['mechanic motor vehicle', 'diesel mechanic', 'automotive', 'automobile', 'tractor mechanic', 'motor mechanic'],
  civil: ['draughtsman civil', 'surveyor', 'construction', 'civil'],
  refrigeration: ['refrigeration and air conditioning', 'rac', 'hvac', 'ac technician'],
  plumber: ['plumber', 'pipe fitter']
};

/**
 * Calculate Great Circle Distance in KM between two coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 999;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return 999;

  const R = 6371; // Earth's radius in km
  const dLat = (numLat2 - numLat1) * (Math.PI / 180);
  const dLon = (numLon2 - numLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * (Math.PI / 180)) *
      Math.cos(numLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimate road travel time in minutes based on distance
 */
export function estimateTravelTimeMin(distanceKm) {
  if (distanceKm == null || distanceKm >= 999) return 60;
  if (distanceKm <= 2) return 10;
  // Estimate ~28 km/h average speed in regional UP network plus 6 mins starting buffer
  const time = Math.round(distanceKm * 1.8 + 6);
  return Math.max(12, Math.min(180, time));
}

/**
 * Evaluate trade similarity between an institution's offered trades and an opportunity's trade requirement
 */
export function evaluateTradeMatch(instTrades = [], oppQualification = '', oppRole = '') {
  const normQual = (oppQualification || '').toLowerCase();
  const normRole = (oppRole || '').toLowerCase();

  // Extract key trade words
  const cleanQual = normQual.replace(/iti\s*[-–:]\s*/gi, '').trim();
  const targetTerms = cleanQual
    .split(/[\s,/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  if (targetTerms.length === 0) {
    targetTerms.push(...normRole.split(/[\s,/]+/).filter((t) => t.length > 2));
  }

  let bestMatch = { strength: 'NONE', trade: instTrades[0] || 'Vocational' };

  for (const rawTrade of instTrades) {
    const tradeName = typeof rawTrade === 'string' ? rawTrade : rawTrade?.trade || '';
    const normTrade = tradeName.toLowerCase();

    // 1. Direct or substring match
    const isDirect = targetTerms.some(
      (term) => normTrade.includes(term) || term.includes(normTrade)
    );
    if (isDirect) {
      return { strength: 'EXACT', trade: tradeName };
    }

    // 2. Check cluster affinity
    for (const [, cluster] of Object.entries(TRADE_CLUSTERS)) {
      const oppInCluster = targetTerms.some((term) =>
        cluster.some((c) => term.includes(c) || c.includes(term))
      );
      const tradeInCluster = cluster.some(
        (c) => normTrade.includes(c) || c.includes(normTrade)
      );

      if (oppInCluster && tradeInCluster) {
        bestMatch = { strength: 'RELATED', trade: tradeName };
      }
    }
  }

  if (bestMatch.strength === 'NONE' && instTrades.length > 0) {
    const firstTrade = typeof instTrades[0] === 'string' ? instTrades[0] : instTrades[0]?.trade || 'Allied Technical';
    bestMatch = { strength: 'ALLIED', trade: firstTrade };
  }

  return bestMatch;
}

/**
 * Normalize an institution object to support both backend DB schema and mock radar formats
 */
export function normalizeInstitution(inst) {
  if (!inst) return null;

  const lat =
    inst.lat != null
      ? Number(inst.lat)
      : inst.coordinates?.lat != null
      ? Number(inst.coordinates.lat)
      : 26.76;
  const lng =
    inst.lng != null
      ? Number(inst.lng)
      : inst.coordinates?.lng != null
      ? Number(inst.coordinates.lng)
      : 83.37;

  // Extract trades array
  let trades = [];
  if (Array.isArray(inst.trades) && inst.trades.length > 0) {
    trades = inst.trades;
  } else if (Array.isArray(inst.programmes) && inst.programmes.length > 0) {
    trades = inst.programmes.map((p) => (typeof p === 'string' ? p : p.trade));
  } else {
    trades = ['Fitter', 'Electrician', 'Welder', 'COPA'];
  }

  const totalSeats = inst.totalSeats ?? inst.strength ?? 120;

  // Convert trades to programmes format if not present
  const programmes =
    Array.isArray(inst.programmes) && inst.programmes.length > 0
      ? inst.programmes
      : trades.map((trade) => ({
          trade,
          seats: Math.max(15, Math.round(totalSeats / trades.length)),
          duration: '1-2 Years',
        }));

  const type = inst.type || (inst.isGovernment ? 'ITI' : 'Private ITI');
  const category = inst.category || (inst.isGovernment ? 'Government' : 'Private / Affiliated');

  const contactPerson =
    inst.contactPerson ||
    inst.contacts?.tpo?.name ||
    inst.contacts?.principal?.name ||
    'Training & Placement Officer';

  const designation =
    inst.designation ||
    (inst.contacts?.tpo?.name ? 'Training & Placement Officer (TPO)' : 'Principal');

  const phone =
    inst.phone ||
    inst.contacts?.tpo?.phone ||
    inst.contacts?.principal?.phone ||
    inst.contacts?.helpdesk?.phone ||
    '+91 94150 00000';

  const email =
    inst.email ||
    inst.contacts?.tpo?.email ||
    inst.contacts?.principal?.email ||
    'iti.nodal@upiti.in';

  const shortName =
    inst.shortName ||
    inst.name
      .replace(/^GOVERNMENT INDUSTRIAL TRAINING INSTITUTE,?\s*/i, 'Govt ITI ')
      .replace(/^GOVERNMENT ITI,?\s*/i, 'Govt ITI ')
      .slice(0, 35);

  return {
    ...inst,
    id: inst.id,
    name: inst.name,
    shortName,
    type,
    category,
    district: inst.district || 'Gorakhpur',
    location: inst.location || inst.address || inst.district || 'Gorakhpur',
    address: inst.address || `${inst.name}, ${inst.district || 'Gorakhpur'}, UP`,
    coordinates: { lat, lng },
    lat,
    lng,
    totalSeats,
    strength: totalSeats,
    trades,
    programmes,
    contactPerson,
    designation,
    phone,
    email,
    matchableOpportunitiesCount: inst.matchableOpportunitiesCount || 0,
  };
}

/**
 * Match a single opportunity dynamically against all available institutions
 */
export function matchOpportunityInstitutions(opportunity, institutions = []) {
  const oppLat = opportunity.coordinates?.lat ?? 26.75;
  const oppLng = opportunity.coordinates?.lng ?? 83.38;

  const scored = institutions
    .map((rawInst) => {
      const inst = normalizeInstitution(rawInst);
      if (!inst) return null;

      const isSameDistrict =
        Boolean(opportunity.district && inst.district) &&
        opportunity.district.trim().toLowerCase() === inst.district.trim().toLowerCase();

      const distanceKm = calculateDistanceKm(
        oppLat,
        oppLng,
        inst.coordinates.lat,
        inst.coordinates.lng
      );
      
      const rawTravelTime = estimateTravelTimeMin(distanceKm);
      // If institution is located within the same administrative district, bound commute time reasonably
      const travelTimeMin = isSameDistrict ? Math.min(rawTravelTime, 35) : rawTravelTime;

      const match = evaluateTradeMatch(
        inst.trades,
        opportunity.qualification,
        opportunity.roleTitle
      );

      const availableSeats = Math.max(10, Math.round(inst.totalSeats / (inst.trades.length || 1)));

      let strengthRank = 3;
      if (match.strength === 'EXACT') strengthRank = 1;
      else if (match.strength === 'RELATED') strengthRank = 2;

      const why =
        match.strength === 'EXACT'
          ? `Exact trade match (${match.trade}), ${travelTimeMin} min away in ${inst.district}, ~${availableSeats} final-year candidates.`
          : match.strength === 'RELATED'
          ? `Related technical stream (${match.trade}), ${travelTimeMin} min away in ${inst.district}, ~${availableSeats} capacity.`
          : `Allied technical institute (${match.trade}), ${travelTimeMin} min commute radius in ${inst.district}.`;

      return {
        id: inst.id,
        name: inst.name,
        shortName: inst.shortName,
        type: inst.type,
        district: inst.district,
        isSameDistrict,
        travelTimeMin,
        distanceKm,
        matchStrength: match.strength,
        strengthRank,
        matchTrade: match.trade,
        availableSeats,
        totalSeats: inst.totalSeats,
        why,
        rawInst: inst,
      };
    })
    .filter(Boolean);

  // Sort: Same district first, then EXACT > RELATED > ALLIED, then travelTimeMin asc, then availableSeats desc
  const sortFn = (a, b) => {
    if (a.isSameDistrict !== b.isSameDistrict) return a.isSameDistrict ? -1 : 1;
    if (a.strengthRank !== b.strengthRank) return a.strengthRank - b.strengthRank;
    if (a.travelTimeMin !== b.travelTimeMin) return a.travelTimeMin - b.travelTimeMin;
    return b.availableSeats - a.availableSeats;
  };

  const within30 = scored.filter((i) => i.travelTimeMin <= 30).sort(sortFn);
  const within45 = scored.filter((i) => i.travelTimeMin <= 45).sort(sortFn);
  const within60 = scored.filter((i) => i.travelTimeMin <= 60).sort(sortFn);

  // Fallback so catchment tabs are never blank (prioritizing same district / closest trade matches)
  const fallbackList = [...scored].sort(sortFn).slice(0, 5);

  const catchmentInstitutions = {
    '30': within30.length > 0 ? within30 : fallbackList.slice(0, 3),
    '45': within45.length > 0 ? within45 : fallbackList.slice(0, 4),
    '60': within60.length > 0 ? within60 : fallbackList,
  };

  // Determine dynamic recommendedAction
  const topInst = catchmentInstitutions['45'][0] || catchmentInstitutions['60'][0];
  let recommendedAction = null;

  if (topInst && (opportunity.risk === 'HIGH' || topInst.matchStrength === 'EXACT')) {
    recommendedAction = {
      type: 'CAMP',
      label: 'Campus Mobilisation Camp',
      venue: topInst.shortName || topInst.name,
      targetSeats: Math.min(topInst.availableSeats * 2, 200),
      rationale: `High concentration of eligible ${topInst.matchTrade} candidates within ${topInst.travelTimeMin} min commute radius.`
    };
  } else if (topInst) {
    recommendedAction = {
      type: 'BULLETIN',
      label: 'Talent Bulletin Broadcast',
      venue: `${opportunity.district || 'District'} Catchment`,
      targetSeats: 100,
      rationale: `Broadcast digital opportunity flyer to TPO WhatsApp channels across ${catchmentInstitutions['60'].length} catchment institutions.`
    };
  } else {
    recommendedAction = {
      type: 'BULLETIN',
      label: 'Digital Bulletin',
      venue: 'General District Network',
      targetSeats: 50,
      rationale: 'Broadcast opportunity across district vocational channels.'
    };
  }

  return {
    catchmentInstitutions,
    recommendedAction,
  };
}

/**
 * Compute institutions enriched with dynamic matching opportunities count
 */
export function computeInstitutionsWithMatchCounts(institutions = [], opportunities = []) {
  return institutions.map((rawInst) => {
    const inst = normalizeInstitution(rawInst);
    if (!inst) return null;

    const matchingOpportunities = (opportunities || []).filter((op) => {
      const match = evaluateTradeMatch(inst.trades, op.qualification, op.roleTitle);
      return match.strength === 'EXACT' || match.strength === 'RELATED';
    });

    return {
      ...inst,
      matchableOpportunitiesCount: matchingOpportunities.length,
      matchingOpportunities,
    };
  }).filter(Boolean);
}
