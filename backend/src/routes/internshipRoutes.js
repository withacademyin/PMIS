import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { getInternships, createInternship } from '../controllers/internshipController.js';
import kraRoutes from './kraRoutes.js';

const router = express.Router();

router.use('/:id/kras', kraRoutes);

router.get('/', requireAuth, getInternships);
router.post('/', requireAuth, createInternship);

export default router;
