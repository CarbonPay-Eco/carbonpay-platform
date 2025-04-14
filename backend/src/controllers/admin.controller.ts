import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/erroHandler';

const adminService = new AdminService();

export class AdminController {
  getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    
    // Check if user is admin (this check is also in the middleware but we double check here)
    const isAdmin = await adminService.isAdmin(walletAddress);
    
    if (!isAdmin) {
      throw createError('Unauthorized', 403);
    }
    
    const auditLogs = await adminService.getAuditLogs();
    
    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: auditLogs
    });
  });
  
  getProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    
    // Check if user is admin (this check is also in the middleware but we double check here)
    const isAdmin = await adminService.isAdmin(walletAddress);
    
    if (!isAdmin) {
      throw createError('Unauthorized', 403);
    }
    
    const projects = await adminService.getAdminProjects();
    
    res.status(200).json({
      success: true,
      message: 'Admin projects retrieved successfully',
      data: projects
    });
  });
} 