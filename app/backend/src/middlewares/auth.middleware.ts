import { Request, Response, NextFunction } from 'express';
import { SolanaService } from '../services/solana.service';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/AuthService';

// Instantiate services
const solanaService = new SolanaService();
const adminService = new AdminService();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify wallet connection
export const verifyWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract wallet address from request
    const walletAddress = req.headers['x-wallet-address'] as string;
    
    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address is required for authentication',
        error: 'UNAUTHORIZED'
      });
      return;
    }
    
    // Attach wallet address to request for use in controllers
    req.walletAddress = walletAddress;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error
    });
  }
};

// Middleware to verify admin rights
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const walletAddress = req.walletAddress as string;
    
    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }
    
    // Check if wallet has admin rights
    const isAdmin = await adminService.isAdmin(walletAddress);
    
    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin permissions',
      error
    });
  }
};

// Middleware to authenticate JWT tokens (required)
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.toLowerCase().startsWith('bearer ') 
    ? authHeader.substring(7).trim() 
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access token is required' });
    return;
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to optionally authenticate JWT tokens
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.toLowerCase().startsWith('bearer ') 
    ? authHeader.substring(7).trim() 
    : null;

  if (token) {
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Ignore errors in optional auth
      req.user = null;
    }
  }

  next();
}; 