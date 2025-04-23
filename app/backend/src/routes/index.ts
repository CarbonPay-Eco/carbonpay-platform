import { Router } from 'express';
import { healthCheck } from '../middlewares/healthCheck';
import { authValidations, organizationValidations, projectValidations, retirementValidations } from '../middlewares/validator';
import { verifyWallet, verifyAdmin } from '../middlewares/auth.middleware';

// Controllers
import { AuthController } from '../controllers/auth.controller';
import { WalletController } from '../controllers/wallet.controller';
import { OrganizationController } from '../controllers/organization.controller';
import { ProjectController } from '../controllers/project.controller';
import { RetirementController } from '../controllers/retirement.controller';
import { AdminController } from '../controllers/admin.controller';

// Instatiating controllers
const authController = new AuthController();
const walletController = new WalletController();
const organizationController = new OrganizationController();
const projectController = new ProjectController();
const retirementController = new RetirementController();
const adminController = new AdminController();

const router = Router();

// Health check route
router.get('/health', healthCheck);

// Auth Routes
router.post('/auth/verify', authValidations.verifySignature, authController.verifySignature);

// Wallet Routes
router.get('/wallet/:address', walletController.getWalletInfo);

// Organization Routes (requires wallet verification)
router.post('/organization', verifyWallet, organizationValidations.createOrganization, organizationController.createOrganization);
router.get('/organization/me', verifyWallet, organizationController.getMyOrganization);
router.put('/organization', verifyWallet, organizationValidations.updateOrganization, organizationController.updateOrganization);

// Project Routes
router.post('/projects', verifyWallet, verifyAdmin, projectValidations.createProject, projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:token_id', projectController.getProjectById);

// Retirement Routes
router.post('/retire', verifyWallet, retirementValidations.retireCredits, retirementController.retireCredits);
router.get('/retirements', verifyWallet, retirementController.getMyRetirements);
router.get('/public/:walletAddress', retirementController.getPublicRetirements);

// Admin Routes (requires admin verification)
router.get('/admin/audit-logs', verifyWallet, verifyAdmin, adminController.getAuditLogs);
router.get('/admin/projects', verifyWallet, verifyAdmin, adminController.getProjects);

export default router; 