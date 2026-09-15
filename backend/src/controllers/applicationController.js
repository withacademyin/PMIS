import prisma from '../config/prisma.js';
import { evaluateSkills } from '../services/matchingService.js';
import { notifyApplicationSubmitted, notifyStatusUpdated } from '../services/notificationService.js';
import { VALID_STATUSES } from '../utils/applicationStatuses.js';
import { generateScreeningQuestions, evaluateAssessment } from '../services/aiService.js';

export const getApplications = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: studentProfile.id },
      include: {
        job: {
          include: { recruiter: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json({ success: true, data: applications });
  } catch (err) {
    console.error('Fetch student applications error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createApplication = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { studentId, jobId } = req.body;

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    const cleanStudentId = studentId.trim();
    const cleanJobId = jobId.trim();

    const existing = await prisma.application.findUnique({
      where: {
        studentId_jobId: {
          studentId: cleanStudentId,
          jobId: cleanJobId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Candidate has already applied to this job listing.',
      });
    }

    const [student, job] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { id: cleanStudentId },
        include: { user: true },
      }),
      prisma.jobListing.findUnique({
        where: { id: cleanJobId },
        include: { recruiter: true },
      }),
    ]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    const { score } = evaluateSkills(student.skills, job.requiredSkills, student.skillScores);

    const application = await prisma.application.create({
      data: {
        studentId: cleanStudentId,
        jobId: cleanJobId,
        matchScore: score,
        status: 'APPLIED',
      },
    });

    await notifyApplicationSubmitted({
      studentName: student.fullName,
      studentEmail: student.user.email,
      jobTitle: job.title,
      companyName: job.recruiter.companyName,
      matchScore: score,
    });

    return res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error('Create application error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Candidate has already applied to this job listing.',
      });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { status, interviewDate, interviewLink } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid application id is required.' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        job: { include: { recruiter: true } },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    let parsedDate = undefined;
    if (interviewDate) {
      const d = new Date(interviewDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid interview date format.' });
      }
      parsedDate = d;
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(parsedDate && { interviewDate: parsedDate }),
        ...(interviewLink && { interviewLink: String(interviewLink).trim() }),
      },
    });

    await notifyStatusUpdated({
      studentName: application.student.fullName,
      studentEmail: application.student.user.email,
      jobTitle: application.job.title,
      companyName: application.job.recruiter.companyName,
      status: status || application.status,
      interviewDate: parsedDate || application.interviewDate,
      interviewLink: interviewLink || application.interviewLink,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplicationQuestions = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        job: true,
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const questions = await generateScreeningQuestions({
      jobTitle: application.job.title,
      jobDescription: application.job.description,
      requiredSkills: application.job.requiredSkills,
      candidateSkills: application.student.skills,
    });

    return res.json({ success: true, data: { applicationId: id, questions } });
  } catch (err) {
    console.error('Screening questions error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const evaluateApplication = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'LEARNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { answers = [] } = req.body;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        job: true,
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const { aiScore, aiFeedback } = await evaluateAssessment({
      jobTitle: application.job.title,
      requiredSkills: application.job.requiredSkills,
      questionsAndAnswers: Array.isArray(answers) ? answers : [],
    });

    const updated = await prisma.application.update({
      where: { id },
      data: {
        aiScore,
        aiFeedback,
        status: aiScore >= 70 ? 'SHORTLISTED' : application.status,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Assessment evaluation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
