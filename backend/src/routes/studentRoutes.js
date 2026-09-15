import express from 'express';
import multer from 'multer';
import requireAuth from '../middlewares/auth.js';
import { onboardStudent, generateAssessment, evaluateAssessment } from '../controllers/studentController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/students/onboarding
router.post('/onboarding', requireAuth, upload.single('resume'), onboardStudent);

// POST /api/students/assessment/generate
router.post('/assessment/generate', requireAuth, generateAssessment);

// POST /api/students/assessment/evaluate
router.post('/assessment/evaluate', requireAuth, evaluateAssessment);

export default router;
