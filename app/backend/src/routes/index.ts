import { Router } from "express";
import { healthCheck } from "../middlewares/healthCheck";
import {
  authValidations,
  userValidations,
  organizationValidations,
  projectValidations,
  retirementValidations,
} from "../middlewares/validator";
import {
  authMiddleware,
  adminMiddleware,
  adminApprovalMiddleware,
} from "../middlewares/auth.middleware";

// Controllers
import { AuthController } from "../controllers/auth.controller";
import { UserController } from "../controllers/user.controller";
import { OrganizationController } from "../controllers/organization.controller";
import { ProjectController } from "../controllers/project.controller";
import { RetirementController } from "../controllers/retirement.controller";

// Instantiating controllers
const authController = new AuthController();
const userController = new UserController();
const organizationController = new OrganizationController();
const projectController = new ProjectController();
const retirementController = new RetirementController();

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

// ================================
// USER ROUTES
// ================================

/**
 * @openapi
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/user/login", authValidations.login, authController.login);

/**
 * @openapi
 * /user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Register user with onboarding data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - companyName
 *               - country
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               country:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               industryType:
 *                 type: string
 *               companySize:
 *                 type: string
 *               description:
 *                 type: string
 *               tracksEmissions:
 *                 type: boolean
 *               emissionSources:
 *                 type: array
 *                 items:
 *                   type: string
 *               sustainabilityCertifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               priorOffsetting:
 *                 type: boolean
 *               contactEmail:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               acceptedTerms:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
  "/user/register",
  userValidations.register,
  userController.register
);

/**
 * @openapi
 * /user/add-balance:
 *   post:
 *     tags:
 *       - User
 *     summary: Add balance to user account (placeholder)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balance added successfully
 */
router.post(
  "/user/add-balance",
  authMiddleware,
  userValidations.addBalance,
  userController.addBalance
);

/**
 * @openapi
 * /user/purchase-credits:
 *   post:
 *     tags:
 *       - User
 *     summary: Purchase carbon credits with account balance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - quantity
 *             properties:
 *               projectId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Credits purchased successfully
 */
router.post(
  "/user/purchase-credits",
  authMiddleware,
  userValidations.purchaseCredits,
  userController.purchaseCredits
);

/**
 * @openapi
 * /user/retire-emissions:
 *   post:
 *     tags:
 *       - User
 *     summary: Retire carbon credits to offset emissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - quantity
 *             properties:
 *               projectId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               beneficiary:
 *                 type: string
 *               retirementMessage:
 *                 type: string
 *               reportingPeriodStart:
 *                 type: string
 *                 format: date
 *               reportingPeriodEnd:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Emissions retired successfully
 */
router.post(
  "/user/retire-emissions",
  authMiddleware,
  retirementValidations.retireCredits,
  retirementController.retireCredits
);

/**
 * @openapi
 * /user/retirements:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user's retirements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user retirements
 */
router.get(
  "/user/retirements",
  authMiddleware,
  retirementController.getUserRetirements
);

/**
 * @openapi
 * /user/retirements/{id}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get retirement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Retirement ID
 *     responses:
 *       200:
 *         description: Retirement details
 */
router.get(
  "/user/retirements/:id",
  authMiddleware,
  retirementController.getRetirementById
);

/**
 * @openapi
 * /user/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user name and company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get("/user/profile", authMiddleware, userController.getProfile);

/**
 * @openapi
 * /user/complete-registration:
 *   patch:
 *     tags:
 *       - User
 *     summary: Complete user registration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - companyName
 *               - country
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               country:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               industryType:
 *                 type: string
 *               companySize:
 *                 type: string
 *               description:
 *                 type: string
 *               tracksEmissions:
 *                 type: boolean
 *               emissionSources:
 *                 type: array
 *                 items:
 *                   type: string
 *               sustainabilityCertifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               priorOffsetting:
 *                 type: boolean
 *               contactEmail:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               acceptedTerms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Registration completed successfully
 */
// Removed: complete-registration route (no longer needed)

// ================================
// PUBLIC PROJECT ROUTES
// ================================

/**
 * @openapi
 * /projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get available carbon projects for purchase
 *     description: Returns only projects with available supply > 0 and status 'available'
 *     responses:
 *       200:
 *         description: List of available projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/projects", projectController.getAvailableProjects);

// ================================
// ADMIN ROUTES
// ================================

/**
 * @openapi
 * /admin/organizations:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create organization (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fullName
 *               - companyName
 *               - country
 *             properties:
 *               userId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               country:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               industryType:
 *                 type: string
 *               companySize:
 *                 type: string
 *               description:
 *                 type: string
 *               tracksEmissions:
 *                 type: boolean
 *               emissionSources:
 *                 type: array
 *                 items:
 *                   type: string
 *               sustainabilityCertifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               priorOffsetting:
 *                 type: boolean
 *               contactEmail:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               acceptedTerms:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post(
  "/admin/organizations",
  authMiddleware,
  adminMiddleware,
  adminApprovalMiddleware,
  organizationValidations.createOrganization,
  organizationController.createOrganization
);

/**
 * @openapi
 * /admin/organizations:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all organizations (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
 */
router.get(
  "/admin/organizations",
  authMiddleware,
  adminMiddleware,
  organizationController.getAllOrganizations
);

/**
 * @openapi
 * /admin/organizations/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update organization (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               country:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               industryType:
 *                 type: string
 *               companySize:
 *                 type: string
 *               description:
 *                 type: string
 *               tracksEmissions:
 *                 type: boolean
 *               emissionSources:
 *                 type: array
 *                 items:
 *                   type: string
 *               sustainabilityCertifications:
 *                 type: array
 *                 items:
 *                   type: string
 *               priorOffsetting:
 *                 type: boolean
 *               contactEmail:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               acceptedTerms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization updated
 */
router.put(
  "/admin/organizations/:id",
  authMiddleware,
  adminMiddleware,
  adminApprovalMiddleware,
  organizationValidations.updateOrganization,
  organizationController.updateOrganization
);

/**
 * @openapi
 * /admin/projects:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create carbon project (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - location
 *               - methodology
 *               - certificationBody
 *               - vintageYear
 *               - totalIssued
 *               - pricePerCredit
 *             properties:
 *               projectName:
 *                 type: string
 *               location:
 *                 type: string
 *               methodology:
 *                 type: string
 *               certificationBody:
 *                 type: string
 *               vintageYear:
 *                 type: number
 *               totalIssued:
 *                 type: number
 *               pricePerCredit:
 *                 type: number
 *               description:
 *                 type: string
 *               tokenId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 */
router.post(
  "/admin/projects",
  authMiddleware,
  adminMiddleware,
  adminApprovalMiddleware,
  projectValidations.createProject,
  projectController.createProject
);

/**
 * @openapi
 * /admin/projects:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all carbon projects
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get("/admin/projects", projectController.getAllProjects);

/**
 * @openapi
 * /admin/projects/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 */
router.get("/admin/projects/:id", projectController.getProjectById);

/**
 * @openapi
 * /verify:
 *   get:
 *     tags:
 *       - Public
 *     summary: Verify retirement certificate by id or hash
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: hash
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get("/verify", retirementController.verify);

/**
 * @openapi
 * /certificate/{id}.html:
 *   get:
 *     tags:
 *       - Public
 *     summary: Render retirement certificate HTML
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: HTML certificate
 */
router.get("/certificate/:id.html", retirementController.certificateHtml);

/**
 * @openapi
 * /certificate/{id}.pdf:
 *   get:
 *     tags:
 *       - Public
 *     summary: Render retirement certificate PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: PDF certificate
 */
router.get("/certificate/:id.pdf", retirementController.certificatePdf);

/**
 * @openapi
 * /user/retirements.csv:
 *   get:
 *     tags:
 *       - User
 *     summary: Export my retirements as CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV export
 */
router.get("/user/retirements.csv", authMiddleware, retirementController.exportMyRetirementsCsv);

/**
 * @openapi
 * /admin/purchases.csv:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Export purchases as CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV export
 */
router.get("/admin/purchases.csv", authMiddleware, adminMiddleware, userController.exportPurchasesCsv);

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Prometheus metrics endpoint
 *     responses:
 *       200:
 *         description: Metrics in Prometheus exposition format
 */

export default router;
