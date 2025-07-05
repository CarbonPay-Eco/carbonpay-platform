// Set environment variables before importing any modules
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

// Mock all dependencies before importing anything
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../../services/WalletService", () => ({
  WalletService: {
    createWallet: jest.fn(),
  },
}));

// Mock the database connection completely
jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    })),
  },
}));

// Mock entities
jest.mock("../../entities/User", () => ({
  User: class User {
    id = "test-user-id";
    email = "";
    passwordHash = "";
    createdAt = new Date();
    updatedAt = new Date();
  },
}));

jest.mock("../../entities/Wallet", () => ({
  Wallet: class Wallet {
    id = "test-wallet-id";
    userId = "";
    publicKey = "";
    encryptedPrivateKey = "";
    createdAt = new Date();
    updatedAt = new Date();
  },
}));

// Now import the service
const { AuthService } = require("../../services/AuthService");

describe("AuthService", () => {
  let mockUserRepository: any;
  let mockBcrypt: any;
  let mockJWT: any;
  let mockWalletService: any;

  beforeAll(async () => {
    // Get all mocked modules
    const { AppDataSource } = require("../../database/data-source");
    mockUserRepository = AppDataSource.getRepository();
    mockBcrypt = require("bcryptjs");
    mockJWT = require("jsonwebtoken");
    const walletServiceModule = require("../../services/WalletService");
    mockWalletService = walletServiceModule.WalletService;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockBcrypt.hash.mockResolvedValue("hashedPassword");
    mockBcrypt.compare.mockResolvedValue(true);
    mockJWT.sign.mockReturnValue("mock-jwt-token");
    mockJWT.verify.mockReturnValue({ userId: "test-user-id" });
    mockWalletService.createWallet.mockResolvedValue({});
    
    // Setup repository mocks - reset for each test
    mockUserRepository.findOneBy.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation((user) => Promise.resolve({ 
      ...user, 
      id: "test-user-id" 
    }));
    mockUserRepository.create.mockImplementation((userData) => ({
      ...userData,
      id: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  describe("register", () => {
    test("should successfully register a new user", async () => {
      const email = "test@example.com";
      const password = "password123";

      const result = await AuthService.register(email, password);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe("mock-jwt-token");
      expect(result.user.email).toBe(email);
      
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockJWT.sign).toHaveBeenCalledWith(
        { userId: result.user.id },
        "test-secret",
        { expiresIn: "24h" }
      );
    });

    test("should throw error if user already exists", async () => {
      const email = "existing@example.com";
      const password = "password123";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue({
          id: "existing-user-id",
          email: email,
          passwordHash: "hashedPassword"
        }),
        save: jest.fn(),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);

      await expect(AuthService.register(email, password)).rejects.toThrow(
        "User already exists"
      );
    });

    test("should handle bcrypt hash error", async () => {
      const email = "test@example.com";
      const password = "password123";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue(null), // No existing user
        save: jest.fn(),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);
      mockBcrypt.hash.mockRejectedValueOnce(new Error("Hash error"));

      await expect(AuthService.register(email, password)).rejects.toThrow(
        "Hash error"
      );
    });

    test("should create wallet after user registration", async () => {
      const email = "test@example.com";
      const password = "password123";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue(null), // No existing user
        save: jest.fn().mockImplementation((user) => Promise.resolve({ 
          ...user, 
          id: "test-user-id" 
        })),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);

      const result = await AuthService.register(email, password);

      expect(mockWalletService.createWallet).toHaveBeenCalledWith(
        result.user.id,
        password
      );
    });
  });

  describe("login", () => {
    test("should successfully login with valid credentials", async () => {
      const email = "test@example.com";
      const password = "password123";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue({
          id: "test-user-id",
          email: email,
          passwordHash: "hashedPassword"
        }),
        save: jest.fn(),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);

      const result = await AuthService.login(email, password);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe("mock-jwt-token");
      expect(result.user.email).toBe(email);
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, "hashedPassword");
    });

    test("should throw error if user not found", async () => {
      const email = "nonexistent@example.com";
      const password = "password123";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue(null), // No user found
        save: jest.fn(),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);
      
      await expect(AuthService.login(email, password)).rejects.toThrow(
        "User not found"
      );
    });

    test("should throw error if password is invalid", async () => {
      const email = "test@example.com";
      const password = "wrongpassword";

      // Setup fresh mock for this specific test
      const { AppDataSource } = require("../../database/data-source");
      const localMockRepository = {
        findOneBy: jest.fn().mockResolvedValue({
          id: "test-user-id",
          email: email,
          passwordHash: "hashedPassword"
        }),
        save: jest.fn(),
        create: jest.fn(),
      };
      AppDataSource.getRepository.mockReturnValue(localMockRepository);
      mockBcrypt.compare.mockResolvedValueOnce(false);

      await expect(AuthService.login(email, password)).rejects.toThrow(
        "Invalid password"
      );
    });
  });

  describe("verifyToken", () => {
    test("should successfully verify valid token", () => {
      const token = "valid-token";
      const expectedPayload = { userId: "test-user-id" };

      mockJWT.verify.mockReturnValue(expectedPayload);

      const result = AuthService.verifyToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJWT.verify).toHaveBeenCalledWith(token, "test-secret");
    });

    test("should throw error for invalid token", () => {
      const token = "invalid-token";

      mockJWT.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => AuthService.verifyToken(token)).toThrow("Invalid token");
    });
  });
}); 