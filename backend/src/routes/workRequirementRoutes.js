import express from 'express';
import {
  getMyRequirements,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getRequirementApplicants,
  updateRequirementApplicantStatus,
} from '../controllers/workRequirementController.js';
import { requireAuth, requireOfficer } from '../middlewares/auth.js';
import { matchRequirementToITIs, getRequirementITIs } from '../controllers/itiRecommendationController.js';

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

router.get('/:id/applicants', getRequirementApplicants);
router.patch('/:id/applicants/:applicantId/status', updateRequirementApplicantStatus);

router.post('/:id/match-itis', matchRequirementToITIs);
router.get('/:id/itis', getRequirementITIs);

export default router;
