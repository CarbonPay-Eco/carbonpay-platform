import { Request, Response } from 'express';
import { RetirementService } from '../services/retirement.service';
import { OrganizationService } from '../services/organization.service';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/errorHandler';

const retirementService = new RetirementService();
const organizationService = new OrganizationService();
const adminService = new AdminService();

export class RetirementController {
  retireCredits = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    const { projectId, amount, beneficiary, retirementMessage } = req.body;
    
    if (!projectId || !amount) {
      throw createError('Project ID and amount are required', 400);
    }
    
    if (amount <= 0) {
      throw createError('Amount must be greater than zero', 400);
    }
    
    // Get organization for the wallet
    const organization = await organizationService.getOrganizationByWallet(walletAddress);
    
    if (!organization) {
      throw createError('Organization not found for this wallet', 404);
    }
    
    // Retire credits
    const retirement = await retirementService.retireCredits(
      walletAddress,
      projectId,
      amount,
      {
        beneficiary,
        retirementMessage
      }
    );
    
    // Log action
    await adminService.createAuditLog(
      walletAddress,
      'CREDIT_RETIRE',
      {
        projectId,
        amount,
        retirementId: retirement.id,
        txHash: retirement.txHash
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Credits retired successfully',
      data: retirement
    });
  });
  
  getMyRetirements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    
    const retirements = await retirementService.getRetirementsByWallet(walletAddress);
    
    
    res.status(200).json({
      success: true,
      message: 'Retirements retrieved successfully',
      data: retirements
    });
  });
  
  getPublicRetirements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      throw createError('Wallet address is required', 400);
    }
    
    // Get organization for the wallet
    const organization = await organizationService.getOrganizationByWallet(walletAddress);
    
    if (!organization) {
      throw createError('Organization not found for this wallet', 404);
    }
    
    const retirements = await retirementService.getRetirementsByWallet(walletAddress);
    
    res.status(200).json({
      success: true,
      message: 'Public retirements retrieved successfully',
      data: {
        organization,
        retirements
      }
    });
  });
} 