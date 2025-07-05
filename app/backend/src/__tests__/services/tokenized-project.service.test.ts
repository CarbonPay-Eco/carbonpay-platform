import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { TokenizedProjectService } from "../../services/tokenized-project.service";
import { Repository } from "typeorm";
import { TokenizedProject } from "../../database/entities/TokenizedProject";
import { AppDataSource } from "../../database/data-source";
import { SolanaService } from "../../services/solana.service";
import { WalletService } from "../../services/wallet.service";
import { AuditLogService } from "../../services/audit-log.service";
import { Wallet } from "../../database/entities/Wallet";
import { Organization } from "../../database/entities/Organization";

// Mock the TypeORM repository
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn()
} as unknown as jest.Mocked<Repository<TokenizedProject>>;

// Mock the AppDataSource
jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));

// Mock the dependent services
jest.mock("../../services/solana.service");
jest.mock("../../services/wallet.service");
jest.mock("../../services/audit-log.service");

describe("TokenizedProjectService", () => {
  let tokenizedProjectService: TokenizedProjectService;
  let mockSolanaService: jest.Mocked<SolanaService>;
  let mockWalletService: jest.Mocked<WalletService>;
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

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock implementations for dependent services
    mockSolanaService = {
      mintCredit: jest.fn().mockResolvedValue("test-mint-tx")
    } as unknown as jest.Mocked<SolanaService>;

    mockWalletService = {
      getOrCreateWallet: jest.fn().mockResolvedValue(mockWallet)
    } as unknown as jest.Mocked<WalletService>;

    mockAuditLogService = {
      createAuditLog: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<AuditLogService>;

    // Mock the constructor implementations
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);

    // Create fresh instance
    tokenizedProjectService = new TokenizedProjectService();

    // Setup default mock implementations
    mockRepository.create.mockReturnValue(mockProject);
    mockRepository.save.mockResolvedValue(mockProject);
    mockRepository.find.mockResolvedValue([mockProject]);
    mockRepository.findOne.mockResolvedValue(mockProject);
  });

  describe("createProject", () => {
    const projectData: Partial<TokenizedProject> = {
      projectName: "Test Project",
      vintageYear: 2023,
      certificationBody: "Test Certification",
      totalIssued: 1000,
      location: "Test Location",
      description: "Test Description",
      methodology: "Test Methodology"
    };

    test("should create project successfully", async () => {
      const result = await tokenizedProjectService.createProject("test-wallet-address", projectData);

      expect(result).toEqual(mockProject);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith("test-wallet-address");
      expect(mockSolanaService.mintCredit).toHaveBeenCalledWith("test-wallet-address", {
        project: "Test Project",
        vintage: "2023",
        standard: "Test Certification",
        amount: 1000,
        metadata: {
          location: "Test Location",
          description: "Test Description",
          methodology: "Test Methodology"
        }
      });
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...projectData,
        available: 1000,
        onChainMintTx: "test-mint-tx",
        status: "available"
      }));
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        mockWallet.id,
        "PROJECT_CREATE",
        "tokenized_projects",
        mockProject.id,
        { project: mockProject }
      );
    });

    test("should throw error if token ID already exists", async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockProject);

      await expect(tokenizedProjectService.createProject("test-wallet-address", {
        ...projectData,
        tokenId: "CP-123456789"
      })).rejects.toThrow("Project with token ID CP-123456789 already exists");

      expect(mockSolanaService.mintCredit).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    test("should handle Solana service errors", async () => {
      mockSolanaService.mintCredit.mockRejectedValueOnce(new Error("Solana error"));

      await expect(tokenizedProjectService.createProject("test-wallet-address", projectData))
        .rejects
        .toThrow("Solana error");

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getAllProjects", () => {
    test("should return all projects", async () => {
      const result = await tokenizedProjectService.getAllProjects();

      expect(result).toEqual([mockProject]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: "DESC" }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(tokenizedProjectService.getAllProjects())
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getProjectById", () => {
    test("should find project by ID", async () => {
      const result = await tokenizedProjectService.getProjectById("test-project-id");

      expect(result).toEqual(mockProject);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [{ id: "test-project-id" }, { tokenId: "test-project-id" }]
      });
    });

    test("should return null when project not found", async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await tokenizedProjectService.getProjectById("nonexistent-id");

      expect(result).toBeNull();
    });

    test("should handle repository errors", async () => {
      mockRepository.findOne.mockRejectedValueOnce(new Error("Database error"));

      await expect(tokenizedProjectService.getProjectById("test-project-id"))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("updateProjectSupply", () => {
    test("should update supply for retirement", async () => {
      const updatedProject = {
        ...mockProject,
        available: 900
      };
      mockRepository.save.mockResolvedValueOnce(updatedProject);

      const result = await tokenizedProjectService.updateProjectSupply("test-project-id", 100, true);

      expect(result).toEqual(updatedProject);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        available: 900
      }));
    });

    test("should update status when no supply left", async () => {
      const updatedProject = {
        ...mockProject,
        available: 0,
        status: "sold_out"
      };
      mockRepository.save.mockResolvedValueOnce(updatedProject);

      const result = await tokenizedProjectService.updateProjectSupply("test-project-id", 1000, true);

      expect(result).toEqual(updatedProject);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        available: 0,
        status: "sold_out"
      }));
    });

    test("should throw error for insufficient supply", async () => {
      await expect(tokenizedProjectService.updateProjectSupply("test-project-id", 1100, true))
        .rejects
        .toThrow("Insufficient supply for retirement");

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test("should update supply for addition", async () => {
      const updatedProject = {
        ...mockProject,
        totalIssued: 1100,
        available: 1100
      };
      mockRepository.save.mockResolvedValueOnce(updatedProject);

      const result = await tokenizedProjectService.updateProjectSupply("test-project-id", 100, false);

      expect(result).toEqual(updatedProject);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        totalIssued: 1100,
        available: 1100
      }));
    });

    test("should return null when project not found", async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await tokenizedProjectService.updateProjectSupply("nonexistent-id", 100, true);

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getAvailableProjects", () => {
    test("should return available projects", async () => {
      const result = await tokenizedProjectService.getAvailableProjects();

      expect(result).toEqual([mockProject]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: "available" },
        order: { createdAt: "DESC" }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(tokenizedProjectService.getAvailableProjects())
        .rejects
        .toThrow("Database error");
    });
  });
}); 