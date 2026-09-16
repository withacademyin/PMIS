import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

// GET /api/settings - Public (or just requires any auth) so students can fetch allowed colleges/courses
router.get('/', getSettings);

// PATCH /api/settings - Admin only
router.patch('/', requireAuth, updateSettings);

export default router;
