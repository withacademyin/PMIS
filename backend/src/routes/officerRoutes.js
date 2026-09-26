import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  getMyOfficerProfile,
  updateMyOfficerProfile,
  getOfficers,
  getOfficerById,
} from '../controllers/officerController.js';
import { inviteOfficer } from '../controllers/invitationController.js';

const router = express.Router();


// Authenticated officer endpoints
router.get('/me', requireAuth, getMyOfficerProfile);
router.patch('/me', requireAuth, updateMyOfficerProfile);
router.put('/me', requireAuth, updateMyOfficerProfile);

// Admin officer management
router.get('/', requireAuth, requireAdmin, getOfficers);
router.get('/:id', requireAuth, requireAdmin, getOfficerById);
router.post('/invite', requireAuth, requireAdmin, inviteOfficer);

export default router;
