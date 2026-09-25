import prisma from '../config/prisma.js';

export const getWorkers = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const workers = await prisma.workerProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            createdAt: true,
          },
        },
        iti: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ success: true, data: workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyWorker = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { id } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid payload: isVerified must be boolean' });
    }

    const updatedWorker = await prisma.workerProfile.update({
      where: { id },
      data: { isVerified },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        iti: true,
      },
    });

    return res.json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error('Error verifying worker:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Aliases for compatibility
export const getStudents = getWorkers;
export const verifyStudent = verifyWorker;
