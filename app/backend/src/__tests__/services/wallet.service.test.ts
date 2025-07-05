import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { WalletService } from "../../services/wallet.service";
import { Repository } from "typeorm";
import { Wallet } from "../../database/entities/Wallet";
import { AppDataSource } from "../../database/data-source";
import { Organization } from "../../database/entities/Organization";

// Mock the TypeORM repository
const mockRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn()
} as unknown as jest.Mocked<Repository<Wallet>>;

// Mock the AppDataSource
jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));

describe("WalletService", () => {
  let walletService: WalletService;

  const mockOrganization: Organization = {
    id: "test-org-id",
    walletId: "test-wallet-id",
    fullName: "Test Organization",
    companyName: "Test Company",
    country: "Test Country",
    registrationNumber: "123456",
    industryType: "Technology",
    companySize: "Medium",
    description: "Test Description",
    tracksEmissions: false,
    emissionSources: [],
    sustainabilityCertifications: [],
    priorOffsetting: false,
    contactEmail: "test@example.com",
    websiteUrl: "https://example.com",
    acceptedTerms: true,
    createdAt: new Date(),
    wallet: undefined as any // Will be set after wallet creation
  };

  const mockWallet: Wallet = {
    id: "test-wallet-id",
    walletAddress: "test-wallet-address",
    role: "user",
    provider: "test-provider",
    createdAt: new Date(),
    organization: mockOrganization,
    retirements: [],
    auditLogs: []
  };

  mockOrganization.wallet = mockWallet;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh instance
    walletService = new WalletService();

    // Setup default mock implementations
    mockRepository.findOne.mockResolvedValue(mockWallet);
    mockRepository.findOneBy.mockResolvedValue(mockWallet);
    mockRepository.create.mockReturnValue(mockWallet);
    mockRepository.save.mockResolvedValue(mockWallet);
  });

  describe("findByAddress", () => {
    test("should find wallet by address", async () => {
      const result = await walletService.findByAddress("test-wallet-address");

      expect(result).toEqual(mockWallet);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { walletAddress: "test-wallet-address" }
      });
    });

    test("should return null when wallet not found", async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await walletService.findByAddress("nonexistent-wallet");

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { walletAddress: "nonexistent-wallet" }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.findOne.mockRejectedValueOnce(new Error("Database error"));

      await expect(walletService.findByAddress("test-wallet-address"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getOrCreateWallet", () => {
    test("should return existing wallet", async () => {
      const result = await walletService.getOrCreateWallet("test-wallet-address", "test-provider");

      expect(result).toEqual(mockWallet);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { walletAddress: "test-wallet-address" }
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test("should create new wallet when not found", async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await walletService.getOrCreateWallet("new-wallet-address", "test-provider");

      expect(result).toEqual(mockWallet);
      expect(mockRepository.create).toHaveBeenCalledWith({
        walletAddress: "new-wallet-address",
        provider: "test-provider",
        createdAt: expect.any(Date)
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockWallet);
    });

    test("should handle repository errors", async () => {
      mockRepository.findOne.mockRejectedValueOnce(new Error("Database error"));

      await expect(walletService.getOrCreateWallet("test-wallet-address"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("setWalletRole", () => {
    test("should update wallet role", async () => {
      const updatedWallet = { ...mockWallet, role: "admin" };
      mockRepository.save.mockResolvedValueOnce(updatedWallet);

      const result = await walletService.setWalletRole("test-wallet-id", "admin");

      expect(result).toEqual(updatedWallet);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: "test-wallet-id" });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockWallet,
        role: "admin"
      });
    });

    test("should throw error when wallet not found", async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(walletService.setWalletRole("nonexistent-wallet", "admin"))
        .rejects
        .toThrow("Wallet not found");

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test("should handle repository errors", async () => {
      mockRepository.findOneBy.mockRejectedValueOnce(new Error("Database error"));

      await expect(walletService.setWalletRole("test-wallet-id", "admin"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("hasRole", () => {
    test("should return true when wallet has role", async () => {
      const adminWallet = { ...mockWallet, role: "admin" };
      mockRepository.findOne.mockResolvedValueOnce(adminWallet);

      const result = await walletService.hasRole("test-wallet-address", "admin");

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { walletAddress: "test-wallet-address" }
      });
    });

    test("should return false when wallet has different role", async () => {
      const result = await walletService.hasRole("test-wallet-address", "admin");

      expect(result).toBe(false);
    });

    test("should return false when wallet not found", async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await walletService.hasRole("nonexistent-wallet", "admin");

      expect(result).toBe(false);
    });

    test("should handle repository errors", async () => {
      mockRepository.findOne.mockRejectedValueOnce(new Error("Database error"));

      await expect(walletService.hasRole("test-wallet-address", "admin"))
        .rejects
        .toThrow("Database error");
    });
  });
}); 