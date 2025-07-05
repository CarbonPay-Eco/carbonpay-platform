import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { AuditLogService } from "../../services/audit-log.service";
import { Repository } from "typeorm";
import { AuditLog } from "../../database/entities/AuditLog";
import { AppDataSource } from "../../database/data-source";
import { Wallet } from "../../database/entities/Wallet";
import { Organization } from "../../database/entities/Organization";

// Mock the TypeORM repository
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn()
} as unknown as jest.Mocked<Repository<AuditLog>>;

// Mock the AppDataSource
jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));

describe("AuditLogService", () => {
  let auditLogService: AuditLogService;

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

    // Create fresh instance
    auditLogService = new AuditLogService();

    // Setup default mock implementations
    mockRepository.create.mockReturnValue(mockAuditLog);
    mockRepository.save.mockResolvedValue(mockAuditLog);
    mockRepository.find.mockResolvedValue([mockAuditLog]);
  });

  describe("createAuditLog", () => {
    test("should create audit log successfully", async () => {
      const result = await auditLogService.createAuditLog(
        mockWallet.id,
        "TEST_ACTION",
        "test-entity",
        "test-entity-id",
        { test: "data" }
      );

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.create).toHaveBeenCalledWith({
        walletId: mockWallet.id,
        action: "TEST_ACTION",
        entityType: "test-entity",
        entityId: "test-entity-id",
        metadata: { test: "data" },
        timestamp: expect.any(Date)
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    test("should create audit log without metadata", async () => {
      await auditLogService.createAuditLog(
        mockWallet.id,
        "TEST_ACTION",
        "test-entity",
        "test-entity-id"
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        walletId: mockWallet.id,
        action: "TEST_ACTION",
        entityType: "test-entity",
        entityId: "test-entity-id",
        metadata: undefined,
        timestamp: expect.any(Date)
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.save.mockRejectedValueOnce(new Error("Database error"));

      await expect(auditLogService.createAuditLog(
        mockWallet.id,
        "TEST_ACTION",
        "test-entity",
        "test-entity-id"
      )).rejects.toThrow("Database error");
    });
  });

  describe("getAuditLogs", () => {
    test("should get audit logs with default pagination", async () => {
      const result = await auditLogService.getAuditLogs();

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
        skip: 0,
        relations: ['wallet']
      });
    });

    test("should get audit logs with custom pagination", async () => {
      await auditLogService.getAuditLogs(50, 10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 50,
        skip: 10,
        relations: ['wallet']
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(auditLogService.getAuditLogs())
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getAllAuditLogs", () => {
    test("should get all audit logs", async () => {
      const result = await auditLogService.getAllAuditLogs();

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(auditLogService.getAllAuditLogs())
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getAuditLogsByWallet", () => {
    test("should get audit logs by wallet", async () => {
      const result = await auditLogService.getAuditLogsByWallet(mockWallet.id);

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(auditLogService.getAuditLogsByWallet(mockWallet.id))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getAuditLogsByEntity", () => {
    test("should get audit logs by entity", async () => {
      const result = await auditLogService.getAuditLogsByEntity("test-entity", "test-entity-id");

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { entityType: "test-entity", entityId: "test-entity-id" },
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });

    test("should handle repository errors", async () => {
      mockRepository.find.mockRejectedValueOnce(new Error("Database error"));

      await expect(auditLogService.getAuditLogsByEntity("test-entity", "test-entity-id"))
        .rejects
        .toThrow("Database error");
    });
  });
}); 