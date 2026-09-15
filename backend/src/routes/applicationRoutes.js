import express from 'express';
import requireAuth from '../middlewares/auth.js';
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  getApplicationQuestions,
  evaluateApplication,
} from '../controllers/applicationController.js';

const router = express.Router();

// GET /api/applications
router.get('/', requireAuth, getApplications);

// POST /api/applications
router.post('/', requireAuth, createApplication);

// PATCH /api/applications/:id/status
router.patch('/:id/status', requireAuth, updateApplicationStatus);

// GET /api/applications/:id/questions
router.get('/:id/questions', requireAuth, getApplicationQuestions);

// POST /api/applications/:id/evaluate
router.post('/:id/evaluate', requireAuth, evaluateApplication);

export default router;
