import { Router } from "express";
import { CarbonCreditsController } from "../controllers/carbon-credits.controller";

const router = Router();
const carbonCreditsController = new CarbonCreditsController();

/**
 * @swagger
 * /api/carbon-credits/status:
 *   get:
 *     summary: Check Carbon Credits service status
 *     tags: [Carbon Credits]
 *     responses:
 *       200:
 *         description: Service status
 */
router.get("/status", carbonCreditsController.getStatus);

/**
 * @swagger
 * /api/carbon-credits/initialize:
 *   post:
 *     summary: Initialize Carbon Credits system (Admin only)
 *     tags: [Carbon Credits]
 *     responses:
 *       200:
 *         description: System initialized successfully
 */
router.post("/initialize", carbonCreditsController.initializeCarbonCredits);

/**
 * @swagger
 * /api/carbon-credits/project:
 *   post:
 *     summary: Create a new carbon credit project
 *     tags: [Carbon Credits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - uri
 *               - amount
 *               - pricePerToken
 *               - carbonPayFee
 *               - ownerUserId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Amazon Reforestation"
 *               symbol:
 *                 type: string
 *                 example: "AMZN"
 *               uri:
 *                 type: string
 *                 example: "https://metadata.carbonpay.io/project/1"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               pricePerToken:
 *                 type: number
 *                 example: 10000000
 *               carbonPayFee:
 *                 type: number
 *                 example: 500
 *               ownerUserId:
 *                 type: string
 *                 example: "user123"
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post("/project", carbonCreditsController.createProject);

/**
 * @swagger
 * /api/carbon-credits/purchase:
 *   post:
 *     summary: Purchase carbon credits (Web2.5 - backend signs)
 *     tags: [Carbon Credits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - projectId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               projectId:
 *                 type: string
 *                 example: "project_1234567890"
 *               amount:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Credits purchased successfully
 */
router.post("/purchase", carbonCreditsController.purchaseCredits);

/**
 * @swagger
 * /api/carbon-credits/project/{projectPda}:
 *   get:
 *     summary: Get project information
 *     tags: [Carbon Credits]
 *     parameters:
 *       - in: path
 *         name: projectPda
 *         required: true
 *         schema:
 *           type: string
 *         description: The project PDA address
 *     responses:
 *       200:
 *         description: Project information retrieved successfully
 */
router.get("/project/:projectPda", carbonCreditsController.getProjectInfo);

/**
 * @swagger
 * /api/carbon-credits/info:
 *   get:
 *     summary: Get general carbon credits information
 *     tags: [Carbon Credits]
 *     responses:
 *       200:
 *         description: Carbon credits information retrieved successfully
 */
router.get("/info", carbonCreditsController.getCarbonCreditsInfo);

export default router;
