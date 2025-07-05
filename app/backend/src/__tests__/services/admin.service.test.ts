import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { AdminService } from "../../services/admin.service";
import { WalletService } from "../../services/wallet.service";
import { AuditLogService } from "../../services/audit-log.service";
import { TokenizedProjectService } from "../../services/tokenized-project.service";
import { RetirementService } from "../../services/retirement.service";
import { Wallet } from "../../database/entities/Wallet";
import { AuditLog } from "../../database/entities/AuditLog";
import { TokenizedProject } from "../../database/entities/TokenizedProject";
import { Retirement } from "../../database/entities/Retirement";
import { Organization } from "../../database/entities/Organization";

// Create mock implementations
const mockWalletService = {
  hasRole: jest.fn(),
  getOrCreateWallet: jest.fn(),
  findByAddress: jest.fn(),
  setWalletRole: jest.fn()
} as unknown as jest.Mocked<WalletService>;

const mockAuditLogService = {
  createAuditLog: jest.fn(),
  getAllAuditLogs: jest.fn()
} as unknown as jest.Mocked<AuditLogService>;

const mockTokenizedProjectService = {
  getAllProjects: jest.fn()
} as unknown as jest.Mocked<TokenizedProjectService>;

const mockRetirementService = {
  getAllRetirements: jest.fn()
} as unknown as jest.Mocked<RetirementService>;

describe("AdminService", () => {
  let adminService: AdminService;

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

  const mockAdminWallet: Wallet = {
    id: "test-admin-wallet-id",
    walletAddress: "AdminWallet123456789",
    role: "admin",
    provider: "test-provider",
    createdAt: new Date(),
    organization: mockOrganization,
    retirements: [],
    auditLogs: []
  };

  mockOrganization.wallet = mockWallet;

  const mockAuditLog: AuditLog = {
    id: "test-audit-log-id",
    walletId: mockWallet.id,
    action: "TEST_ACTION",
    entityType: "test-entity",
    entityId: "test-entity-id",
    metadata: { test: "data" },
    timestamp: new Date(),
    wallet: mockWallet
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh instance with mocked services
    adminService = new AdminService(
      mockWalletService,
      mockAuditLogService,
      mockTokenizedProjectService,
      mockRetirementService
    );

    // Setup default mock implementations
    mockWalletService.hasRole.mockResolvedValue(false);
    mockWalletService.getOrCreateWallet.mockResolvedValue(mockWallet);
    mockWalletService.findByAddress.mockResolvedValue(mockAdminWallet);
    mockWalletService.setWalletRole.mockImplementation(async (walletId: string, role: string) => ({
      ...mockWallet,
      id: walletId,
      role
    }));

    mockAuditLogService.createAuditLog.mockResolvedValue(mockAuditLog);
    mockAuditLogService.getAllAuditLogs.mockResolvedValue([mockAuditLog]);

    mockTokenizedProjectService.getAllProjects.mockResolvedValue([]);
    mockRetirementService.getAllRetirements.mockResolvedValue([]);
  });

  describe("isAdmin", () => {
    test("should return true for wallet with admin role in database", async () => {
      mockWalletService.hasRole.mockResolvedValueOnce(true);

      const result = await adminService.isAdmin("test-wallet");
      
      expect(result).toBe(true);
      expect(mockWalletService.hasRole).toHaveBeenCalledWith("test-wallet", "admin");
    });

    test("should return true for hardcoded admin wallet", async () => {
      const result = await adminService.isAdmin("AdminWallet123456789");
      
      expect(result).toBe(true);
      expect(mockWalletService.hasRole).toHaveBeenCalledWith("AdminWallet123456789", "admin");
    });

    test("should return false for non-admin wallet", async () => {
      const result = await adminService.isAdmin("non-admin-wallet");
      
      expect(result).toBe(false);
      expect(mockWalletService.hasRole).toHaveBeenCalledWith("non-admin-wallet", "admin");
    });

    test("should handle wallet service errors gracefully", async () => {
      mockWalletService.hasRole.mockRejectedValueOnce(new Error("Database error"));
      
      const result = await adminService.isAdmin("test-wallet");
      
      expect(result).toBe(false);
      expect(mockWalletService.hasRole).toHaveBeenCalledWith("test-wallet", "admin");
    });
  });

  describe("createAuditLog", () => {
    test("should create audit log successfully", async () => {
      const walletAddress = "test-wallet";
      const action = "TEST_ACTION";
      const metadata = { test: "data" };

      await adminService.createAuditLog(walletAddress, action, metadata);

      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith(walletAddress);
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        mockWallet.id,
        action,
        "system",
        mockWallet.id,
        metadata
      );
    });

    test("should handle wallet service errors gracefully", async () => {
      mockWalletService.getOrCreateWallet.mockRejectedValueOnce(new Error("Database error"));

      await expect(adminService.createAuditLog("test-wallet", "TEST_ACTION"))
        .resolves
        .not.toThrow();
      
      expect(mockAuditLogService.createAuditLog).not.toHaveBeenCalled();
    });

    test("should handle audit log service errors gracefully", async () => {
      mockAuditLogService.createAuditLog.mockRejectedValueOnce(new Error("Database error"));

      await expect(adminService.createAuditLog("test-wallet", "TEST_ACTION"))
        .resolves
        .not.toThrow();
    });
  });

  describe("getAuditLogs", () => {
    test("should return all audit logs", async () => {
      const mockLogs = [
        { ...mockAuditLog, id: "log-1", action: "TEST_ACTION" },
        { ...mockAuditLog, id: "log-2", action: "ANOTHER_ACTION" }
      ];
      
      mockAuditLogService.getAllAuditLogs.mockResolvedValueOnce(mockLogs);

      const result = await adminService.getAuditLogs();

      expect(result).toEqual(mockLogs);
      expect(mockAuditLogService.getAllAuditLogs).toHaveBeenCalled();
    });

    test("should handle service errors gracefully", async () => {
      mockAuditLogService.getAllAuditLogs.mockRejectedValueOnce(new Error("Database error"));

      const result = await adminService.getAuditLogs();

      expect(result).toEqual([]);
      expect(mockAuditLogService.getAllAuditLogs).toHaveBeenCalled();
    });
  });

  describe("getAdminProjects", () => {
    test("should return all projects", async () => {
      const mockProjects: TokenizedProject[] = [
        {
          id: "project-1",
          tokenId: "token-1",
          projectName: "Project 1",
          location: "Location 1",
          description: "Test Project 1",
          certificationBody: "Certification Body 1",
          projectRefId: "REF-1",
          methodology: "Methodology 1",
          verifierName: "Verifier 1",
          vintageYear: 2023,
          standard: "Standard 1",
          totalIssued: 1000,
          available: 800,
          pricePerTon: 10,
          ipfsHash: "hash1",
          documentationUrl: "https://docs1.example.com",
          onChainMintTx: "tx1",
          status: "available",
          projectImageUrl: "https://image1.example.com",
          tags: ["tag1", "tag2"],
          createdAt: new Date(),
          retirements: []
        }
      ];

      mockTokenizedProjectService.getAllProjects.mockResolvedValueOnce(mockProjects);

      const result = await adminService.getAdminProjects();

      expect(result).toEqual(mockProjects);
      expect(mockTokenizedProjectService.getAllProjects).toHaveBeenCalled();
    });

    test("should handle service errors gracefully", async () => {
      mockTokenizedProjectService.getAllProjects.mockRejectedValueOnce(new Error("Database error"));

      const result = await adminService.getAdminProjects();

      expect(result).toEqual([]);
      expect(mockTokenizedProjectService.getAllProjects).toHaveBeenCalled();
    });
  });

  describe("getAllRetirements", () => {
    test("should return all retirements", async () => {
      const mockRetirements: Retirement[] = [
        {
          id: "retirement-1",
          walletId: "wallet-1",
          tokenizedProjectId: "project-1",
          quantity: 100,
          retirementDate: new Date(),
          txHash: "tx1",
          proofUrl: "https://proof1.example.com",
          autoOffset: false,
          reportingPeriodStart: new Date(),
          reportingPeriodEnd: new Date(),
          wallet: mockWallet,
          tokenizedProject: {
            id: "project-1",
            tokenId: "token-1",
            projectName: "Project 1",
            location: "Location 1",
            description: "Test Project 1",
            certificationBody: "Certification Body 1",
            projectRefId: "REF-1",
            methodology: "Methodology 1",
            verifierName: "Verifier 1",
            vintageYear: 2023,
            standard: "Standard 1",
            totalIssued: 1000,
            available: 800,
            pricePerTon: 10,
            ipfsHash: "hash1",
            documentationUrl: "https://docs1.example.com",
            onChainMintTx: "tx1",
            status: "available",
            projectImageUrl: "https://image1.example.com",
            tags: ["tag1", "tag2"],
            createdAt: new Date(),
            retirements: []
          }
        }
      ];

      mockRetirementService.getAllRetirements.mockResolvedValueOnce(mockRetirements);

      const result = await adminService.getAllRetirements();

      expect(result).toEqual(mockRetirements);
      expect(mockRetirementService.getAllRetirements).toHaveBeenCalled();
    });

    test("should handle service errors gracefully", async () => {
      mockRetirementService.getAllRetirements.mockRejectedValueOnce(new Error("Database error"));

      const result = await adminService.getAllRetirements();

      expect(result).toEqual([]);
      expect(mockRetirementService.getAllRetirements).toHaveBeenCalled();
    });
  });

  describe("setWalletAsAdmin", () => {
    test("should set wallet as admin when requested by admin", async () => {
      const adminWallet = "AdminWallet123456789";
      const targetWallet = "new-admin-wallet";

      const result = await adminService.setWalletAsAdmin(adminWallet, targetWallet);

      expect(result).toEqual({
        ...mockWallet,
        role: "admin"
      });
      expect(mockWalletService.setWalletRole).toHaveBeenCalledWith(mockWallet.id, "admin");
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        mockAdminWallet.id,
        "SET_ADMIN_ROLE",
        "wallets",
        mockWallet.id,
        { targetWallet }
      );
    });

    test("should throw error when non-admin tries to set admin", async () => {
      const nonAdminWallet = "non-admin-wallet";
      const targetWallet = "new-admin-wallet";

      await expect(adminService.setWalletAsAdmin(nonAdminWallet, targetWallet))
        .rejects
        .toThrow("Only admins can set other wallets as admin");

      expect(mockWalletService.setWalletRole).not.toHaveBeenCalled();
    });

    test("should handle missing admin wallet gracefully", async () => {
      mockWalletService.findByAddress.mockResolvedValueOnce(null);
      
      const adminWallet = "AdminWallet123456789";
      const targetWallet = "new-admin-wallet";

      const result = await adminService.setWalletAsAdmin(adminWallet, targetWallet);

      expect(result).toEqual({
        ...mockWallet,
        role: "admin"
      });
      expect(mockWalletService.setWalletRole).toHaveBeenCalledWith(mockWallet.id, "admin");
      expect(mockAuditLogService.createAuditLog).not.toHaveBeenCalled();
    });

    test("should handle wallet service errors gracefully", async () => {
      mockWalletService.setWalletRole.mockRejectedValueOnce(new Error("Database error"));
      
      const adminWallet = "AdminWallet123456789";
      const targetWallet = "new-admin-wallet";

      await expect(adminService.setWalletAsAdmin(adminWallet, targetWallet))
        .rejects
        .toThrow("Database error");
    });
  });
}); 