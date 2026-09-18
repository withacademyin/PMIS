import express from 'express';
import { createCompany, getCompanies, getCompanyById, getMyCompany, updateMyCompany, deleteCompany } from '../controllers/companyController.js';
import { inviteRecruiter } from '../controllers/invitationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth);

// Recruiter endpoints
router.get('/me', getMyCompany);
router.patch('/me', updateMyCompany);

// Admin endpoints
router.post('/', createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.delete('/:id', deleteCompany);
router.post('/:companyId/invite', inviteRecruiter);

export default router;
