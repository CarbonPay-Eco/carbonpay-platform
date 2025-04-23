import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/errorHandler';

const organizationService = new OrganizationService();
const adminService = new AdminService();

export class OrganizationController {
  createOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    const organizationData = req.body;
    
    // Check if organization already exists for this wallet
    const existingOrg = await organizationService.getOrganizationByWallet(walletAddress);
    
    if (existingOrg) {
      throw createError('Organization already exists for this wallet', 409);
    }
    
    // Create organization
    const organization = await organizationService.createOrganization(
      walletAddress,
      organizationData
    );
    
    // Log action
    await adminService.createAuditLog(
      walletAddress,
      'ORGANIZATION_CREATE',
      { organizationId: organization.id }
    );
    
    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });
  });
  
  getMyOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    
    const organization = await organizationService.getOrganizationByWallet(walletAddress);
    
    if (!organization) {
      throw createError('Organization not found', 404);
    }
    
    res.status(200).json({
      success: true,
      message: 'Organization retrieved successfully',
      data: organization
    });
  });
  
  updateOrganization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    const organizationData = req.body;
    
    const existingOrg = await organizationService.getOrganizationByWallet(walletAddress);
    
    if (!existingOrg) {
      throw createError('Organization not found', 404);
    }
    
    const updatedOrganization = await organizationService.updateOrganization(
      walletAddress,
      organizationData
    );
    
    // Log action
    await adminService.createAuditLog(
      walletAddress,
      'ORGANIZATION_UPDATE',
      { organizationId: existingOrg.id }
    );
    
    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization
    });
  });
} 