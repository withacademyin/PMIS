import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { getStudents, verifyStudent } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/students
router.get('/students', requireAuth, getStudents);

// PATCH /api/admin/verify-student/:id
router.patch('/verify-student/:id', requireAuth, verifyStudent);

export default router;
