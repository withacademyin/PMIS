import prisma from '../config/prisma.js';
import crypto from 'crypto';

/**
 * Helper to update PostGIS location for an ITI if lat & lng are provided.
 */
async function updateItiLocation(itiId, lat, lng) {
  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!isNaN(latitude) && !isNaN(longitude)) {
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

    if (!name || !district || !state) {
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

    const existing = await prisma.iTI.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ITI not found' });
    }

    const updated = await prisma.iTI.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        code: code !== undefined ? code : existing.code,
        district: district !== undefined ? district : existing.district,
        state: state !== undefined ? state : existing.state,
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
