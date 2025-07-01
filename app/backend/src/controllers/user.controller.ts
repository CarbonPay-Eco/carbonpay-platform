import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

const userService = new UserService();

export class UserController {
  // Register user with complete onboarding data
  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        email,
        password,
        fullName,
        companyName,
        country,
        registrationNumber,
        industryType,
        companySize,
        description,
        tracksEmissions,
        emissionSources,
        sustainabilityCertifications,
        priorOffsetting,
        contactEmail,
        websiteUrl,
        acceptedTerms,
      } = req.body;

      // Register user and create wallet automatically (Web 2.5 style)
      const result = await AuthService.register(email, password);

      // Create organization/onboarding data
      const organizationData = {
        userId: result.user.id,
        fullName,
        companyName,
        country,
        registrationNumber,
        industryType,
        companySize,
        description,
        tracksEmissions,
        emissionSources,
        sustainabilityCertifications,
        priorOffsetting,
        contactEmail,
        websiteUrl,
        acceptedTerms,
      };

      const organization = await userService.createUserOrganization(
        organizationData
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
          },
          organization,
          token: result.token,
        },
      });
    }
  );

  // Add balance to user account (placeholder for payment integration)
  addBalance = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { amount, paymentMethod } = req.body;
      const userId = req.userId!;

      if (!amount || amount <= 0) {
        throw createError("Amount must be greater than 0", 400);
      }

      // TODO: Integrate with payment processor (Stripe, Transak, etc.)
      // For now, this is a placeholder that simulates adding balance

      const result = await userService.addBalance(
        userId,
        amount,
        paymentMethod || "placeholder"
      );

      res.status(200).json({
        success: true,
        message: "Balance added successfully",
        data: {
          transactionId: result.transactionId,
          newBalance: result.newBalance,
          amount,
        },
      });
    }
  );

  // Purchase carbon credits using account balance
  purchaseCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { projectId, quantity } = req.body;
      const userId = req.userId!;

      if (!projectId || !quantity || quantity <= 0) {
        throw createError("Project ID and quantity (> 0) are required", 400);
      }

      // Purchase credits - this will handle balance deduction and onchain minting
      const purchase = await userService.purchaseCredits(
        userId,
        projectId,
        quantity
      );

      res.status(200).json({
        success: true,
        message: "Credits purchased successfully",
        data: {
          purchaseId: purchase.id,
          projectId,
          quantity,
          totalCost: purchase.totalCost,
          txHash: purchase.txHash,
          remainingBalance: purchase.remainingBalance,
        },
      });
    }
  );

  // Get user profile (name and company)
  getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;

      const profile = await userService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
      });
    }
  );
}
