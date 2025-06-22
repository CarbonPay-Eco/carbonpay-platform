import { Request, Response } from "express";
import {
  CarbonCreditsSimpleService,
  CarbonCreditProject,
  PurchaseRequest,
} from "../services/carbon-credits-simple.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

export class CarbonCreditsSimpleController {
  private carbonCreditsService: CarbonCreditsSimpleService;

  constructor() {
    this.carbonCreditsService = new CarbonCreditsSimpleService();
  }

  // Status geral do sistema
  getStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const status = await this.carbonCreditsService.getSystemStatus();

        res.status(200).json({
          success: true,
          message: "Sistema Carbon Credits Web2.5",
          data: status,
        });
      } catch (error) {
        throw createError(`Erro ao verificar status: ${error.message}`, 500);
      }
    }
  );

  // Testar conectividade
  testConnection = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const connectionTest = await this.carbonCreditsService.testConnection();

        res.status(200).json({
          success: true,
          message: "Teste de conectividade realizado",
          data: connectionTest,
        });
      } catch (error) {
        throw createError(`Erro no teste de conexão: ${error.message}`, 500);
      }
    }
  );

  // Testar assinatura de transações pelo backend (web2.5)
  testBackendSigning = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const signingTest =
          await this.carbonCreditsService.testBackendSigning();

        res.status(200).json({
          success: true,
          message: "Teste de assinatura Web2.5 realizado",
          data: signingTest,
        });
      } catch (error) {
        throw createError(`Erro no teste de assinatura: ${error.message}`, 500);
      }
    }
  );

  // Garantir que admin tem SOL
  ensureAdminBalance = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const airdropSignature =
          await this.carbonCreditsService.ensureAdminBalance();

        res.status(200).json({
          success: true,
          message: airdropSignature
            ? "Airdrop realizado com sucesso"
            : "Admin já tem SOL suficiente",
          data: {
            airdropSignature,
            hasAirdrop: !!airdropSignature,
          },
        });
      } catch (error) {
        throw createError(
          `Erro ao garantir balance do admin: ${error.message}`,
          500
        );
      }
    }
  );

  // Inicializar sistema de carbon credits
  initializeCarbonCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const signature =
          await this.carbonCreditsService.initializeCarbonCredits();

        res.status(200).json({
          success: true,
          message: "Sistema Carbon Credits inicializado (simulado)",
          data: {
            signature,
            type: "initialize_carbon_credits",
          },
        });
      } catch (error) {
        throw createError(`Erro ao inicializar sistema: ${error.message}`, 500);
      }
    }
  );

  // Criar projeto
  createProject = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        name,
        symbol,
        uri,
        amount,
        pricePerToken,
        carbonPayFee,
        ownerUserId,
      }: Partial<CarbonCreditProject> = req.body;

      // Valores padrão para teste
      const projectData: CarbonCreditProject = {
        id: `project_${Date.now()}`,
        name: name || "Projeto Teste Amazon",
        symbol: symbol || "PTAM",
        uri: uri || "https://test.carbonpay.io/metadata/1",
        amount: amount || 100,
        pricePerToken: pricePerToken || 10000000, // 0.01 SOL
        carbonPayFee: carbonPayFee || 500, // 5%
        ownerUserId: ownerUserId || "test_user",
      };

      try {
        const signature = await this.carbonCreditsService.createProject(
          projectData
        );

        res.status(201).json({
          success: true,
          message: "Projeto criado com sucesso (simulado)",
          data: {
            projectId: projectData.id,
            signature,
            projectData,
            type: "create_project",
          },
        });
      } catch (error) {
        throw createError(`Erro ao criar projeto: ${error.message}`, 500);
      }
    }
  );

  // Comprar créditos
  purchaseCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId, projectId, amount }: Partial<PurchaseRequest> = req.body;

      // Valores padrão para teste
      const purchaseData: PurchaseRequest = {
        userId: userId || "test_user",
        projectId: projectId || "test_project_123",
        amount: amount || 5,
      };

      try {
        const signature = await this.carbonCreditsService.purchaseCredits(
          purchaseData
        );

        res.status(200).json({
          success: true,
          message: "Créditos comprados com sucesso (simulado)",
          data: {
            signature,
            purchaseData,
            type: "purchase_credits",
          },
        });
      } catch (error) {
        throw createError(`Erro ao comprar créditos: ${error.message}`, 500);
      }
    }
  );

  // Informações do admin
  getAdminInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const adminInfo = await this.carbonCreditsService.getAdminInfo();

        res.status(200).json({
          success: true,
          message: "Informações do admin obtidas",
          data: adminInfo,
        });
      } catch (error) {
        throw createError(
          `Erro ao buscar info do admin: ${error.message}`,
          500
        );
      }
    }
  );
}
