import { Request, Response } from 'express';
import { SolanaService } from '../services/solana.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/errorHandler';

const solanaService = new SolanaService();

export class WalletController {
  getWalletInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { address } = req.params;

    if (!address) {
      throw createError('Wallet address is required', 400);
    }

    const walletInfo = await solanaService.getWalletInfo(address);
    
    res.status(200).json({
      success: true,
      message: 'Wallet info retrieved successfully',
      data: walletInfo
    });
  });
} 