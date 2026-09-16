import prisma from '../config/prisma.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 1 },
      });
    }

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { allowedColleges, allowedCourses, allowedEmailDomains } = req.body;

    const dataToUpdate = {};
    if (allowedColleges !== undefined) dataToUpdate.allowedColleges = Array.isArray(allowedColleges) ? allowedColleges : [];
    if (allowedCourses !== undefined) dataToUpdate.allowedCourses = Array.isArray(allowedCourses) ? allowedCourses : [];
    if (allowedEmailDomains !== undefined) dataToUpdate.allowedEmailDomains = Array.isArray(allowedEmailDomains) ? allowedEmailDomains : [];

    const updatedSettings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: {
        id: 1,
        ...dataToUpdate,
      },
    });

    return res.json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
