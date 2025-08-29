import { Request, Response } from 'express';
import { RetirementController } from '../../controllers/retirement.controller';
import { RetirementService } from '../../services/retirement.service';
import { OrganizationService } from '../../services/organization.service';
import { AdminService } from '../../services/admin.service';

// Mock services
jest.mock('../../services/retirement.service');
jest.mock('../../services/organization.service');
jest.mock('../../services/admin.service');

describe('RetirementController', () => {
  let retirementController: RetirementController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockRetirementService: jest.Mocked<RetirementService>;
  let mockOrganizationService: jest.Mocked<OrganizationService>;
  let mockAdminService: jest.Mocked<AdminService>;

  beforeEach(() => {
    retirementController = new RetirementController();
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

    mockRetirementService = new RetirementService() as jest.Mocked<RetirementService>;
    mockOrganizationService = new OrganizationService() as jest.Mocked<OrganizationService>;
    mockAdminService = new AdminService() as jest.Mocked<AdminService>;
    
    (RetirementService as jest.Mock).mockImplementation(() => mockRetirementService);
    (OrganizationService as jest.Mock).mockImplementation(() => mockOrganizationService);
    (AdminService as jest.Mock).mockImplementation(() => mockAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('retireCredits', () => {
    it('should retire credits successfully', async () => {
      const mockRetirement = {
        id: 'retirement-123',
        projectId: 'project-123',
        quantity: 10,
        beneficiary: 'Test Beneficiary',
        retirementMessage: 'Test retirement message',
      };

      mockRetirementService.getUserWalletAddress.mockResolvedValue('wallet-address-123');
      mockRetirementService.retireCredits.mockResolvedValue(mockRetirement);

      mockRequest.body = {
        projectId: 'project-123',
        quantity: 10,
        beneficiary: 'Test Beneficiary',
        retirementMessage: 'Test retirement message',
        reportingPeriodStart: '2023-01-01',
        reportingPeriodEnd: '2023-12-31',
      };

      await retirementController.retireCredits(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getUserWalletAddress).toHaveBeenCalledWith('user-123');
      expect(mockRetirementService.retireCredits).toHaveBeenCalledWith(
        'wallet-address-123',
        'project-123',
        10,
        {
          beneficiary: 'Test Beneficiary',
          retirementMessage: 'Test retirement message',
          reportingPeriodStart: new Date('2023-01-01'),
          reportingPeriodEnd: new Date('2023-12-31'),
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Credits retired successfully',
        data: mockRetirement,
      });
    });

    it('should throw error when projectId is missing', async () => {
      mockRequest.body = {
        quantity: 10,
      };

      await expect(
        retirementController.retireCredits(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID and quantity (> 0) are required');
    });

    it('should throw error when quantity is missing', async () => {
      mockRequest.body = {
        projectId: 'project-123',
      };

      await expect(
        retirementController.retireCredits(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID and quantity (> 0) are required');
    });

    it('should throw error when quantity is zero', async () => {
      mockRequest.body = {
        projectId: 'project-123',
        quantity: 0,
      };

      await expect(
        retirementController.retireCredits(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID and quantity (> 0) are required');
    });

    it('should throw error when quantity is negative', async () => {
      mockRequest.body = {
        projectId: 'project-123',
        quantity: -10,
      };

      await expect(
        retirementController.retireCredits(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID and quantity (> 0) are required');
    });
  });

  describe('getUserRetirements', () => {
    it('should get user retirements successfully', async () => {
      const mockRetirements = [
        {
          id: 'retirement-1',
          projectId: 'project-1',
          quantity: 5,
          beneficiary: 'Beneficiary 1',
        },
        {
          id: 'retirement-2',
          projectId: 'project-2',
          quantity: 10,
          beneficiary: 'Beneficiary 2',
        },
      ];

      mockRetirementService.getUserRetirements.mockResolvedValue(mockRetirements);

      await retirementController.getUserRetirements(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getUserRetirements).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Retirements retrieved successfully',
        data: mockRetirements,
      });
    });

    it('should return empty array when no retirements exist', async () => {
      mockRetirementService.getUserRetirements.mockResolvedValue([]);

      await retirementController.getUserRetirements(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getUserRetirements).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Retirements retrieved successfully',
        data: [],
      });
    });
  });

  describe('getRetirementById', () => {
    it('should get retirement by ID successfully', async () => {
      const mockRetirement = {
        id: 'retirement-123',
        projectId: 'project-123',
        quantity: 10,
        beneficiary: 'Test Beneficiary',
      };

      mockRetirementService.getRetirementById.mockResolvedValue(mockRetirement);

      mockRequest.params = {
        id: 'retirement-123',
      };

      await retirementController.getRetirementById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getRetirementById).toHaveBeenCalledWith(
        'retirement-123',
        'user-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Retirement retrieved successfully',
        data: mockRetirement,
      });
    });

    it('should throw error when retirement not found', async () => {
      mockRetirementService.getRetirementById.mockResolvedValue(null);

      mockRequest.params = {
        id: 'non-existent-retirement',
      };

      await expect(
        retirementController.getRetirementById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Retirement not found');
    });
  });

  describe('getMyRetirements', () => {
    it('should get my retirements successfully (legacy method)', async () => {
      const mockRetirements = [
        {
          id: 'retirement-1',
          projectId: 'project-1',
          quantity: 5,
        },
      ];

      mockRetirementService.getUserRetirements.mockResolvedValue(mockRetirements);

      await retirementController.getMyRetirements(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getUserRetirements).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Retirements retrieved successfully',
        data: mockRetirements,
      });
    });
  });

  describe('getPublicRetirements', () => {
    it('should get public retirements successfully', async () => {
      const mockRetirements = [
        {
          id: 'retirement-1',
          projectId: 'project-1',
          quantity: 5,
          beneficiary: 'Public Beneficiary',
        },
      ];

      mockRetirementService.getPublicRetirements.mockResolvedValue(mockRetirements);

      mockRequest.params = {
        walletAddress: 'public-wallet-123',
      };

      await retirementController.getPublicRetirements(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getPublicRetirements).toHaveBeenCalledWith(
        'public-wallet-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Public retirements retrieved successfully',
        data: mockRetirements,
      });
    });

    it('should throw error when wallet address is missing', async () => {
      mockRequest.params = {};

      await expect(
        retirementController.getPublicRetirements(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Wallet address is required');
    });

    it('should return empty array when no public retirements exist', async () => {
      mockRetirementService.getPublicRetirements.mockResolvedValue([]);

      mockRequest.params = {
        walletAddress: 'empty-wallet-123',
      };

      await retirementController.getPublicRetirements(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRetirementService.getPublicRetirements).toHaveBeenCalledWith(
        'empty-wallet-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Public retirements retrieved successfully',
        data: [],
      });
    });
  });
});

