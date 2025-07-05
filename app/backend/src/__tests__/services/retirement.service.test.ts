import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { RetirementService } from "../../services/retirement.service";
import { Repository } from "typeorm";
import { Retirement } from "../../database/entities/Retirement";
import { AppDataSource } from "../../database/data-source";
import { SolanaService } from "../../services/solana.service";
import { WalletService } from "../../services/wallet.service";
import { TokenizedProjectService } from "../../services/tokenized-project.service";
import { AuditLogService } from "../../services/audit-log.service";
import { Wallet } from "../../database/entities/Wallet";
import { Organization } from "../../database/entities/Organization";
import { TokenizedProject } from "../../database/entities/TokenizedProject";

// Mock the TypeORM repository
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn()
} as unknown as jest.Mocked<Repository<Retirement>>;

// Mock the AppDataSource
jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));

// Mock the dependent services
jest.mock("../../services/solana.service");
jest.mock("../../services/wallet.service");
jest.mock("../../services/tokenized-project.service");
jest.mock("../../services/audit-log.service");

describe("RetirementService", () => {
  let retirementService: RetirementService;
  let mockSolanaService: jest.Mocked<SolanaService>;
  let mockWalletService: jest.Mocked<WalletService>;
  let mockTokenizedProjectService: jest.Mocked<TokenizedProjectService>;
  let mockAuditLogService: jest.Mocked<AuditLogService>;

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
    wallet: undefined as any
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

  const mockProject: TokenizedProject = {
    id: "test-project-id",
    tokenId: "CP-123456789",
    projectName: "Test Project",
    location: "Test Location",
    description: "Test Description",
    certificationBody: "Test Certification",
    projectRefId: "REF-123",
    methodology: "Test Methodology",
    verifierName: "Test Verifier",
    vintageYear: 2023,
    standard: "Test Standard",
    totalIssued: 1000,
    available: 1000,
    pricePerTon: 10,
    ipfsHash: "test-ipfs-hash",
    documentationUrl: "https://test.com/docs",
    onChainMintTx: "test-mint-tx",
    status: "available",
    projectImageUrl: "https://test.com/image.jpg",
    tags: ["tag1", "tag2"],
    createdAt: new Date(),
    retirements: []
  };

  const mockRetirement: Retirement = {
    id: "test-retirement-id",
    walletId: mockWallet.id,
    tokenizedProjectId: mockProject.id,
    quantity: 100,
    retirementDate: new Date(),
    txHash: "test-tx-hash",
    proofUrl: "https://test.com/proof",
    autoOffset: false,
    reportingPeriodStart: new Date(),
    reportingPeriodEnd: new Date(),
    wallet: mockWallet,
    tokenizedProject: mockProject
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock implementations for dependent services
    mockSolanaService = {
      burnCredit: jest.fn().mockResolvedValue("test-tx-hash")
    } as unknown as jest.Mocked<SolanaService>;

    mockWalletService = {
      getOrCreateWallet: jest.fn().mockResolvedValue(mockWallet),
      findByAddress: jest.fn().mockResolvedValue(mockWallet)
    } as unknown as jest.Mocked<WalletService>;

    mockTokenizedProjectService = {
      getProjectById: jest.fn().mockResolvedValue(mockProject),
      updateProjectSupply: jest.fn().mockResolvedValue(mockProject)
    } as unknown as jest.Mocked<TokenizedProjectService>;

    mockAuditLogService = {
      createAuditLog: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<AuditLogService>;

    // Mock the constructor implementations
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (TokenizedProjectService as jest.Mock).mockImplementation(() => mockTokenizedProjectService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);

    // Create fresh instance
    retirementService = new RetirementService();

    // Setup default mock implementations
    mockRepository.create.mockReturnValue(mockRetirement);
    mockRepository.save.mockResolvedValue(mockRetirement);
    mockRepository.find.mockResolvedValue([mockRetirement]);
  });

  describe("retireCredits", () => {
    test("should retire credits successfully", async () => {
      const result = await retirementService.retireCredits(
        "test-wallet-address",
        "test-project-id",
        100,
        {
          proofUrl: "https://test.com/proof",
          autoOffset: false,
          reportingPeriodStart: new Date(),
          reportingPeriodEnd: new Date(),
          beneficiary: "Test Beneficiary",
          retirementMessage: "Test Message"
        }
      );

      expect(result).toEqual(mockRetirement);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith("test-wallet-address");
      expect(mockTokenizedProjectService.getProjectById).toHaveBeenCalledWith("test-project-id");
      expect(mockSolanaService.burnCredit).toHaveBeenCalledWith("test-wallet-address", {
        tokenId: mockProject.tokenId,
        amount: 100,
        beneficiary: "Test Beneficiary",
        retirementMessage: "Test Message"
      });
      expect(mockTokenizedProjectService.updateProjectSupply).toHaveBeenCalledWith(
        "test-project-id",
        100,
        true
      );
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        mockWallet.id,
        "CREDIT_RETIRE",
        "retirements",
        mockRetirement.id,
        {
          projectId: mockProject.id,
          quantity: 100,
          txHash: "test-tx-hash",
          beneficiary: "Test Beneficiary"
        }
      );
    });

    test("should throw error when project not found", async () => {
      mockTokenizedProjectService.getProjectById.mockResolvedValueOnce(null);

      await expect(retirementService.retireCredits("test-wallet-address", "nonexistent-id", 100))
        .rejects
        .toThrow("Project not found");

      expect(mockSolanaService.burnCredit).not.toHaveBeenCalled();
      expect(mockTokenizedProjectService.updateProjectSupply).not.toHaveBeenCalled();
    });

    test("should throw error when insufficient supply", async () => {
      const lowSupplyProject = { ...mockProject, available: 50 };
      mockTokenizedProjectService.getProjectById.mockResolvedValueOnce(lowSupplyProject);

      await expect(retirementService.retireCredits("test-wallet-address", "test-project-id", 100))
        .rejects
        .toThrow("Insufficient supply for retirement");

      expect(mockSolanaService.burnCredit).not.toHaveBeenCalled();
      expect(mockTokenizedProjectService.updateProjectSupply).not.toHaveBeenCalled();
    });

    test("should handle Solana service errors", async () => {
      mockSolanaService.burnCredit.mockRejectedValueOnce(new Error("Solana error"));

      await expect(retirementService.retireCredits("test-wallet-address", "test-project-id", 100))
        .rejects
        .toThrow("Solana error");

      expect(mockTokenizedProjectService.updateProjectSupply).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getRetirementsByWallet", () => {
    test("should get retirements by wallet", async () => {
      const result = await retirementService.getRetirementsByWallet("test-wallet-address");

      expect(result).toEqual([mockRetirement]);
      expect(mockWalletService.findByAddress).toHaveBeenCalledWith("test-wallet-address");
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        relations: ["wallet", "tokenizedProject"],
        order: { retirementDate: "DESC" }
      });
    });

    test("should return empty array when wallet not found", async () => {
      mockWalletService.findByAddress.mockResolvedValueOnce(null);

      const result = await retirementService.getRetirementsByWallet("nonexistent-wallet");

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(retirementService.getRetirementsByWallet("test-wallet-address"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getRetirementsByOrganizationWallet", () => {
    test("should get retirements by organization wallet", async () => {
      const result = await retirementService.getRetirementsByOrganizationWallet("test-wallet-address");

      expect(result).toEqual([mockRetirement]);
      expect(mockWalletService.findByAddress).toHaveBeenCalledWith("test-wallet-address");
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        relations: ["wallet", "tokenizedProject"],
        order: { retirementDate: "DESC" }
      });
    });

    test("should return empty array when wallet not found", async () => {
      mockWalletService.findByAddress.mockResolvedValueOnce(null);

      const result = await retirementService.getRetirementsByOrganizationWallet("nonexistent-wallet");

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(retirementService.getRetirementsByOrganizationWallet("test-wallet-address"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getAllRetirements", () => {
    test("should get all retirements", async () => {
      const result = await retirementService.getAllRetirements();

      expect(result).toEqual([mockRetirement]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["wallet", "tokenizedProject"],
        order: { retirementDate: "DESC" }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(retirementService.getAllRetirements())
        .rejects
        .toThrow("Database error");
    });
  });
}); 