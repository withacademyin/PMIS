import express from 'express';
import requireAuth from '../middlewares/auth.js';
import { createKRA, updateKRAStatus, submitEvidence, updateKRAItem } from '../controllers/kraController.js';

const router = express.Router({ mergeParams: true }); // Need mergeParams to access :id (internshipId) from parent router

router.post('/', requireAuth, createKRA);
router.patch('/:kraId/status', requireAuth, updateKRAStatus);
router.post('/:kraId/submissions', requireAuth, submitEvidence);
router.patch('/:kraId/items/:itemId', requireAuth, updateKRAItem);

export default router;
