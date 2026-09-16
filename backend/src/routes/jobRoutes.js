import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { getJobs, createJob, getJobApplicants, getAllApplicantsForRecruiter } from '../controllers/jobController.js';

const router = express.Router();

// GET /api/jobs
router.get('/', getJobs);

// POST /api/jobs
router.post('/', requireAuth, createJob);

// GET /api/jobs/applicants/all
router.get('/applicants/all', requireAuth, getAllApplicantsForRecruiter);

// GET /api/jobs/:id/applicants
router.get('/:id/applicants', requireAuth, getJobApplicants);

export default router;
