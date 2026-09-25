import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

/**
 * Helper to update PostGIS location for a WorkerProfile if lat & lng are provided.
 */
async function updateWorkerLocation(workerId, lat, lng) {
  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      await prisma.$executeRawUnsafe(
        `UPDATE "WorkerProfile" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3;`,
        longitude,
        latitude,
        workerId
      );
    }
  }
}

/**
 * Helper to attach coordinates to a WorkerProfile
 */
async function attachWorkerCoordinates(worker) {
  if (!worker) return null;
  try {
    const coords = await prisma.$queryRawUnsafe(
      `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM "WorkerProfile" WHERE id = $1;`,
      worker.id
    );
    if (coords && coords.length > 0) {
      return {
        ...worker,
        lat: coords[0].lat,
        lng: coords[0].lng,
      };
    }
  } catch (e) {
    // If location is null or PostGIS query fails
  }
  return { ...worker, lat: null, lng: null };
}

// POST /api/v1/workers - Admin or Officer creation
export const createWorker = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      trade,
      certificationGrade,
      experienceYears,
      availabilityStatus = 'AVAILABLE',
      itiId,
      skills = [],
      languages = [],
      certifications = [],
      isVerified = false,
      lat,
      lng,
    } = req.body;

    if (!email || !fullName || !trade) {
      return res.status(400).json({ success: false, message: 'Email, fullName, and trade are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Only Admin can directly mark worker as verified upon creation
    const canVerify = req.user.role === 'ADMIN';
    const finalVerification = canVerify ? Boolean(isVerified) : false;

    const defaultPassword = password || 'Worker@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'WORKER',
      },
    });

    const workerProfile = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        fullName,
        trade,
        certificationGrade: certificationGrade || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        availabilityStatus,
        itiId: itiId || null,
        skills: Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean),
        languages: Array.isArray(languages) ? languages : String(languages).split(',').map(s => s.trim()).filter(Boolean),
        certifications: Array.isArray(certifications) ? certifications : String(certifications).split(',').map(s => s.trim()).filter(Boolean),
        isVerified: finalVerification,
      },
      include: {
        iti: true,
        user: {
          select: { email: true, createdAt: true },
        },
      },
    });

    if (lat !== undefined && lng !== undefined) {
      await updateWorkerLocation(workerProfile.id, lat, lng);
    }

    const fullWorker = await attachWorkerCoordinates(workerProfile);
    return res.status(201).json({ success: true, worker: fullWorker });
  } catch (err) {
    console.error('Error creating worker:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// GET /api/v1/workers - List workers with optional filters
export const getWorkers = async (req, res) => {
  try {
    const { trade, district, availabilityStatus, isVerified, itiId, minExperience, search } = req.query;

    const where = {};
    if (trade) where.trade = { equals: trade, mode: 'insensitive' };
    if (availabilityStatus) where.availabilityStatus = availabilityStatus;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true' || isVerified === true;
    if (itiId) where.itiId = itiId;
    if (minExperience) where.experienceYears = { gte: parseInt(minExperience, 10) };

    if (district) {
      where.iti = {
        district: { equals: district, mode: 'insensitive' },
      };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { trade: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
      ];
    }

    const workers = await prisma.workerProfile.findMany({
      where,
      include: {
        iti: true,
        user: {
          select: { email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const workersWithCoords = await Promise.all(workers.map(attachWorkerCoordinates));
    return res.json({ success: true, workers: workersWithCoords, count: workersWithCoords.length });
  } catch (err) {
    console.error('Error fetching workers:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/workers/:id
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: {
        iti: true,
        user: {
          select: { id: true, email: true, createdAt: true },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    const fullWorker = await attachWorkerCoordinates(worker);
    return res.json({ success: true, worker: fullWorker });
  } catch (err) {
    console.error('Error fetching worker by ID:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/v1/workers/:id
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.workerProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Permission check: Admin or the worker themself
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = req.user.id === existing.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify this profile' });
    }

    const {
      fullName,
      trade,
      certificationGrade,
      experienceYears,
      availabilityStatus,
      itiId,
      skills,
      languages,
      certifications,
      isVerified,
      lat,
      lng,
    } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (trade !== undefined) updateData.trade = trade;
    if (certificationGrade !== undefined) updateData.certificationGrade = certificationGrade;
    if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears, 10);
    if (availabilityStatus !== undefined) updateData.availabilityStatus = availabilityStatus;
    if (itiId !== undefined) updateData.itiId = itiId;
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (languages !== undefined) {
      updateData.languages = Array.isArray(languages) ? languages : String(languages).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (certifications !== undefined) {
      updateData.certifications = Array.isArray(certifications) ? certifications : String(certifications).split(',').map(s => s.trim()).filter(Boolean);
    }
    // Only Admin can verify/unverify
    if (isAdmin && isVerified !== undefined) {
      updateData.isVerified = Boolean(isVerified);
    }

    const updated = await prisma.workerProfile.update({
      where: { id },
      data: updateData,
      include: {
        iti: true,
        user: { select: { email: true } },
      },
    });

    if (lat !== undefined && lng !== undefined) {
      await updateWorkerLocation(id, lat, lng);
    }

    const fullWorker = await attachWorkerCoordinates(updated);
    return res.json({ success: true, worker: fullWorker });
  } catch (err) {
    console.error('Error updating worker:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// PATCH /api/v1/workers/:id/verify - Admin only
export const verifyWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified = true } = req.body;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only can verify workers' });
    }

    const updated = await prisma.workerProfile.update({
      where: { id },
      data: { isVerified: Boolean(isVerified) },
      include: {
        iti: true,
        user: { select: { email: true } },
      },
    });

    const fullWorker = await attachWorkerCoordinates(updated);
    return res.json({ success: true, worker: fullWorker, message: `Worker ${isVerified ? 'verified' : 'unverified'} successfully` });
  } catch (err) {
    console.error('Error verifying worker:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// DELETE /api/v1/workers/:id - Admin only
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only can delete workers' });
    }

    const existing = await prisma.workerProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Delete associated User (which cascades or profile first)
    await prisma.workerProfile.delete({ where: { id } });
    await prisma.user.delete({ where: { id: existing.userId } }).catch(() => {});

    return res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Error deleting worker:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// GET /api/v1/workers/search?lat=&lng=&trade=&district=
export const searchWorkers = async (req, res) => {
  try {
    const {
      lat,
      lng,
      trade,
      district,
      radiusKm = 50,
      availabilityStatus,
      isVerified,
      minExperience,
      limit = 100,
    } = req.query;

    const hasCoords = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
    const latitude = hasCoords ? parseFloat(lat) : null;
    const longitude = hasCoords ? parseFloat(lng) : null;
    const radiusMeters = parseFloat(radiusKm) * 1000;
    const maxResults = parseInt(limit, 10) || 100;

    let workers = [];

    if (hasCoords && !isNaN(latitude) && !isNaN(longitude)) {
      // Raw PostGIS query: ST_DWithin within radiusKm (default 50km), ordered by distance
      workers = await prisma.$queryRawUnsafe(
        `SELECT 
          w.id,
          w."userId",
          w."fullName",
          w.trade,
          w."certificationGrade",
          w."experienceYears",
          w."availabilityStatus",
          w."isVerified",
          w.skills,
          w.languages,
          w.certifications,
          w."resumeUrl",
          w."createdAt",
          w."itiId",
          i.name as "itiName",
          i.code as "itiCode",
          i.district as "itiDistrict",
          i.state as "itiState",
          i."isGovernment" as "itiIsGovernment",
          u.email as "userEmail",
          ST_Y(COALESCE(w.location, i.location)::geometry) as lat,
          ST_X(COALESCE(w.location, i.location)::geometry) as lng,
          ROUND(ST_Distance(
            COALESCE(w.location, i.location),
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          )::numeric, 1) as "distanceMeters",
          ROUND((ST_Distance(
            COALESCE(w.location, i.location),
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) / 1000.0)::numeric, 2) as "distanceKm"
        FROM "WorkerProfile" w
        LEFT JOIN "ITI" i ON w."itiId" = i.id
        JOIN "User" u ON w."userId" = u.id
        WHERE 
          COALESCE(w.location, i.location) IS NOT NULL
          AND ST_DWithin(
            COALESCE(w.location, i.location),
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
          AND ($4::text IS NULL OR LOWER(w.trade) = LOWER($4))
          AND ($5::text IS NULL OR LOWER(i.district) = LOWER($5))
          AND ($6::text IS NULL OR w."availabilityStatus" = $6)
          AND ($7::boolean IS NULL OR w."isVerified" = $7)
          AND ($8::int IS NULL OR w."experienceYears" >= $8)
        ORDER BY "distanceMeters" ASC
        LIMIT $9;`,
        longitude,
        latitude,
        radiusMeters,
        trade || null,
        district || null,
        availabilityStatus || null,
        isVerified !== undefined ? (isVerified === 'true' || isVerified === true) : null,
        minExperience ? parseInt(minExperience, 10) : null,
        maxResults
      );
    } else {
      // Non-coordinate fallback: filter by district/trade/etc., ordered by most recent
      workers = await prisma.$queryRawUnsafe(
        `SELECT 
          w.id,
          w."userId",
          w."fullName",
          w.trade,
          w."certificationGrade",
          w."experienceYears",
          w."availabilityStatus",
          w."isVerified",
          w.skills,
          w.languages,
          w.certifications,
          w."resumeUrl",
          w."createdAt",
          w."itiId",
          i.name as "itiName",
          i.code as "itiCode",
          i.district as "itiDistrict",
          i.state as "itiState",
          i."isGovernment" as "itiIsGovernment",
          u.email as "userEmail",
          ST_Y(COALESCE(w.location, i.location)::geometry) as lat,
          ST_X(COALESCE(w.location, i.location)::geometry) as lng,
          NULL::numeric as "distanceMeters",
          NULL::numeric as "distanceKm"
        FROM "WorkerProfile" w
        LEFT JOIN "ITI" i ON w."itiId" = i.id
        JOIN "User" u ON w."userId" = u.id
        WHERE 
          ($1::text IS NULL OR LOWER(w.trade) = LOWER($1))
          AND ($2::text IS NULL OR LOWER(i.district) = LOWER($2))
          AND ($3::text IS NULL OR w."availabilityStatus" = $3)
          AND ($4::boolean IS NULL OR w."isVerified" = $4)
          AND ($5::int IS NULL OR w."experienceYears" >= $5)
        ORDER BY w."createdAt" DESC
        LIMIT $6;`,
        trade || null,
        district || null,
        availabilityStatus || null,
        isVerified !== undefined ? (isVerified === 'true' || isVerified === true) : null,
        minExperience ? parseInt(minExperience, 10) : null,
        maxResults
      );
    }

    return res.json({
      success: true,
      query: {
        lat: latitude,
        lng: longitude,
        radiusKm: hasCoords ? parseFloat(radiusKm) : null,
        trade: trade || null,
        district: district || null,
      },
      count: workers.length,
      workers,
    });
  } catch (err) {
    console.error('Error searching workers:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
