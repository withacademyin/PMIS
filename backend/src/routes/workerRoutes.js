import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  createWorker,
  getWorkers,
  searchWorkers,
  getWorkerById,
  updateWorker,
  verifyWorker,
  deleteWorker,
} from '../controllers/workerController.js';

const router = express.Router();

router.use(requireAuth);

// GET /api/v1/workers/search?lat=&lng=&trade=&district= - Spatial PostGIS 50km search
router.get('/search', searchWorkers);

// GET /api/v1/workers - List workers with optional filters
router.get('/', getWorkers);

// GET /api/v1/workers/:id - Single worker details
router.get('/:id', getWorkerById);

// POST /api/v1/workers - Create worker (Admin or Nodal Officer)
router.post('/', createWorker);

// PUT/PATCH /api/v1/workers/:id - Update worker
router.put('/:id', updateWorker);
router.patch('/:id', updateWorker);

// PATCH /api/v1/workers/:id/verify - Admin only
router.patch('/:id/verify', requireAdmin, verifyWorker);

// DELETE /api/v1/workers/:id - Admin only
router.delete('/:id', requireAdmin, deleteWorker);

export default router;
