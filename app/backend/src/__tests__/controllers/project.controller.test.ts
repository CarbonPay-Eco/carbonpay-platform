import { Request, Response } from 'express';
import { ProjectController } from '../../controllers/project.controller';
import { ProjectService } from '../../services/project.service';
import { AdminService } from '../../services/admin.service';

// Mock services
jest.mock('../../services/project.service');
jest.mock('../../services/admin.service');

describe('ProjectController', () => {
  let projectController: ProjectController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockProjectService: jest.Mocked<ProjectService>;
  let mockAdminService: jest.Mocked<AdminService>;

  beforeEach(() => {
    projectController = new ProjectController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      userId: 'user-123',
      params: {},
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockProjectService = new ProjectService() as jest.Mocked<ProjectService>;
    mockAdminService = new AdminService() as jest.Mocked<AdminService>;
    
    (ProjectService as jest.Mock).mockImplementation(() => mockProjectService);
    (AdminService as jest.Mock).mockImplementation(() => mockAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully when user is admin', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        tokenId: 'token-123',
      };

      mockAdminService.isAdmin.mockResolvedValue(true);
      mockProjectService.createProject.mockResolvedValue(mockProject);
      mockAdminService.createAuditLog.mockResolvedValue(undefined);

      mockRequest.body = {
        name: 'Test Project',
        description: 'Test description',
        location: 'Test Location',
      };

      await projectController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAdminService.isAdmin).toHaveBeenCalledWith('user-123');
      expect(mockProjectService.createProject).toHaveBeenCalledWith(
        {
          name: 'Test Project',
          description: 'Test description',
          location: 'Test Location',
        },
        'user-123'
      );
      expect(mockAdminService.createAuditLog).toHaveBeenCalledWith(
        'user-123',
        'PROJECT_CREATE',
        {
          projectId: 'project-123',
          tokenId: 'token-123',
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Project created successfully',
        data: mockProject,
      });
    });

    it('should throw error when user is not admin', async () => {
      mockAdminService.isAdmin.mockResolvedValue(false);

      mockRequest.body = {
        name: 'Test Project',
      };

      await expect(
        projectController.createProject(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Only admins can create projects');
    });
  });

  describe('getAllProjects', () => {
    it('should get all projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          tokenId: 'token-1',
        },
        {
          id: 'project-2',
          name: 'Project 2',
          tokenId: 'token-2',
        },
      ];

      mockProjectService.getAllProjects.mockResolvedValue(mockProjects);

      await projectController.getAllProjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectService.getAllProjects).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Projects retrieved successfully',
        data: mockProjects,
      });
    });

    it('should return empty array when no projects exist', async () => {
      mockProjectService.getAllProjects.mockResolvedValue([]);

      await projectController.getAllProjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectService.getAllProjects).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Projects retrieved successfully',
        data: [],
      });
    });
  });

  describe('getAvailableProjects', () => {
    it('should get available projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Available Project 1',
          tokenId: 'token-1',
          availableCredits: 1000,
        },
        {
          id: 'project-2',
          name: 'Available Project 2',
          tokenId: 'token-2',
          availableCredits: 500,
        },
      ];

      mockProjectService.getAvailableProjects.mockResolvedValue(mockProjects);

      await projectController.getAvailableProjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectService.getAvailableProjects).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Available projects retrieved successfully',
        data: mockProjects,
      });
    });

    it('should return empty array when no available projects exist', async () => {
      mockProjectService.getAvailableProjects.mockResolvedValue([]);

      await projectController.getAvailableProjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectService.getAvailableProjects).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Available projects retrieved successfully',
        data: [],
      });
    });
  });

  describe('getProjectById', () => {
    it('should get project by token ID successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        tokenId: 'token-123',
        description: 'Test description',
      };

      mockProjectService.getProjectById.mockResolvedValue(mockProject);

      mockRequest.params = {
        token_id: 'token-123',
      };

      await projectController.getProjectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('token-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Project retrieved successfully',
        data: mockProject,
      });
    });

    it('should throw error when token_id is missing', async () => {
      mockRequest.params = {};

      await expect(
        projectController.getProjectById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID or token ID is required');
    });

    it('should throw error when project not found', async () => {
      mockProjectService.getProjectById.mockResolvedValue(null);

      mockRequest.params = {
        token_id: 'non-existent-token',
      };

      await expect(
        projectController.getProjectById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project not found');
    });
  });
});

