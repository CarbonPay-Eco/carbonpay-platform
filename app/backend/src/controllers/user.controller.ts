import { Request, Response } from "express";
import { AuditLogService } from "../services/audit-log.service";
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
      role = "user",
      // Optional organization fields (for web platform)
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

    // Check if this is a simple registration (mobile app) or full registration (web platform)
    const hasOrganizationData = fullName && companyName && country && acceptedTerms;

    if (hasOrganizationData) {
      // Full registration with organization data (Web platform)
      const result = await AuthService.register(email, password, role);

      // Save organization data
      await userService.createUserOrganization({
        userId: result.user.id,
        fullName,
        companyName,
        country,
        registrationNumber,
        industryType,
        companySize,
        description,
        tracksEmissions: tracksEmissions || false,
        emissionSources,
        sustainabilityCertifications,
        priorOffsetting: priorOffsetting || false,
        contactEmail,
        websiteUrl,
        acceptedTerms: acceptedTerms || false,
      });

      // Audit log
      try {
        const auditLogService = new AuditLogService();
        await auditLogService.createAuditLog(
          result.user.id,
          "USER_REGISTER",
          "users",
          result.user.id,
          { email, hasOrganizationData: true }
        );
      } catch {}

      return res.status(201).json({
        success: true,
        message: "User and organization registered successfully",
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } else {
      // Simple registration (Mobile app) - just email and password
      const result = await AuthService.register(email, password, role);
      
      // Audit log
      try {
        const auditLogService = new AuditLogService();
        await auditLogService.createAuditLog(
          result.user.id,
          "USER_REGISTER",
          "users",
          result.user.id,
          { email, hasOrganizationData: false }
        );
      } catch {}

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
        },
      });
    }

    throw createError("Registration failed", 400);
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

  // Admin CSV exports: purchases
  exportPurchasesCsv = asyncHandler(async (_req: Request, res: Response) => {
    const repo = (await import("../database/data-source")).AppDataSource.getRepository(
      (await import("../database/entities/Purchase")).Purchase
    );
    const items = await repo.find({ relations: ["project"] }).catch(async () => {
      return await repo.find();
    });
    const { Parser } = await import("json2csv");
    const fields = ["id","userId","projectId","quantity","totalCost","txHash","createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(items);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=purchases.csv");
    res.send(csv);
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
}
