import { AuthService } from '../../services/AuthService';
import { setupRepositoryMock } from '../test-helpers';
import { User } from '../../entities/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { WalletService } from '../../services/WalletService';
import { AppDataSource } from '../../database/data-source';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../services/WalletService');
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Mock User entity
jest.mock('../../entities/User', () => {
  class MockUser {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;

    constructor() {
      this.id = 'user-1';
      this.email = '';
      this.passwordHash = '';
      this.role = 'user';
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }
  }

  const createMockUser = (data: any = {}) => {
    const user = new MockUser();
    Object.assign(user, data);
    return user;
  };

  return { 
    User: MockUser,
    createMockUser
  };
});

// Import the mock creator
const { createMockUser } = jest.requireMock('../../entities/User');

describe('AuthService', () => {
  let userRepository: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    userRepository = setupRepositoryMock('User');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (jwt.sign as jest.Mock).mockReturnValue('test_token');

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepository);

    // Mock create method with proper data handling
    userRepository.create.mockImplementation((userData) => {
      return createMockUser({
        ...userData,
        id: 'user-1' // Set ID during creation
      });
    });

    // Mock the save method to set an ID and return a proper User instance
    userRepository.save.mockImplementation((user) => {
      return Promise.resolve(createMockUser({
        ...user,
        id: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await AuthService.register('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'test_token');

      const user = result.user;
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashed_password');
      expect(user.role).toBe('user');

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.any(String),
        { expiresIn: '24h' }
      );
    });

    it('should throw error if user already exists', async () => {
      const existingUser = createMockUser({
        id: 'user-1',
        email: 'test@example.com'
      });

      userRepository.findOneBy.mockResolvedValue(existingUser);

      await expect(AuthService.register('test@example.com', 'password123'))
        .rejects
        .toThrow('User already exists');

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should register user with custom role', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await AuthService.register('test@example.com', 'password123', 'admin');

      expect(result).toHaveProperty('user');
      const user = result.user;
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashed_password');
      expect(user.role).toBe('admin');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockDecodedToken = { userId: 'user-1' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = AuthService.verifyToken('valid_token');

      expect(result).toEqual(mockDecodedToken);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => AuthService.verifyToken('invalid_token'))
        .toThrow('Invalid token');
    });
  });
}); 