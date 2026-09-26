import prisma from '../config/prisma.js';
import crypto from 'crypto';

/**
 * Helper to update PostGIS location for an ITI if lat & lng are provided.
 */
async function updateItiLocation(itiId, lat, lng) {
  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      await prisma.$executeRawUnsafe(
        `UPDATE "ITI" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3;`,
        longitude,
        latitude,
        itiId
      );
    }
  }
}

/**
 * Helper to attach lat/lng to an ITI object
 */
async function attachCoordinates(iti) {
  if (!iti) return null;
  try {
    const coords = await prisma.$queryRawUnsafe(
      `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM "ITI" WHERE id = $1;`,
      iti.id
    );
    if (coords && coords.length > 0) {
      return {
        ...iti,
        lat: coords[0].lat,
        lng: coords[0].lng,
      };
    }
  } catch (e) {
    // If location is null or PostGIS query fails, return iti as is
  }
  return { ...iti, lat: null, lng: null };
}

// POST /api/v1/itis - Admin only
export const createITI = async (req, res) => {
  try {
    const { name, code, district, state, isGovernment = true, description, status = 'ACTIVE', lat, lng } = req.body;

    if (typeof name !== 'string' || typeof district !== 'string' || typeof state !== 'string' || !name.trim() || !district.trim() || !state.trim()) {
      return res.status(400).json({ success: false, message: 'Name, district, and state are required' });
    }

    const iti = await prisma.iTI.create({
      data: {
        name,
        code: code || null,
        district,
        state,
        isGovernment: Boolean(isGovernment),
        description: description || null,
        status,
      },
    });

    if (lat !== undefined && lng !== undefined) {
      await updateItiLocation(iti.id, lat, lng);
    }

    const fullIti = await attachCoordinates(iti);
    return res.status(201).json({ success: true, iti: fullIti });
  } catch (err) {
    console.error('Error creating ITI:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// GET /api/v1/itis - Officer or Admin
export const getITIs = async (req, res) => {
  try {
    const { district, state, search, status } = req.query;
    const officerDistrict = req.user.role === 'OFFICER' ? req.user.officerProfile?.district : null;
    if (req.user.role === 'OFFICER' && !officerDistrict) {
      return res.status(403).json({ success: false, message: 'Officer district is not configured' });
    }

    const where = {};
    if (officerDistrict || district) where.district = { equals: officerDistrict || district, mode: 'insensitive' };
    if (state) where.state = { equals: state, mode: 'insensitive' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const itis = await prisma.iTI.findMany({
      where,
      include: {
        _count: {
          select: { workers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Attach coordinates in batch
    const itisWithCoords = await Promise.all(itis.map(attachCoordinates));

    return res.json({ success: true, itis: itisWithCoords, count: itis.length });
  } catch (err) {
    console.error('Error fetching ITIs:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/itis/:id
export const getITIById = async (req, res) => {
  try {
    const { id } = req.params;

    const iti = await prisma.iTI.findUnique({
      where: { id },
      include: {
        workers: {
          select: {
            id: true,
            fullName: true,
            trade: true,
            experienceYears: true,
            isVerified: true,
            availabilityStatus: true,
          },
          take: 50,
        },
        _count: {
          select: { workers: true },
        },
      },
    });

    if (!iti) {
      return res.status(404).json({ success: false, message: 'ITI not found' });
    }

    if (req.user.role === 'OFFICER' && iti.district.toLowerCase() !== req.user.officerProfile?.district?.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'ITI is outside your assigned district' });
    }

    const fullIti = await attachCoordinates(iti);
    return res.json({ success: true, iti: fullIti });
  } catch (err) {
    console.error('Error fetching ITI:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/v1/itis/:id - Admin only
export const updateITI = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, district, state, isGovernment, description, status, lat, lng } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ success: false, message: 'name must be a non-empty string' });
    if (district !== undefined && (typeof district !== 'string' || !district.trim())) return res.status(400).json({ success: false, message: 'district must be a non-empty string' });
    if (state !== undefined && (typeof state !== 'string' || !state.trim())) return res.status(400).json({ success: false, message: 'state must be a non-empty string' });
    if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid ITI status' });

    const existing = await prisma.iTI.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ITI not found' });
    }

    const updated = await prisma.iTI.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        code: code !== undefined ? code : existing.code,
        district: district !== undefined ? district.trim() : existing.district,
        state: state !== undefined ? state.trim() : existing.state,
        isGovernment: isGovernment !== undefined ? Boolean(isGovernment) : existing.isGovernment,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? status : existing.status,
      },
    });

    if (lat !== undefined && lng !== undefined) {
      await updateItiLocation(id, lat, lng);
    }

    const fullIti = await attachCoordinates(updated);
    return res.json({ success: true, iti: fullIti });
  } catch (err) {
    console.error('Error updating ITI:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// DELETE /api/v1/itis/:id - Admin only
export const deleteITI = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.iTI.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ITI not found' });
    }

    await prisma.iTI.delete({ where: { id } });
    return res.json({ success: true, message: 'ITI deleted successfully' });
  } catch (err) {
    console.error('Error deleting ITI:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/**
 * GET /api/v1/itis/top-nearby
 * Finds and ranks ITIs within radius (default 50km) based on officer coordinates.
 */
export const getTopNearbyITIs = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50, trade, limit = 20 } = req.query;

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radius = Number(radiusKm) > 0 ? Math.min(Number(radiusKm), 150) : 50;
    const maxResults = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude coordinates are required' });
    }

    const radiusMeters = radius * 1000;

    // Spatial query to fetch ITIs within radius
    const rawItis = await prisma.$queryRawUnsafe(`
      SELECT
        i.id,
        i.name,
        i.code,
        i.district,
        i.state,
        i.address,
        i.pincode,
        i.phone,
        i.email,
        i."isGovernment",
        i.category,
        i.trades,
        i."tradesDataStatus",
        i.status,
        ST_Y(i.location::geometry) as lat,
        ST_X(i.location::geometry) as lng,
        ROUND((ST_Distance(i.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0)::numeric, 2) as distance_km,
        COUNT(w.id) FILTER (WHERE w."isVerified" = true AND w."availabilityStatus" = 'AVAILABLE')::int as active_workers_count,
        COUNT(w.id) FILTER (WHERE w."isVerified" = true AND w."availabilityStatus" = 'AVAILABLE' AND ($4::text IS NULL OR LOWER(w.trade) = LOWER($4)))::int as matching_trade_workers_count
      FROM "ITI" i
      LEFT JOIN "WorkerProfile" w ON w."itiId" = i.id
      WHERE
        i.location IS NOT NULL
        AND i.status = 'ACTIVE'
        AND ST_DWithin(i.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      GROUP BY i.id
      ORDER BY distance_km ASC;
    `, longitude, latitude, radiusMeters, trade || null);

    const normalizedTrade = trade ? trade.trim().toLowerCase() : null;

    const rankedItis = rawItis.map((iti) => {
      const distanceKm = Number(iti.distance_km) || 0;
      const tradesList = Array.isArray(iti.trades) ? iti.trades : [];
      const totalWorkers = Number(iti.active_workers_count) || 0;
      const tradeWorkers = Number(iti.matching_trade_workers_count) || 0;

      // 1. Proximity Score (Max 25 pts)
      const proximityScore = Math.max(0, 25 * (1 - (distanceKm / radius)));

      // 2. Trade Match & Diversity (Max 35 pts)
      let tradeScore = 0;
      let hasTargetTrade = false;
      if (normalizedTrade) {
        hasTargetTrade = tradesList.some((t) => t.toLowerCase() === normalizedTrade || t.toLowerCase().includes(normalizedTrade));
        const tradeMatchPts = hasTargetTrade ? 25 : 0;
        const diversityBonus = Math.min(10, tradesList.length * 1.5);
        tradeScore = tradeMatchPts + diversityBonus;
      } else {
        tradeScore = Math.min(35, tradesList.length * 3.5);
      }

      // 3. Talent Pool (Max 25 pts)
      let talentScore = 0;
      if (normalizedTrade) {
        talentScore = Math.min(15, tradeWorkers * 5) + Math.min(10, totalWorkers * 2);
      } else {
        talentScore = Math.min(25, totalWorkers * 2.5);
      }

      // 4. Institutional Standing & Verification (Max 15 pts)
      const isGovt = iti.isGovernment || (iti.category && iti.category.toUpperCase() === 'G');
      const govtScore = isGovt ? 8 : 4;
      const ncvtScore = iti.code ? 4 : 0;
      const verifiedDataScore = iti.tradesDataStatus === 'VERIFIED' ? 3 : 1;
      const institutionScore = govtScore + ncvtScore + verifiedDataScore;

      // Composite Score (0 - 100)
      const totalScore = Math.min(100, Math.round(proximityScore + tradeScore + talentScore + institutionScore));

      const reasons = [
        `📍 ${distanceKm} km away (${Math.round(proximityScore)}/25 proximity pts)`,
        hasTargetTrade
          ? `⚡ Offers required trade "${trade}" (${Math.round(tradeScore)}/35 trade pts)`
          : `⚡ ${tradesList.length} trades offered (${Math.round(tradeScore)}/35 trade pts)`,
        totalWorkers > 0
          ? `👥 ${tradeWorkers ? `${tradeWorkers} verified ${trade} candidates, ` : ''}${totalWorkers} total verified active (${Math.round(talentScore)}/25 talent pts)`
          : `👥 0 verified active workers (0/25 talent pts)`,
        isGovt
          ? `🏛️ Government ITI (${Math.round(institutionScore)}/15 accreditation pts)`
          : `🏛️ Private Accredited ITI (${Math.round(institutionScore)}/15 accreditation pts)`,
      ];

      return {
        ...iti,
        distanceKm,
        totalScore,
        scoreBreakdown: {
          proximity: Math.round(proximityScore),
          trade: Math.round(tradeScore),
          talent: Math.round(talentScore),
          institution: Math.round(institutionScore),
        },
        reasons,
        activeWorkersCount: totalWorkers,
        matchingTradeWorkersCount: tradeWorkers,
      };
    });

    // Sort by totalScore desc, then distanceKm asc
    rankedItis.sort((a, b) => b.totalScore - a.totalScore || a.distanceKm - b.distanceKm);

    const results = rankedItis.slice(0, maxResults);

    return res.json({
      success: true,
      origin: { lat: latitude, lng: longitude, radiusKm: radius },
      totalFound: rankedItis.length,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error('Error fetching top nearby ITIs:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
