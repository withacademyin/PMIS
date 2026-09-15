import express from 'express';
import { checkHealth } from '../controllers/healthController.js';

const router = express.Router();

// GET /api/health
router.get('/', checkHealth);

export default router;
