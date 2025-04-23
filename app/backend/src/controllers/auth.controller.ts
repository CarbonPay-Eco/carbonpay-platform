import { Request, Response } from 'express';
import { SolanaService } from '../services/solana.service';
import { AdminService } from '../services/admin.service';
import { WalletSignature } from '../types/solana';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/errorHandler';

const solanaService = new SolanaService();
const adminService = new AdminService();

export class AuthController {
  verifySignature = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { address, message, signature }: WalletSignature = req.body;
    
    if (!address || !message || !signature) {
      throw createError('Missing required fields: address, message, and signature are required', 400);
    }
    
    // Verify the signature
    const isValid = await solanaService.verifySignature({
      address,
      message,
      signature
    });
    
    if (!isValid) {
      throw createError('Invalid signature', 401);
    }
    
    // Log the authentication
    await adminService.createAuditLog(
      address, 
      'AUTH_VERIFY', 
      { message }
    );
    
    res.status(200).json({
      success: true,
      message: 'Signature verified successfully',
      data: {
        address,
        verified: true
      }
    });
  });
} 