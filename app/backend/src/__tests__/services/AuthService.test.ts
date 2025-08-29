import { AuthService } from '../../services/AuthService';
import { WalletService } from '../../services/WalletService';
import { AppDataSource } from '../../database/data-source';
import { User } from '../../entities/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../services/WalletService');
jest.mock('../../database/data-source');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
      };

      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (WalletService.createWallet as jest.Mock).mockResolvedValue({});
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');

      const result = await AuthService.register('test@example.com', 'password123', 'user');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
      }));
      expect(WalletService.createWallet).toHaveBeenCalledWith('user-123', 'password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'your-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        user: mockUser,
        token: 'jwt-token-123',
      });
    });

    it('should throw error when user already exists', async () => {
      const existingUser = { id: 'existing-user', email: 'test@example.com' };
      mockRepository.findOneBy.mockResolvedValue(existingUser);

      await expect(
        AuthService.register('test@example.com', 'password123')
      ).rejects.toThrow('User already exists');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should use default role when not provided', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
      };

      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (WalletService.createWallet as jest.Mock).mockResolvedValue({});
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');

      await AuthService.register('test@example.com', 'password123');

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        role: 'user',
      }));
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');

      const result = await AuthService.login('test@example.com', 'password123');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'your-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        user: mockUser,
        token: 'jwt-token-123',
      });
    });

    it('should throw error when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        AuthService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('User not found');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid password');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('registerDraft', () => {
    it('should register draft user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        draft: true,
      };

      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await AuthService.registerDraft('test@example.com', 'password123', 'user');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        draft: true,
      }));
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw error when user already exists', async () => {
      const existingUser = { id: 'existing-user', email: 'test@example.com' };
      mockRepository.findOneBy.mockResolvedValue(existingUser);

      await expect(
        AuthService.registerDraft('test@example.com', 'password123')
      ).rejects.toThrow('User already exists');
    });

    it('should use default role when not provided', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        draft: true,
      };

      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await AuthService.registerDraft('test@example.com', 'password123');

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        role: 'user',
      }));
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        draft: true,
      };

      const updatedUser = {
        ...mockUser,
        draft: false,
        fullName: 'John Doe',
        companyName: 'Test Company',
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);
      (WalletService.createWallet as jest.Mock).mockResolvedValue({});
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');

      const result = await AuthService.completeRegistration('test@example.com', {
        fullName: 'John Doe',
        companyName: 'Test Company',
      });

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        draft: false,
        fullName: 'John Doe',
        companyName: 'Test Company',
      }));
      expect(WalletService.createWallet).toHaveBeenCalledWith('user-123', 'temp-password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'your-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        user: updatedUser,
        token: 'jwt-token-123',
      });
    });

    it('should throw error when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        AuthService.completeRegistration('nonexistent@example.com', {})
      ).rejects.toThrow('User not found');
    });

    it('should handle wallet creation error gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        draft: true,
      };

      const updatedUser = {
        ...mockUser,
        draft: false,
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);
      (WalletService.createWallet as jest.Mock).mockRejectedValue(new Error('Wallet already exists'));
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token-123');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await AuthService.completeRegistration('test@example.com', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'Wallet already exists or error creating:',
        expect.any(Error)
      );
      expect(result).toEqual({
        user: updatedUser,
        token: 'jwt-token-123',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const mockPayload = { userId: 'user-123' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = AuthService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'your-secret-key');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error when token is invalid', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => AuthService.verifyToken('invalid-token')).toThrow('Invalid token');
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'your-secret-key');
    });
  });
});

