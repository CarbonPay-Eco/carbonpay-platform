import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

const userService = new UserService();

export class UserController {
  // Register user with possible draft
  register = asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      password,
      draft = false,
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
      role = "user",
    } = req.body;

    // If draft, only require email and password
    if (draft) {
      const result = await AuthService.registerDraft(email, password, role);
      return res.status(201).json({
        success: true,
        message: "Draft user registered successfully",
        data: {
          user: {
            email,
            draft: true,
          },
        },
      });
    }

    // Register user and create wallet automatically (Web 2.5 style)
    const result = await AuthService.register(email, password, role);

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
          role: result.user.role,
        },
        organization,
        token: result.token,
      },
    });
  });

  // PATCH endpoint to complete registration
  completeRegistration = asyncHandler(async (req: Request, res: Response) => {
    const { email, ...fields } = req.body;
    if (!email) {
      throw createError("Email is required to complete registration", 400);
    }

    // Complete the user registration e obtenha o token
    const result = await AuthService.completeRegistration(email, fields);

    // Crie a organização se os campos obrigatórios existirem
    const organizationData = {
      userId: result.user.id,
      fullName: fields.fullName,
      companyName: fields.companyName,
      country: fields.country,
      registrationNumber: fields.registrationNumber,
      industryType: fields.industryType,
      companySize: fields.companySize,
      description: fields.description,
      tracksEmissions: fields.tracksEmissions,
      emissionSources: fields.emissionSources,
      sustainabilityCertifications: fields.sustainabilityCertifications,
      priorOffsetting: fields.priorOffsetting,
      contactEmail: fields.contactEmail,
      websiteUrl: fields.websiteUrl,
      acceptedTerms: fields.acceptedTerms,
    };

    let organization: any = null;
    if (fields.fullName && fields.companyName && fields.country) {
      try {
        organization = await userService.createUserOrganization(
          organizationData
        );
      } catch (error) {
        console.error("Error creating organization:", error);
      }
    }

    res.status(200).json({
      success: true,
      message: "Registration completed successfully",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        organization,
        token: result.token, // <-- GARANTE QUE O TOKEN É RETORNADO
      },
    });
  });

  // Add balance to user account (placeholder for payment integration)
  addBalance = asyncHandler(async (req: Request, res: Response) => {
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
  });

  // Purchase carbon credits using account balance
  purchaseCredits = asyncHandler(async (req: Request, res: Response) => {
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
  });

  // Get user profile (name and company)
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const profile = await userService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  });

  // Get user purchases (carbon credits)
  getPurchases = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const purchases = await userService.getUserPurchases(userId);

    res.status(200).json({
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  });
}
