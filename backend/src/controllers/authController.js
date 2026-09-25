import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, trade, district, department, experienceYears, itiId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const userRole = role.toUpperCase();
    const validRoles = ['WORKER', 'OFFICER'];
    if (!validRoles.includes(userRole)) {
      if (userRole === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Registration for ADMIN is not permitted.' });
      }
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // For Officer registration, district is required
    if (userRole === 'OFFICER' && !district) {
      return res.status(400).json({ success: false, message: 'District is required for Officer registration' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    let profileData = null;

    if (userRole === 'WORKER') {
      profileData = await prisma.workerProfile.create({
        data: {
          userId: user.id,
          fullName: name,
          trade: trade || 'General',
          itiId: itiId || null,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
          isVerified: false,
        },
        include: {
          iti: true,
        },
      });
    } else if (userRole === 'OFFICER') {
      profileData = await prisma.officerProfile.create({
        data: {
          userId: user.id,
          name: name,
          district: district,
          department: department || null,
          isVerified: true,
        },
      });
    }

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
        profileCompleted: userRole === 'OFFICER' ? true : !!(profileData && profileData.trade),
        workerProfile: userRole === 'WORKER' ? profileData : null,
        officerProfile: userRole === 'OFFICER' ? profileData : null,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workerProfile: {
          include: {
            iti: true,
          },
        },
        officerProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let profileCompleted = false;
    if (user.role === 'WORKER') {
      profileCompleted = !!(user.workerProfile && user.workerProfile.trade);
    } else if (user.role === 'OFFICER') {
      profileCompleted = !!(user.officerProfile && user.officerProfile.district);
    } else if (user.role === 'ADMIN') {
      profileCompleted = true;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted,
        workerProfile: user.workerProfile || null,
        officerProfile: user.officerProfile || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: {
          include: {
            iti: true,
          },
        },
        officerProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profileCompleted = false;
    if (user.role === 'WORKER') {
      profileCompleted = !!(user.workerProfile && user.workerProfile.trade);
    } else if (user.role === 'OFFICER') {
      profileCompleted = !!(user.officerProfile && user.officerProfile.district);
    } else if (user.role === 'ADMIN') {
      profileCompleted = true;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        profileCompleted,
      },
    });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
