import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// JWT Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token is required",
        error: "UNAUTHORIZED",
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      // Get user from database
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: decoded.userId });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
          error: "UNAUTHORIZED",
        });
        return;
      }

      // Attach user to request
      req.user = user;
      req.userId = user.id;
    
    next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: "UNAUTHORIZED",
      });
      return;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

// Admin middleware (requires user to be admin)
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // This assumes user was set by authMiddleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
      return;
    }
    
    if (req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Admin access required",
        error: "FORBIDDEN",
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
}; 

// Legacy middleware for compatibility (can be removed later)
export const verifyWallet = authMiddleware;
export const verifyAdmin = adminMiddleware;
