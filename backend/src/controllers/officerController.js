import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

/**
 * Dedicated registration endpoint for Nodal Officers
 * POST /api/v1/officers/register
 */
export const registerOfficer = async (req, res) => {
  try {
    const { name, email, password, district, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!district || !district.trim()) {
      return res.status(400).json({
        success: false,
        message: 'District is required for Nodal Officer registration. Please provide your assigned district.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'OFFICER',
      },
    });

    const officerProfile = await prisma.officerProfile.create({
      data: {
        userId: user.id,
        name: name.trim(),
        district: district.trim(),
        department: department ? department.trim() : null,
        isVerified: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: true,
        officerProfile,
      },
    });
  } catch (err) {
    console.error('Error registering officer:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
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

    const existing = await prisma.officerProfile.findUnique({ where: { userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Officer profile not found' });
    }

    const updated = await prisma.officerProfile.update({
      where: { userId: req.user.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        district: district !== undefined ? district.trim() : existing.district,
        department: department !== undefined ? department.trim() : existing.department,
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
