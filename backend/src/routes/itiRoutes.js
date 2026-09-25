import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  createITI,
  getITIs,
  getITIById,
  updateITI,
  deleteITI
} from '../controllers/itiController.js';

const router = express.Router();

router.use(requireAuth);

// Public / Officer read endpoints
router.get('/', getITIs);
router.get('/:id', getITIById);

// Admin-only management endpoints
router.post('/', requireAdmin, createITI);
router.put('/:id', requireAdmin, updateITI);
router.patch('/:id', requireAdmin, updateITI);
router.delete('/:id', requireAdmin, deleteITI);

export default router;
