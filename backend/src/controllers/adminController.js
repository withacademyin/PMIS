import prisma from '../config/prisma.js';

export const getStudents = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: 'Forbidden' });
    }

    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: 'desc',
        },
      },
    });

    return res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyStudent = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const updatedStudent = await prisma.studentProfile.update({
      where: { id },
      data: { isVerified },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    return res.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error verifying student:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
