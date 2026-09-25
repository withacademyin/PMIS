import express from 'express';
import {
  getMyRequirements,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement
} from '../controllers/workRequirementController.js';
import { requireAuth, requireOfficer } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOfficer);

router.route('/')
  .get(getMyRequirements)
  .post(createRequirement);

router.route('/:id')
  .get(getRequirementById)
  .put(updateRequirement)
  .delete(deleteRequirement);

export default router;
