import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  createITI,
  getITIs,
  getITIById,
  getTopNearbyITIs,
  updateITI,
  deleteITI
} from '../controllers/itiController.js';
import { getITIWorkers } from '../controllers/itiRecommendationController.js';

const router = express.Router();

router.use(requireAuth);

// Public / Officer read endpoints
router.get('/top-nearby', getTopNearbyITIs);
router.get('/', getITIs);
router.get('/:id/workers', getITIWorkers);
router.get('/:id', getITIById);

// Admin-only management endpoints
router.post('/', requireAdmin, createITI);
router.put('/:id', requireAdmin, updateITI);
router.patch('/:id', requireAdmin, updateITI);
router.delete('/:id', requireAdmin, deleteITI);

export default router;
