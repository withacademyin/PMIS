import express from 'express';
import { requireAuth, requireOfficer } from '../middlewares/auth.js';
import {
  getAvailableDistricts,
  getDashboardSummary,
  getMapData,
  getOpportunities,
  getOpportunityDetail,
  getInstitutions,
  getInstitutionDetail,
  generateBulletin,
  planCamp,
  getActionPlan,
  toggleActionPlanItem,
  addActionPlanNote,
  getOutcomes
} from '../controllers/radarController.js';

const router = express.Router();

// Apply auth to all radar routes - accessible to OFFICER and ADMIN
router.use(requireAuth, requireOfficer);

// District hierarchy
router.get('/districts', getAvailableDistricts);

// Dashboard & Map
router.get('/dashboard/summary', getDashboardSummary);
router.get('/map', getMapData);

// Opportunities
router.get('/opportunities', getOpportunities);
router.get('/opportunities/:id', getOpportunityDetail);

// Institutions
router.get('/institutions', getInstitutions);
router.get('/institutions/:id', getInstitutionDetail);

// Mobilisation Actions
router.post('/bulletins/generate', generateBulletin);
router.post('/camps/plan', planCamp);

// Weekly Action Plan
router.get('/action-plan', getActionPlan);
router.patch('/action-plan/:id/toggle', toggleActionPlanItem);
router.post('/action-plan/:id/notes', addActionPlanNote);

// Outcomes Monitoring
router.get('/outcomes', getOutcomes);

export default router;
