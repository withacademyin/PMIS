import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

export async function requireAuth(req) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Not authorized, no token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      throw new Error('Not authorized, user not found');
    }

    return user;
  } catch (error) {
    throw new Error('Not authorized, token failed');
  }
}
