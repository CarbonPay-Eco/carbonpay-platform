import { Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/AuthService';

// Mock AuthService
jest.mock('../../services/AuthService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {},
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
      };
      
      const mockToken = 'jwt-token-123';
      
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(AuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          token: 'jwt-token-123',
        },
      });
    });

    it('should throw error when email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error when password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error when both email and password are missing', async () => {
      mockRequest.body = {};

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Email and password are required');
    });

    it('should handle AuthService login error', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifySignature', () => {
    it('should throw deprecated error for signature verification', async () => {
      await expect(
        authController.verifySignature(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(
        'Signature verification is deprecated. Please use email/password authentication.'
      );
    });
  });
});

