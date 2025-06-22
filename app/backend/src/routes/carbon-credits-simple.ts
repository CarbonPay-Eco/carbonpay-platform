import { Router } from 'express';
import { CarbonCreditsSimpleController } from '../controllers/carbon-credits-simple.controller';

const router = Router();
const controller = new CarbonCreditsSimpleController();

/**
 * @swagger
 * /api/carbon-credits-simple/status:
 *   get:
 *     summary: Status geral do sistema Web2.5
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Status do sistema
 */
router.get('/status', controller.getStatus);

/**
 * @swagger
 * /api/carbon-credits-simple/test-connection:
 *   get:
 *     summary: Testar conectividade com Solana
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Resultado do teste de conexão
 */
router.get('/test-connection', controller.testConnection);

/**
 * @swagger
 * /api/carbon-credits-simple/test-signing:
 *   post:
 *     summary: Testar assinatura de transações pelo backend (Web2.5)
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Resultado do teste de assinatura
 */
router.post('/test-signing', controller.testBackendSigning);

/**
 * @swagger
 * /api/carbon-credits-simple/admin/balance:
 *   post:
 *     summary: Garantir que admin tem SOL suficiente
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Resultado da verificação/airdrop
 */
router.post('/admin/balance', controller.ensureAdminBalance);

/**
 * @swagger
 * /api/carbon-credits-simple/admin/info:
 *   get:
 *     summary: Informações do admin wallet
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Informações do admin
 */
router.get('/admin/info', controller.getAdminInfo);

/**
 * @swagger
 * /api/carbon-credits-simple/initialize:
 *   post:
 *     summary: Inicializar sistema Carbon Credits (simulado)
 *     tags: [Carbon Credits Simple]
 *     responses:
 *       200:
 *         description: Sistema inicializado
 */
router.post('/initialize', controller.initializeCarbonCredits);

/**
 * @swagger
 * /api/carbon-credits-simple/project:
 *   post:
 *     summary: Criar projeto de carbon credits (simulado)
 *     tags: [Carbon Credits Simple]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         description: Projeto criado
 */
router.post('/project', controller.createProject);

/**
 * @swagger
 * /api/carbon-credits-simple/purchase:
 *   post:
 *     summary: Comprar carbon credits (simulado)
 *     tags: [Carbon Credits Simple]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               projectId:
 *                 type: string
 *                 example: "project_123"
 *               amount:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Créditos comprados
 */
router.post('/purchase', controller.purchaseCredits);

export default router; 