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
 * /user/purchases:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user's carbon credit purchases
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user purchases
 */
router.get("/user/purchases", authMiddleware, userController.getPurchases);

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
router.patch(
  "/user/complete-registration",
  userController.completeRegistration
);

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
 *               - pricePerTon
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
 *               pricePerTon:
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

export default router;
