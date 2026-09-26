import prisma from '../config/prisma.js';

/**
 * Officer onboarding is invitation-only so district scope cannot be self-assigned.
 */
export const registerOfficer = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Officer accounts require an administrator invitation.' });
};

/**
 * GET /api/v1/officers/me - Get authenticated officer profile
 */
export const getMyOfficerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Officer access required' });
    }

    const officer = await prisma.officerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { requirements: true, shortlists: true },
        },
      },
    });

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer profile not found' });
    }

    return res.json({ success: true, officerProfile: officer });
  } catch (err) {
    console.error('Error fetching officer profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT/PATCH /api/v1/officers/me - Update authenticated officer profile
 */
export const updateMyOfficerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Officer access required' });
    }

    const { name, district, department } = req.body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string' });
    }
    if (district !== undefined) {
      return res.status(403).json({ success: false, message: 'District assignment can only be changed by an administrator' });
    }
    if (department !== undefined && department !== null && typeof department !== 'string') {
      return res.status(400).json({ success: false, message: 'Department must be a string' });
    }

    const existing = await prisma.officerProfile.findUnique({ where: { userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Officer profile not found' });
    }

    const updated = await prisma.officerProfile.update({
      where: { userId: req.user.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        district: existing.district,
        department: department !== undefined ? (department === null ? null : department.trim()) : existing.department,
      },
    });

    return res.json({ success: true, officerProfile: updated });
  } catch (err) {
    console.error('Error updating officer profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/officers - List all officers (Admin only)
 */
export const getOfficers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { district, search } = req.query;
    const where = {};
    if (district) where.district = { equals: district, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const officers = await prisma.officerProfile.findMany({
      where,
      include: {
        user: { select: { email: true, createdAt: true } },
        _count: { select: { requirements: true, shortlists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: officers.length, officers });
  } catch (err) {
    console.error('Error fetching officers:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/officers/:id - Get specific officer
 */
export const getOfficerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const officer = await prisma.officerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true } },
        requirements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { requirements: true, shortlists: true } },
      },
    });

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    return res.json({ success: true, officer });
  } catch (err) {
    console.error('Error fetching officer by ID:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
