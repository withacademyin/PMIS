import express from 'express';
import {
  getMyShortlists,
  addToShortlist,
  updateShortlistStatus,
  removeFromShortlist
} from '../controllers/shortlistController.js';
import { requireAuth, requireOfficer } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOfficer);

router.route('/')
  .get(getMyShortlists)
  .post(addToShortlist);

router.route('/:id')
  .put(updateShortlistStatus)
  .delete(removeFromShortlist);

export default router;
