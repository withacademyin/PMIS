import prisma from '../config/prisma.js';
import { generateITIContacts } from '../utils/dummyData.js';

const normalizeTrade = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const tradeMatches = (itiTrades, requiredTrade) => {
  const requested = requiredTrade.split(/[;,]/).map(normalizeTrade).filter(Boolean);
  return requested.filter((trade) => itiTrades.some((itiTrade) => {
    const normalized = normalizeTrade(itiTrade);
    return (
      normalized === trade ||
      normalized.replace(/s$/, '') === trade.replace(/s$/, '') ||
      normalized.includes(trade) ||
      trade.includes(normalized)
    );
  }));
};

async function getOwnedRequirement(id, user) {
  const requirement = await prisma.workRequirement.findUnique({
    where: { id },
    include: { officer: true },
  });

  if (!requirement) return null;
  if (user.role !== 'ADMIN' && requirement.officerId !== user.officerProfile?.id) return false;
  return requirement;
}

export const matchRequirementToITIs = async (req, res) => {
  try {
    const requirement = await getOwnedRequirement(req.params.id, req.user);
    if (requirement === null) return res.status(404).json({ success: false, message: 'Requirement not found' });
    if (requirement === false) return res.status(403).json({ success: false, message: 'Not authorized to match this requirement' });

    const { lat, lng, radiusKm = 50 } = { ...req.query, ...req.body };
    const hasCoords = lat !== undefined && lng !== undefined && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    const latitude = hasCoords ? Number(lat) : null;
    const longitude = hasCoords ? Number(lng) : null;
    const radius = Number(radiusKm) > 0 ? Math.min(Number(radiusKm), 150) : 50;
    const radiusMeters = radius * 1000;

    let itis = [];

    if (hasCoords) {
      // Spatial query within 50km
      const rawItis = await prisma.$queryRawUnsafe(`
        SELECT
          i.id,
          i.name,
          i.code,
          i.district,
          i.state,
          i."isGovernment",
          i.trades,
          ROUND((ST_Distance(i.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0)::numeric, 2) as distance_km,
          COUNT(w.id) FILTER (WHERE w."isVerified" = true AND w."availabilityStatus" = 'AVAILABLE')::int as total_active_workers,
          COUNT(w.id) FILTER (WHERE w."isVerified" = true AND w."availabilityStatus" = 'AVAILABLE' AND LOWER(w.trade) = LOWER($4))::int as matching_workers
        FROM "ITI" i
        LEFT JOIN "WorkerProfile" w ON w."itiId" = i.id
        WHERE
          i.location IS NOT NULL
          AND i.status = 'ACTIVE'
          AND ST_DWithin(i.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        GROUP BY i.id
        ORDER BY distance_km ASC;
      `, longitude, latitude, radiusMeters, requirement.requiredTrade);

      itis = rawItis.map((iti) => {
        const distanceKm = Number(iti.distance_km) || 0;
        const matchedTrades = tradeMatches(iti.trades || [], requirement.requiredTrade);
        const matchingWorkers = Number(iti.matching_workers) || 0;
        const totalActive = Number(iti.total_active_workers) || 0;

        // Pillars:
        // Proximity (max 25 pts)
        const proximityScore = Math.max(0, 25 * (1 - (distanceKm / radius)));
        // Trade match (max 35 pts)
        const tradeScore = matchedTrades.length ? 25 + Math.min(10, (iti.trades || []).length) : Math.min(15, (iti.trades || []).length);
        // Talent pool (max 25 pts)
        const talentScore = Math.min(15, matchingWorkers * 5) + Math.min(10, totalActive * 2);
        // Institution (max 15 pts)
        const institutionScore = (iti.isGovernment ? 9 : 5) + (iti.code ? 6 : 0);

        const score = Math.min(100, Math.round(proximityScore + tradeScore + talentScore + institutionScore));
        const reasons = [
          `📍 ${distanceKm} km away within ${radius} km range (${Math.round(proximityScore)}/25 proximity pts)`,
          matchedTrades.length ? `⚡ Offers required trade: ${matchedTrades.join(', ')} (${Math.round(tradeScore)}/35 trade pts)` : `Trade "${requirement.requiredTrade}" not in standard list`,
          matchingWorkers ? `👥 ${matchingWorkers} verified available ${requirement.requiredTrade} candidate${matchingWorkers === 1 ? '' : 's'}` : '👥 No verified candidates registered yet',
          `${totalActive} total active verified workers at institute`,
        ];

        return {
          requirementId: requirement.id,
          itiId: iti.id,
          score,
          reasons,
          status: 'RECOMMENDED',
        };
      });
    } else {
      // Fallback: district match
      const district = req.user.role === 'ADMIN' ? (req.body.district || requirement.officer.district) : requirement.officer.district;
      const districtItis = await prisma.iTI.findMany({
        where: { district: { equals: district, mode: 'insensitive' }, status: 'ACTIVE' },
        include: {
          _count: { select: { workers: { where: { isVerified: true, availabilityStatus: 'AVAILABLE' } } } },
          workers: {
            where: {
              trade: { equals: requirement.requiredTrade, mode: 'insensitive' },
              isVerified: true,
              availabilityStatus: 'AVAILABLE',
            },
            select: { id: true },
          },
        },
      });

      itis = districtItis.map((iti) => {
        const matchedTrades = tradeMatches(iti.trades || [], requirement.requiredTrade);
        const matchingWorkers = iti.workers.length;
        const tradeScore = matchedTrades.length ? 70 + Math.min(20, matchedTrades.length * 10) : 0;
        const workerScore = Math.min(10, matchingWorkers * 2);
        const score = tradeScore ? Math.min(100, tradeScore + workerScore) : 0;
        const reasons = [
          `🏛️ ${iti.district} district match`,
          matchedTrades.length ? `Offers: ${matchedTrades.join(', ')}` : 'Required trade not found in institute trade list',
          matchingWorkers ? `${matchingWorkers} verified available ${requirement.requiredTrade} worker${matchingWorkers === 1 ? '' : 's'}` : 'No verified available workers registered yet',
          `${iti._count.workers} total registered workers`,
        ];

        return {
          requirementId: requirement.id,
          itiId: iti.id,
          score,
          reasons,
          status: 'RECOMMENDED',
        };
      });
    }

    const recommendations = itis
      .filter((rec) => rec.score > 0)
      .sort((a, b) => b.score - a.score);

    await prisma.$transaction([
      prisma.iTIRecommendation.deleteMany({ where: { requirementId: requirement.id } }),
      ...recommendations.map((recommendation) => prisma.iTIRecommendation.create({ data: recommendation })),
    ]);

    const savedRecommendations = await prisma.iTIRecommendation.findMany({
      where: { requirementId: requirement.id },
      include: { iti: { include: { _count: { select: { workers: true } } } } },
      orderBy: [{ score: 'desc' }, { iti: { name: 'asc' } }],
    });

    const enriched = savedRecommendations.map((r) => ({
      ...r,
      iti: r.iti ? { ...r.iti, contacts: generateITIContacts(r.iti) } : null,
    }));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error matching requirement to ITIs:', error);
    return res.status(500).json({ success: false, message: 'Failed to match requirement to ITIs' });
  }
};

export const getRequirementITIs = async (req, res) => {
  try {
    const requirement = await getOwnedRequirement(req.params.id, req.user);
    if (requirement === null) return res.status(404).json({ success: false, message: 'Requirement not found' });
    if (requirement === false) return res.status(403).json({ success: false, message: 'Not authorized to view this requirement' });

    const recommendations = await prisma.iTIRecommendation.findMany({
      where: { requirementId: requirement.id },
      include: {
        iti: {
          include: { _count: { select: { workers: { where: { isVerified: true, availabilityStatus: 'AVAILABLE' } } } } },
        },
      },
      orderBy: [{ score: 'desc' }, { iti: { name: 'asc' } }],
    });

    const enriched = recommendations.map((r) => ({
      ...r,
      iti: r.iti ? { ...r.iti, contacts: generateITIContacts(r.iti) } : null,
    }));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error fetching ITI recommendations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ITI recommendations' });
  }
};

export const getITIWorkers = async (req, res) => {
  try {
    const iti = await prisma.iTI.findUnique({ where: { id: req.params.id }, select: { id: true, district: true } });
    if (!iti) return res.status(404).json({ success: false, message: 'ITI not found' });

    if (req.user.role !== 'ADMIN' && iti.district.toLowerCase() !== req.user.officerProfile?.district?.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'ITI is outside your assigned district' });
    }

    const { trade, requirementId } = req.query;
    if (req.user.role !== 'ADMIN' && (!req.user.officerProfile?.id || !requirementId)) {
      return res.status(400).json({ success: false, message: 'requirementId is required to load candidates' });
    }
    if (requirementId) {
      const requirement = await prisma.workRequirement.findFirst({
        where: {
          id: requirementId,
          ...(req.user.role === 'ADMIN' ? {} : { officerId: req.user.officerProfile.id }),
          requiredTrade: { equals: trade || '', mode: 'insensitive' },
          recommendations: { some: { itiId: iti.id } },
        },
      });
      if (!requirement) return res.status(403).json({ success: false, message: 'Requirement is unavailable or trade does not match' });
    }
    const workers = await prisma.workerProfile.findMany({
      where: {
        itiId: iti.id,
        isVerified: true,
        availabilityStatus: 'AVAILABLE',
        ...(trade ? { trade: { equals: trade, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        trade: true,
        certificationGrade: true,
        experienceYears: true,
        availabilityStatus: true,
        isVerified: true,
        skills: true,
      },
      orderBy: [{ fullName: 'asc' }],
      take: 100,
    });

    return res.json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    console.error('Error fetching ITI workers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ITI workers' });
  }
};