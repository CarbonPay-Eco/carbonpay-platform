import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../utils/erroHandler';

const projectService = new ProjectService();
const adminService = new AdminService();

export class ProjectController {
  createProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const walletAddress = req.walletAddress as string;
    const projectData = req.body;
    
    // Check if user is admin
    const isAdmin = await adminService.isAdmin(walletAddress);
    
    if (!isAdmin) {
      throw createError('Only admins can create projects', 403);
    }
    
    // Create project
    const project = await projectService.createProject(projectData, walletAddress);
    
    // Log action
    await adminService.createAuditLog(
      walletAddress,
      'PROJECT_CREATE',
      { projectId: project.id, tokenId: project.tokenId }
    );
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  });
  
  getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const projects = await projectService.getAllProjects();
    
    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects
    });
  });
  
  getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token_id } = req.params;
    
    if (!token_id) {
      throw createError('Project ID or token ID is required', 400);
    }
    
    const project = await projectService.getProjectById(token_id);
    
    if (!project) {
      throw createError('Project not found', 404);
    }
    
    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: project
    });
  });
} 