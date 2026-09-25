import express from 'express';
import requireAuth, { requireAdmin } from '../middlewares/auth.js';
import { getWorkers, verifyWorker, getStudents, verifyStudent } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/v1/admin/workers
router.get('/workers', requireAuth, requireAdmin, getWorkers);
router.get('/students', requireAuth, requireAdmin, getStudents);

// PATCH /api/v1/admin/verify-worker/:id
router.patch('/verify-worker/:id', requireAuth, requireAdmin, verifyWorker);
router.patch('/verify-student/:id', requireAuth, requireAdmin, verifyStudent);

export default router;
