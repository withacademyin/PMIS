import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production');
}

const signingSecret = JWT_SECRET || 'fallback_secret_key_for_dev';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, signingSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: {
          select: {
            id: true,
            fullName: true,
            trade: true,
            itiId: true,
            isVerified: true,
          },
        },
        officerProfile: {
          select: {
            id: true,
            name: true,
            district: true,
            department: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access, token failed' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userRole = req.user.role?.toUpperCase();
    const normalizedRoles = roles.map(r => r.toUpperCase());
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${userRole}' does not have required permissions (${normalizedRoles.join(', ')})`,
      });
    }
    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireOfficer = requireRole('OFFICER', 'ADMIN');
export const requireWorker = requireRole('WORKER', 'ADMIN');

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, signingSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: true,
        officerProfile: true,
      },
    });

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}

export default requireAuth;
