import express from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '../middlewares/auth.js';
import {
  createITI,
  getITIs,
  getITIById,
  getTopNearbyITIs,
  updateITI,
  deleteITI,
  contactITI,
  getITIContactInquiries,
} from '../controllers/itiController.js';
import { getITIWorkers } from '../controllers/itiRecommendationController.js';

const router = express.Router();

// Read endpoints with optional authentication
router.get('/top-nearby', optionalAuth, getTopNearbyITIs);
router.get('/', optionalAuth, getITIs);
router.get('/:id/workers', optionalAuth, getITIWorkers);
router.get('/:id', optionalAuth, getITIById);

// Authenticated officer endpoints
router.post('/:id/contact', requireAuth, contactITI);
router.get('/:id/contact-inquiries', requireAuth, getITIContactInquiries);

// Admin-only management endpoints
router.post('/', requireAdmin, createITI);
router.put('/:id', requireAdmin, updateITI);
router.patch('/:id', requireAdmin, updateITI);
router.delete('/:id', requireAdmin, deleteITI);

export default router;
