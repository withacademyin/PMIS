import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { acceptInvitation } from '../controllers/invitationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// GET /api/v1/auth/me
router.get('/me', requireAuth, me);

// POST /api/v1/auth/accept-invite
router.post('/accept-invite', acceptInvitation);

export default router;
