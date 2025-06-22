import { Request, Response } from "express";
import {
  CarbonCreditsService,
  CarbonCreditProject,
  PurchaseRequest,
} from "../services/carbon-credits.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

export class CarbonCreditsController {
  private carbonCreditsService: CarbonCreditsService;

  constructor() {
    this.carbonCreditsService = new CarbonCreditsService();
  }

  // Inicializar o sistema de créditos de carbono (admin only)
  initializeCarbonCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const signature =
          await this.carbonCreditsService.initializeCarbonCredits();

        res.status(200).json({
          success: true,
          message: "Carbon Credits system initialized successfully",
          data: {
            signature,
            type: "initialize_carbon_credits",
          },
        });
      } catch (error) {
        throw createError(
          `Failed to initialize carbon credits: ${error.message}`,
          500
        );
      }
    }
  );

  // Criar um novo projeto de créditos de carbono
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
      }: CarbonCreditProject = req.body;

      if (
        !name ||
        !symbol ||
        !uri ||
        !amount ||
        !pricePerToken ||
        !carbonPayFee ||
        !ownerUserId
      ) {
        throw createError("Missing required project fields", 400);
      }

      try {
        const projectId = `project_${Date.now()}`;
        const projectData: CarbonCreditProject = {
          id: projectId,
          name,
          symbol,
          uri,
          amount,
          pricePerToken,
          carbonPayFee,
          ownerUserId,
        };

        const signature = await this.carbonCreditsService.createProject(
          projectData
        );

        res.status(201).json({
          success: true,
          message: "Project created successfully",
          data: {
            projectId,
            signature,
            projectData,
            type: "create_project",
          },
        });
      } catch (error) {
        throw createError(`Failed to create project: ${error.message}`, 500);
      }
    }
  );

  // Comprar créditos de carbono (web2.5 - backend assina pelo usuário)
  purchaseCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId, projectId, amount }: PurchaseRequest = req.body;

      if (!userId || !projectId || !amount) {
        throw createError(
          "Missing required purchase fields: userId, projectId, amount",
          400
        );
      }

      if (amount <= 0) {
        throw createError("Amount must be greater than 0", 400);
      }

      try {
        const purchaseData: PurchaseRequest = {
          userId,
          projectId,
          amount,
        };

        const signature = await this.carbonCreditsService.purchaseCredits(
          purchaseData
        );

        res.status(200).json({
          success: true,
          message: "Carbon credits purchased successfully",
          data: {
            signature,
            purchaseData,
            type: "purchase_credits",
          },
        });
      } catch (error) {
        throw createError(`Failed to purchase credits: ${error.message}`, 500);
      }
    }
  );

  // Obter informações de um projeto
  getProjectInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { projectPda } = req.params;

      if (!projectPda) {
        throw createError("Project PDA is required", 400);
      }

      try {
        const projectInfo = await this.carbonCreditsService.getProjectInfo(
          projectPda
        );

        res.status(200).json({
          success: true,
          message: "Project info retrieved successfully",
          data: {
            projectPda,
            projectInfo,
            type: "project_info",
          },
        });
      } catch (error) {
        throw createError(`Failed to get project info: ${error.message}`, 500);
      }
    }
  );

  // Obter informações gerais dos créditos de carbono
  getCarbonCreditsInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const carbonCreditsInfo =
          await this.carbonCreditsService.getCarbonCreditsInfo();

        res.status(200).json({
          success: true,
          message: "Carbon credits info retrieved successfully",
          data: {
            carbonCreditsInfo,
            type: "carbon_credits_info",
          },
        });
      } catch (error) {
        throw createError(
          `Failed to get carbon credits info: ${error.message}`,
          500
        );
      }
    }
  );

  // Endpoint de status/saúde do serviço
  getStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Verificar se consegue acessar o programa
        const carbonCreditsInfo =
          await this.carbonCreditsService.getCarbonCreditsInfo();

        res.status(200).json({
          success: true,
          message: "Carbon Credits service is healthy",
          data: {
            status: "healthy",
            timestamp: new Date().toISOString(),
            carbonCreditsInitialized: !!carbonCreditsInfo,
            type: "status",
          },
        });
      } catch (error) {
        res.status(200).json({
          success: true,
          message: "Carbon Credits service is running but not initialized",
          data: {
            status: "not_initialized",
            timestamp: new Date().toISOString(),
            error: error.message,
            type: "status",
          },
        });
      }
    }
  );
}
