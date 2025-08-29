import { Request, Response } from 'express';
import { UserController } from '../../controllers/user.controller';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/user.service';

// Mock services
jest.mock('../../services/AuthService');
jest.mock('../../services/user.service');

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    userController = new UserController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
      userId: 'user-123',
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockUserService = new UserService() as jest.Mocked<UserService>;
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register draft user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        draft: true,
      };

      (AuthService.registerDraft as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        draft: true,
      };

      await userController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(AuthService.registerDraft).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'user'
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Draft user registered successfully',
        data: {
          user: {
            email: 'test@example.com',
            draft: true,
          },
        },
      });
    });

    it('should register full user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockToken = 'jwt-token-123';
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Company',
      };

      (AuthService.register as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      mockUserService.createUserOrganization.mockResolvedValue(mockOrganization);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        companyName: 'Test Company',
        country: 'US',
        role: 'user',
      };

      await userController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(AuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'user'
      );
      expect(mockUserService.createUserOrganization).toHaveBeenCalledWith({
        userId: 'user-123',
        fullName: 'John Doe',
        companyName: 'Test Company',
        country: 'US',
        role: 'user',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockToken = 'jwt-token-123';
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Company',
      };

      (AuthService.completeRegistration as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      mockUserService.createUserOrganization.mockResolvedValue(mockOrganization);

      mockRequest.body = {
        email: 'test@example.com',
        fullName: 'John Doe',
        companyName: 'Test Company',
        country: 'US',
      };

      await userController.completeRegistration(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(AuthService.completeRegistration).toHaveBeenCalledWith(
        'test@example.com',
        {
          fullName: 'John Doe',
          companyName: 'Test Company',
          country: 'US',
        }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should throw error when email is missing', async () => {
      mockRequest.body = {
        fullName: 'John Doe',
      };

      await expect(
        userController.completeRegistration(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Email is required to complete registration');
    });
  });

  describe('addBalance', () => {
    it('should add balance successfully', async () => {
      const mockResult = {
        transactionId: 'tx-123',
        newBalance: 1000,
      };

      mockUserService.addBalance.mockResolvedValue(mockResult);

      mockRequest.body = {
        amount: 500,
        paymentMethod: 'stripe',
      };

      await userController.addBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockUserService.addBalance).toHaveBeenCalledWith(
        'user-123',
        500,
        'stripe'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Balance added successfully',
        data: {
          transactionId: 'tx-123',
          newBalance: 1000,
          amount: 500,
        },
      });
    });

    it('should throw error when amount is missing', async () => {
      mockRequest.body = {
        paymentMethod: 'stripe',
      };

      await expect(
        userController.addBalance(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error when amount is zero', async () => {
      mockRequest.body = {
        amount: 0,
        paymentMethod: 'stripe',
      };

      await expect(
        userController.addBalance(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error when amount is negative', async () => {
      mockRequest.body = {
        amount: -100,
        paymentMethod: 'stripe',
      };

      await expect(
        userController.addBalance(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Amount must be greater than 0');
    });
  });

  describe('purchaseCredits', () => {
    it('should purchase credits successfully', async () => {
      const mockPurchase = {
        id: 'purchase-123',
        totalCost: 100,
        txHash: 'tx-hash-123',
        remainingBalance: 900,
      };

      mockUserService.purchaseCredits.mockResolvedValue(mockPurchase);

      mockRequest.body = {
        projectId: 'project-123',
        quantity: 10,
      };

      await userController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockUserService.purchaseCredits).toHaveBeenCalledWith(
        'user-123',
        'project-123',
        10
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Credits purchased successfully',
        data: {
          purchaseId: 'purchase-123',
          projectId: 'project-123',
          quantity: 10,
          totalCost: 100,
          txHash: 'tx-hash-123',
          remainingBalance: 900,
        },
      });
    });

    it('should throw error when projectId is missing', async () => {
      mockRequest.body = {
        quantity: 10,
      };

      await expect(
        userController.purchaseCredits(
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
        userController.purchaseCredits(
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
        userController.purchaseCredits(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Project ID and quantity (> 0) are required');
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'John Doe',
        companyName: 'Test Company',
      };

      mockUserService.getUserProfile.mockResolvedValue(mockProfile);

      await userController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: mockProfile,
      });
    });
  });
});

