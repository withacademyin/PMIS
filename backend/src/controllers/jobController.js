import prisma from '../config/prisma.js';
import { evaluateSkills } from '../services/matchingService.js';

export const getJobs = async (req, res) => {
  try {
    const jobs = await prisma.jobListing.findMany({
      include: { recruiter: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: jobs });
  } catch (err) {
    console.error('Fetch jobs error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createJob = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'RECRUITER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, description = '', recruiterId, requiredSkills = [] } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    if (!recruiterId || typeof recruiterId !== 'string' || !recruiterId.trim()) {
      return res.status(400).json({ success: false, message: 'Recruiter ID is required.' });
    }

    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterId.trim() },
    });

    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const sanitizedSkills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const job = await prisma.jobListing.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        recruiterId: recruiterId.trim(),
        requiredSkills: sanitizedSkills,
      },
    });

    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error('Create job error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getJobApplicants = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid job id is required.' });
    }

    const job = await prisma.jobListing.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: id },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { matchScore: 'desc' },
    });

    const enriched = applications.map((app) => ({
      ...app,
      skillBreakdown: evaluateSkills(app.student.skills, job.requiredSkills, app.student.skillScores),
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Fetch applicants error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllApplicantsForRecruiter = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'RECRUITER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: user.id },
    });

    if (!recruiterProfile) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const applications = await prisma.application.findMany({
      where: {
        job: { recruiterId: recruiterProfile.id },
      },
      include: {
        job: true,
        student: {
          include: { user: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const enriched = applications.map((app) => ({
      ...app,
      skillBreakdown: evaluateSkills(app.student.skills, app.job.requiredSkills, app.student.skillScores),
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Fetch all applicants error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
