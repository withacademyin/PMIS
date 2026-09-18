import express from 'express';
import multer from 'multer';
import requireAuth, { optionalAuth } from '../middlewares/auth.js';
import { getJobs, createJob, getJobApplicants, getAllApplicantsForRecruiter, parseJD, getTopCandidates, shortlistCandidate } from '../controllers/jobController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
    }
  }
});

// GET /api/jobs
router.get('/', optionalAuth, getJobs);

// POST /api/jobs
router.post('/', requireAuth, upload.single('jdFile'), createJob);

// POST /api/jobs/parse-jd
router.post('/parse-jd', requireAuth, upload.single('jdFile'), parseJD);

// GET /api/jobs/applicants/all
router.get('/applicants/all', requireAuth, getAllApplicantsForRecruiter);

// GET /api/jobs/:id/applicants
router.get('/:id/applicants', requireAuth, getJobApplicants);

// GET /api/jobs/:id/top-candidates
router.get('/:id/top-candidates', requireAuth, getTopCandidates);

// POST /api/jobs/:id/shortlist-student
router.post('/:id/shortlist-student', requireAuth, shortlistCandidate);

export default router;
