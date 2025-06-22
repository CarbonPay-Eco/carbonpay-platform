import { Router } from "express";
import { healthCheck } from "../middlewares/healthCheck";
import {
  authValidations,
  organizationValidations,
  projectValidations,
  retirementValidations,
} from "../middlewares/validator";
import { verifyWallet, verifyAdmin } from "../middlewares/auth.middleware";

// Controllers
import { AuthController } from "../controllers/auth.controller";
import { WalletController } from "../controllers/wallet.controller";
import { OrganizationController } from "../controllers/organization.controller";
import { ProjectController } from "../controllers/project.controller";
import { RetirementController } from "../controllers/retirement.controller";
import { AdminController } from "../controllers/admin.controller";

// Instantiating controllers
const authController = new AuthController();
const walletController = new WalletController();
const organizationController = new OrganizationController();
const projectController = new ProjectController();
const retirementController = new RetirementController();
const adminController = new AdminController();

import authRoutes from "./auth";
import carbonCreditsSimpleRouter from "./carbon-credits-simple";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     responses:
 *       200:
 *         description: API is running
 */
router.get("/health", healthCheck);

// Carbon Credits Simple routes (Web2.5)
router.use("/carbon-credits-simple", carbonCreditsSimpleRouter);

/**
 * @openapi
 * /auth/verify:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify wallet signature
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signature verified successfully
 */
router.post(
  "/auth/verify",
  authValidations.verifySignature,
  authController.verifySignature
);

/**
 * @openapi
 * /wallet/{address}:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet info
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Wallet data returned
 */
router.get("/wallet/:address", walletController.getWalletInfo);

/**
 * @openapi
 * /organization:
 *   post:
 *     tags:
 *       - Organization
 *     summary: Register a new organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post(
  "/organization",
  verifyWallet,
  organizationValidations.createOrganization,
  organizationController.createOrganization
);

/**
 * @openapi
 * /organization/me:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get current user's organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization data retrieved
 */
router.get(
  "/organization/me",
  verifyWallet,
  organizationController.getMyOrganization
);

/**
 * @openapi
 * /organization:
 *   put:
 *     tags:
 *       - Organization
 *     summary: Update organization information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization updated
 */
router.put(
  "/organization",
  verifyWallet,
  organizationValidations.updateOrganization,
  organizationController.updateOrganization
);

/**
 * @openapi
 * /projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a tokenized carbon project
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Project created
 */
router.post(
  "/projects",
  verifyWallet,
  verifyAdmin,
  projectValidations.createProject,
  projectController.createProject
);

/**
 * @openapi
 * /projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all tokenized carbon projects
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get("/projects", projectController.getAllProjects);

/**
 * @openapi
 * /projects/{token_id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get project by token ID
 *     parameters:
 *       - in: path
 *         name: token_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Token ID of the project
 *     responses:
 *       200:
 *         description: Project details
 */
router.get("/projects/:token_id", projectController.getProjectById);

/**
 * @openapi
 * /retire:
 *   post:
 *     tags:
 *       - Retirement
 *     summary: Retire tokenized credits (offset)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Credits retired
 */
router.post(
  "/retire",
  verifyWallet,
  retirementValidations.retireCredits,
  retirementController.retireCredits
);

/**
 * @openapi
 * /retirements:
 *   get:
 *     tags:
 *       - Retirement
 *     summary: Get retirements of the authenticated wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of retirements
 */
router.get("/retirements", verifyWallet, retirementController.getMyRetirements);

/**
 * @openapi
 * /public/{walletAddress}:
 *   get:
 *     tags:
 *       - Retirement
 *     summary: Get public retirements for a given wallet address
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to query
 *     responses:
 *       200:
 *         description: Public retirements data
 */
router.get("/public/:walletAddress", retirementController.getPublicRetirements);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system audit logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs retrieved
 */
router.get(
  "/admin/audit-logs",
  verifyWallet,
  verifyAdmin,
  adminController.getAuditLogs
);

/**
 * @openapi
 * /admin/projects:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all projects for administration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin projects
 */
router.get(
  "/admin/projects",
  verifyWallet,
  verifyAdmin,
  adminController.getProjects
);

router.use("/auth", authRoutes);

export default router;
