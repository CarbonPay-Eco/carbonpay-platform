import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

export class AuthController {
  // Email/password login
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw createError("Email and password are required", 400);
    }
    
    const result = await AuthService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        token: result.token,
      },
    });
  });

  // Legacy signature verification (kept for compatibility if needed)
  verifySignature = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // This method is deprecated in Web 2.5 approach but kept for backward compatibility
      throw createError(
        "Signature verification is deprecated. Please use email/password authentication.",
        400
      );
    }
  );
}
