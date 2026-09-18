import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role.toUpperCase();

    if (userRole === 'RECRUITER' || userRole === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Registration for this role is not permitted.' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    let profileData = {};
    if (userRole === 'LEARNER') {
      profileData = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          fullName: name,
          college: '',
        },
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: false,
        studentProfile: userRole === 'LEARNER' ? profileData : null,
        recruiterProfile: userRole === 'RECRUITER' ? profileData : null,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
        studentProfile: true,
        recruiterProfile: true,
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
    if (user.role === 'LEARNER') {
      profileCompleted = !!(user.studentProfile && user.studentProfile.college && user.studentProfile.skills.length > 0);
    } else if (user.role === 'RECRUITER' || user.role === 'ADMIN') {
      profileCompleted = true; // Recruiter and Admin don't need student onboarding
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileCompleted,
        studentProfile: user.studentProfile || null,
        recruiterProfile: user.recruiterProfile || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
