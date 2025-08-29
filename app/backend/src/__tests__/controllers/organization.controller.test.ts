import { Request, Response } from 'express';
import { OrganizationController } from '../../controllers/organization.controller';
import { OrganizationService } from '../../services/organization.service';
import { AdminService } from '../../services/admin.service';

// Mock services
jest.mock('../../services/organization.service');
jest.mock('../../services/admin.service');

describe('OrganizationController', () => {
  let organizationController: OrganizationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockOrganizationService: jest.Mocked<OrganizationService>;
  let mockAdminService: jest.Mocked<AdminService>;

  beforeEach(() => {
    organizationController = new OrganizationController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      walletAddress: 'wallet-address-123',
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockOrganizationService = new OrganizationService() as jest.Mocked<OrganizationService>;
    mockAdminService = new AdminService() as jest.Mocked<AdminService>;
    
    (OrganizationService as jest.Mock).mockImplementation(() => mockOrganizationService);
    (AdminService as jest.Mock).mockImplementation(() => mockAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization successfully', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        walletAddress: 'wallet-address-123',
      };

      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(null);
      mockOrganizationService.createOrganization.mockResolvedValue(mockOrganization);
      mockAdminService.createAuditLog.mockResolvedValue(undefined);

      mockRequest.body = {
        name: 'Test Organization',
        description: 'Test description',
      };

      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationService.getOrganizationByWallet).toHaveBeenCalledWith(
        'wallet-address-123'
      );
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
        'wallet-address-123',
        {
          name: 'Test Organization',
          description: 'Test description',
        }
      );
      expect(mockAdminService.createAuditLog).toHaveBeenCalledWith(
        'wallet-address-123',
        'ORGANIZATION_CREATE',
        {
          organizationId: 'org-123',
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Organization created successfully',
        data: mockOrganization,
      });
    });

    it('should throw error when organization already exists', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Existing Organization',
      };

      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(existingOrg);

      mockRequest.body = {
        name: 'Test Organization',
      };

      await expect(
        organizationController.createOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Organization already exists for this wallet');
    });
  });

  describe('getMyOrganization', () => {
    it('should get organization successfully', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        walletAddress: 'wallet-address-123',
      };

      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(mockOrganization);

      await organizationController.getMyOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationService.getOrganizationByWallet).toHaveBeenCalledWith(
        'wallet-address-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Organization retrieved successfully',
        data: mockOrganization,
      });
    });

    it('should throw error when organization not found', async () => {
      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(null);

      await expect(
        organizationController.getMyOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Old Organization',
      };

      const updatedOrg = {
        id: 'org-123',
        name: 'Updated Organization',
        walletAddress: 'wallet-address-123',
      };

      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(existingOrg);
      mockOrganizationService.updateOrganization.mockResolvedValue(updatedOrg);
      mockAdminService.createAuditLog.mockResolvedValue(undefined);

      mockRequest.body = {
        name: 'Updated Organization',
        description: 'Updated description',
      };

      await organizationController.updateOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationService.getOrganizationByWallet).toHaveBeenCalledWith(
        'wallet-address-123'
      );
      expect(mockOrganizationService.updateOrganization).toHaveBeenCalledWith(
        'wallet-address-123',
        {
          name: 'Updated Organization',
          description: 'Updated description',
        }
      );
      expect(mockAdminService.createAuditLog).toHaveBeenCalledWith(
        'wallet-address-123',
        'ORGANIZATION_UPDATE',
        {
          organizationId: 'org-123',
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Organization updated successfully',
        data: updatedOrg,
      });
    });

    it('should throw error when organization not found for update', async () => {
      mockOrganizationService.getOrganizationByWallet.mockResolvedValue(null);

      mockRequest.body = {
        name: 'Updated Organization',
      };

      await expect(
        organizationController.updateOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('getAllOrganizations', () => {
    it('should get all organizations successfully', async () => {
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Organization 1',
          walletAddress: 'wallet-1',
        },
        {
          id: 'org-2',
          name: 'Organization 2',
          walletAddress: 'wallet-2',
        },
      ];

      mockOrganizationService.getAllOrganizations.mockResolvedValue(mockOrganizations);

      await organizationController.getAllOrganizations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationService.getAllOrganizations).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Organizations retrieved successfully',
        data: mockOrganizations,
      });
    });

    it('should return empty array when no organizations exist', async () => {
      mockOrganizationService.getAllOrganizations.mockResolvedValue([]);

      await organizationController.getAllOrganizations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationService.getAllOrganizations).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Organizations retrieved successfully',
        data: [],
      });
    });
  });
});

