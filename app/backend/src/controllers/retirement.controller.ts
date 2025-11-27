import { Request, Response } from "express";
import { RetirementService } from "../services/retirement.service";
import { OrganizationService } from "../services/organization.service";
import { AdminService } from "../services/admin.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

const retirementService = new RetirementService();
const organizationService = new OrganizationService();
const adminService = new AdminService();

export class RetirementController {
  retireCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const {
        projectId,
        quantity,
        beneficiary,
        retirementMessage,
        reportingPeriodStart,
        reportingPeriodEnd,
        emissionId, // Optional: link to emission record
        purchaseId, // Optional: specific purchase to offset from
      } = req.body;

      if (!projectId || !quantity || quantity <= 0) {
        throw createError("Project ID and quantity (> 0) are required", 400);
      }

      const retirement = await retirementService.retireCredits(
        userId,
        projectId,
        quantity,
        {
          beneficiary,
          retirementMessage,
          reportingPeriodStart: reportingPeriodStart
            ? new Date(reportingPeriodStart)
            : undefined,
          reportingPeriodEnd: reportingPeriodEnd
            ? new Date(reportingPeriodEnd)
            : undefined,
          emissionId,
          purchaseId,
        }
      );

      res.status(200).json({
        success: true,
        message: "Credits offset successfully on-chain",
        data: retirement,
      });
    }
  );

  // Get user's retirements
  getUserRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;

      const retirements = await retirementService.getUserRetirements(userId);

      res.status(200).json({
        success: true,
        message: "Retirements retrieved successfully",
        data: retirements,
      });
    }
  );

  // Get retirement by ID
  getRetirementById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = req.userId!;

      const retirement = await retirementService.getRetirementById(id, userId);

      if (!retirement) {
        throw createError("Retirement not found", 404);
      }

      res.status(200).json({
        success: true,
        message: "Retirement retrieved successfully",
        data: retirement,
      });
    }
  );

  // Legacy method for compatibility
  getMyRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;

      const retirements = await retirementService.getUserRetirements(userId);

      res.status(200).json({
        success: true,
        message: "Retirements retrieved successfully",
        data: retirements,
      });
    }
  );

  // Legacy method for public retirements (can be removed if not needed)
  getPublicRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        throw createError("Wallet address is required", 400);
      }

      const retirements = await retirementService.getPublicRetirements(
        walletAddress
      );

      res.status(200).json({
        success: true,
        message: "Public retirements retrieved successfully",
        data: retirements,
      });
    }
  );
}
