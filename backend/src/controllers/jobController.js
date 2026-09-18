import prisma from '../config/prisma.js';
import { evaluateSkills } from '../services/matchingService.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { extractJdDetails } from '../services/jdParserService.js';

export const parseJD = async (req, res) => {
  try {
    let finalJdText = null;

    if (req.file && req.file.buffer) {
      try {
        if (req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          finalJdText = pdfData.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          finalJdText = result.value;
        } else if (req.file.mimetype === 'application/msword') {
          const extractor = new WordExtractor();
          const extracted = await extractor.extract(req.file.buffer);
          finalJdText = extracted.getBody();
        } else {
          return res.status(400).json({ success: false, message: 'Unsupported file type.' });
        }
      } catch (err) {
        console.error('File parsing error:', err);
        return res.status(400).json({ success: false, message: 'Failed to parse the uploaded document.' });
      }

      if (!finalJdText || !finalJdText.trim()) {
        return res.status(400).json({ success: false, message: 'The uploaded document contains no extractable text.' });
      }
    } else if (req.body.jdText && typeof req.body.jdText === 'string') {
      finalJdText = req.body.jdText.trim();
    } else {
      return res.status(400).json({ success: false, message: 'No file or jdText provided for parsing.' });
    }

    const aiDetails = await extractJdDetails(finalJdText);
    
    if (aiDetails) {
      return res.json({ success: true, data: { ...aiDetails, jdText: finalJdText } });
    } else {
      return res.status(500).json({ success: false, message: 'AI parsing failed. Please fill manually.' });
    }
  } catch (err) {
    console.error('Parse JD error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getJobs = async (req, res) => {
  try {
    let whereClause = {};

    if (req.user && req.user.role === 'RECRUITER') {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (recruiterProfile) {
        if (recruiterProfile.companyId) {
          whereClause = {
            recruiter: {
              companyId: recruiterProfile.companyId,
            }
          };
        } else {
          whereClause = {
            recruiterId: recruiterProfile.id,
          };
        }
      } else {
        whereClause = { id: 'invalid-no-profile' }; // Ensure no jobs are returned
      }
    }

    const jobs = await prisma.jobListing.findMany({
      where: whereClause,
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

    const { title, description = '', recruiterId, requiredSkills = [], jdText: manualJdText } = req.body;

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

    let finalJdText = null;

    if (req.file && req.file.buffer) {
      try {
        if (req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          finalJdText = pdfData.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          finalJdText = result.value;
        } else if (req.file.mimetype === 'application/msword') {
          const extractor = new WordExtractor();
          const extracted = await extractor.extract(req.file.buffer);
          finalJdText = extracted.getBody();
        } else {
          return res.status(400).json({ success: false, message: 'Unsupported file type.' });
        }
      } catch (err) {
        console.error('File parsing error:', err);
        return res.status(400).json({ success: false, message: 'Failed to parse the uploaded document.' });
      }

      if (!finalJdText || !finalJdText.trim()) {
        return res.status(400).json({ success: false, message: 'The uploaded document contains no extractable text.' });
      }
    } else if (manualJdText && typeof manualJdText === 'string') {
      finalJdText = manualJdText.trim();
    }

    const sanitizedSkills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : (typeof requiredSkills === 'string' ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const job = await prisma.jobListing.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        jdText: finalJdText,
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
        job: recruiterProfile.companyId ? { recruiter: { companyId: recruiterProfile.companyId } } : { recruiterId: recruiterProfile.id },
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

export const getTopCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const job = await prisma.jobListing.findUnique({ 
      where: { id },
      include: { recruiter: true }
    });
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (user.role === 'RECRUITER') {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId: user.id },
      });
      
      const isOwner = recruiterProfile && (
        job.recruiterId === recruiterProfile.id || 
        (recruiterProfile.companyId && job.recruiter.companyId === recruiterProfile.companyId)
      );

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this job.' });
      }
    }

    // Find all students who have NOT applied to this job yet
    const appliedStudentIds = (await prisma.application.findMany({
      where: { jobId: id },
      select: { studentId: true }
    })).map(a => a.studentId);

    const students = await prisma.studentProfile.findMany({
      where: {
        id: { notIn: appliedStudentIds }
      },
      include: { user: true }
    });

    const enriched = students.map((student) => ({
      student,
      skillBreakdown: evaluateSkills(student.skills, job.requiredSkills, student.skillScores),
    }));

    // Sort by match score
    enriched.sort((a, b) => b.skillBreakdown.score - a.skillBreakdown.score);

    // Return top 50
    return res.json({ success: true, data: enriched.slice(0, 50) });
  } catch (err) {
    console.error('Fetch top candidates error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const shortlistCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    const user = req.user;

    if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const job = await prisma.jobListing.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const existingApplication = await prisma.application.findFirst({
      where: { jobId: id, studentId }
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Candidate already applied or shortlisted.' });
    }

    const application = await prisma.application.create({
      data: {
        studentId,
        jobId: id,
        status: 'SHORTLISTED'
      }
    });

    return res.json({ success: true, data: application });
  } catch (err) {
    console.error('Shortlist candidate error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
