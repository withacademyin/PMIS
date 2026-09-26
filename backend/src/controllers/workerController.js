import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

/**
 * Helper to update PostGIS location for a WorkerProfile if lat & lng are provided.
 */
async function updateWorkerLocation(workerId, lat, lng) {
  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
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

    if (typeof email !== 'string' || typeof fullName !== 'string' || typeof trade !== 'string' || !email.trim() || !fullName.trim() || !trade.trim()) {
      return res.status(400).json({ success: false, message: 'Email, fullName, and trade are required' });
    }
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Only administrators may provision worker accounts' });
    if (password !== undefined && (typeof password !== 'string' || password.length < 10 || password.length > 128)) {
      return res.status(400).json({ success: false, message: 'Password must be between 10 and 128 characters' });
    }
    if (experienceYears !== undefined && (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 80)) {
      return res.status(400).json({ success: false, message: 'experienceYears must be an integer from 0 to 80' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Only Admin can directly mark worker as verified upon creation
    const canVerify = req.user.role === 'ADMIN';
    const finalVerification = canVerify ? Boolean(isVerified) : false;

    if (!password) return res.status(400).json({ success: false, message: 'A temporary password is required when an administrator creates a worker account' });
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: 'WORKER',
      },
    });

    const workerProfile = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        trade: trade.trim(),
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
    if (!['ADMIN', 'OFFICER'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Worker directory is available to administrators and nodal officers' });
    if (req.user.role === 'OFFICER' && !req.user.officerProfile?.district) return res.status(403).json({ success: false, message: 'Officer district is not configured' });

    const where = {};
    if (req.user.role === 'OFFICER') {
      where.iti = { district: { equals: req.user.officerProfile.district, mode: 'insensitive' } };
      where.isVerified = true;
      where.availabilityStatus = 'AVAILABLE';
    }
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
    if (!['ADMIN', 'OFFICER', 'WORKER'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: {
        iti: true,
        user: {
          select: { id: true, createdAt: true },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }
    if (req.user.role === 'OFFICER' && (!worker.isVerified || worker.availabilityStatus !== 'AVAILABLE' || worker.iti?.district?.toLowerCase() !== req.user.officerProfile?.district?.toLowerCase())) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }
    if (req.user.role === 'WORKER' && req.user.id !== worker.userId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const fullWorker = await attachWorkerCoordinates(worker);
    if (req.user.role === 'ADMIN' || req.user.id === worker.userId) {
      fullWorker.user.email = (await prisma.user.findUnique({ where: { id: worker.userId }, select: { email: true } }))?.email;
    }
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

    if (fullName !== undefined && (typeof fullName !== 'string' || !fullName.trim())) return res.status(400).json({ success: false, message: 'fullName must be a non-empty string' });
    if (trade !== undefined && (typeof trade !== 'string' || !trade.trim())) return res.status(400).json({ success: false, message: 'trade must be a non-empty string' });
    if (experienceYears !== undefined && (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 80)) return res.status(400).json({ success: false, message: 'experienceYears must be an integer from 0 to 80' });
    if (availabilityStatus !== undefined && !['AVAILABLE', 'EMPLOYED', 'UNAVAILABLE'].includes(availabilityStatus)) return res.status(400).json({ success: false, message: 'Invalid availabilityStatus' });
    if (itiId !== undefined && itiId !== null && typeof itiId !== 'string') return res.status(400).json({ success: false, message: 'itiId must be a string or null' });
    if (!isAdmin && itiId !== undefined && itiId !== existing.itiId) return res.status(403).json({ success: false, message: 'Only administrators may change ITI affiliation' });

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (trade !== undefined) updateData.trade = trade.trim();
    if (certificationGrade !== undefined) updateData.certificationGrade = certificationGrade;
    if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);
    if (availabilityStatus !== undefined) updateData.availabilityStatus = availabilityStatus;
    if (isAdmin && itiId !== undefined) updateData.itiId = itiId;
    const parseStringList = (value) => {
      if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value.map((item) => item.trim()).filter(Boolean);
      if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
      return null;
    };
    if (skills !== undefined) {
      updateData.skills = parseStringList(skills);
      if (!updateData.skills) return res.status(400).json({ success: false, message: 'skills must be a list of strings' });
    }
    if (languages !== undefined) {
      updateData.languages = parseStringList(languages);
      if (!updateData.languages) return res.status(400).json({ success: false, message: 'languages must be a list of strings' });
    }
    if (certifications !== undefined) {
      updateData.certifications = parseStringList(certifications);
      if (!updateData.certifications) return res.status(400).json({ success: false, message: 'certifications must be a list of strings' });
    }
    // Only Admin can verify/unverify
    if (isVerified !== undefined && typeof isVerified !== 'boolean') return res.status(400).json({ success: false, message: 'isVerified must be a boolean' });
    if (!isAdmin && isVerified !== undefined) return res.status(403).json({ success: false, message: 'Only administrators may change verification status' });
    if (isAdmin && isVerified !== undefined) updateData.isVerified = isVerified;

    const updated = await prisma.workerProfile.update({
      where: { id },
      data: updateData,
      include: {
        iti: true,
        user: { select: { email: true } },
      },
    });

    if ((lat !== undefined) !== (lng !== undefined)) return res.status(400).json({ success: false, message: 'lat and lng must be provided together' });
    if (lat !== undefined && !isAdmin) return res.status(403).json({ success: false, message: 'Only administrators may update worker location' });
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
    const safeRadiusMeters = Number.isFinite(radiusMeters) && radiusMeters > 0 ? Math.min(radiusMeters, 200000) : null;
    const safeLimit = Number.isFinite(maxResults) ? Math.max(1, Math.min(maxResults, 100)) : 100;
    const validCoordinates = !hasCoords || (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
    if (!validCoordinates) return res.status(400).json({ success: false, message: 'Invalid latitude or longitude' });
    if (!safeRadiusMeters) return res.status(400).json({ success: false, message: 'radiusKm must be greater than zero' });

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
        safeRadiusMeters,
        trade || null,
        district || null,
        availabilityStatus || null,
        isVerified !== undefined ? (isVerified === 'true' || isVerified === true) : null,
        minExperience ? parseInt(minExperience, 10) : null,
        safeLimit
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
          ST_Y(COALESCE(w.location, i.location)::geometry) as lat,
          ST_X(COALESCE(w.location, i.location)::geometry) as lng,
          NULL::numeric as "distanceMeters",
          NULL::numeric as "distanceKm"
        FROM "WorkerProfile" w
        LEFT JOIN "ITI" i ON w."itiId" = i.id
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
        safeLimit
      );
    }

    return res.json({
      success: true,
      query: {
        lat: latitude,
        lng: longitude,
        radiusKm: hasCoords ? safeRadiusMeters / 1000 : null,
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
