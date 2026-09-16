import prisma from '../config/prisma.js';

export const getInternships = async (req, res) => {
  try {
    const userRole = req.user.role;
    let internships = [];

    if (userRole === 'RECRUITER') {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!recruiterProfile) {
        return res.status(404).json({ success: false, message: 'Recruiter profile not found' });
      }
      internships = await prisma.internship.findMany({
        where: {
          application: {
            job: {
              recruiterId: recruiterProfile.id,
            },
          },
        },
        include: {
          application: {
            include: {
              student: true,
              job: true,
            },
          },
          kras: {
            include: {
              items: true,
            },
          },
        },
      });
    } else if (userRole === 'LEARNER') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      internships = await prisma.internship.findMany({
        where: {
          application: {
            studentId: studentProfile.id,
          },
        },
        include: {
          application: {
            include: {
              job: {
                include: {
                  recruiter: true,
                },
              },
            },
          },
          kras: {
            include: {
              items: true,
              submissions: true,
            },
          },
        },
      });
    }

    res.json({ success: true, data: internships });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch internships' });
  }
};

export const createInternship = async (req, res) => {
  try {
    const { applicationId, startDate, endDate } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!recruiterProfile || application.job.recruiterId !== recruiterProfile.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to create internship for this application' });
    }

    if (application.status !== 'SELECTED') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'SELECTED' },
      });
    }

    const internship = await prisma.internship.create({
      data: {
        applicationId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'ONBOARDING',
      },
      include: {
        application: {
          include: { student: true, job: true }
        }
      }
    });

    res.status(201).json({ success: true, data: internship });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ success: false, message: 'Failed to create internship' });
  }
};
