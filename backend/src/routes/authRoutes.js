import express from 'express';
import { register, login } from '../controllers/authController.js';
import { acceptInvitation } from '../controllers/invitationController.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/accept-invite
router.post('/accept-invite', acceptInvitation);

export default router;
