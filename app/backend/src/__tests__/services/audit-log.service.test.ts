import { AuditLogService } from '../../services/audit-log.service';
import { AppDataSource } from '../../database/data-source';
import { AuditLog } from '../../database/entities/AuditLog';

// Mock dependencies
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('AuditLogService', () => {
  let auditLogService: AuditLogService;
  let auditLogRepository: any;
  let mockAuditLog: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockAuditLog = {
      id: 'audit-1',
      walletId: 'wallet-1',
      action: 'TEST_ACTION',
      entityType: 'test_entity',
      entityId: 'entity-1',
      metadata: { test: 'data' },
      timestamp: new Date(),
      wallet: {
        id: 'wallet-1',
        walletAddress: 'test-wallet'
      }
    };

    // Setup repository mocks
    auditLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn()
    };

    // Mock implementations
    auditLogRepository.create.mockReturnValue(mockAuditLog);
    auditLogRepository.save.mockResolvedValue(mockAuditLog);
    auditLogRepository.find.mockResolvedValue([mockAuditLog]);
    auditLogRepository.findOne.mockResolvedValue(mockAuditLog);

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(auditLogRepository);

    // Initialize service
    auditLogService = new AuditLogService();
  });

  describe('createAuditLog', () => {
    it('should create audit log successfully', async () => {
      const result = await auditLogService.createAuditLog(
        'wallet-1',
        'TEST_ACTION',
        'test_entity',
        'entity-1',
        { test: 'data' }
      );

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        walletId: 'wallet-1',
        action: 'TEST_ACTION',
        entityType: 'test_entity',
        entityId: 'entity-1',
        metadata: { test: 'data' },
        timestamp: expect.any(Date)
      });
      expect(auditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('should create audit log without metadata', async () => {
      await auditLogService.createAuditLog(
        'wallet-1',
        'TEST_ACTION',
        'test_entity',
        'entity-1'
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        walletId: 'wallet-1',
        action: 'TEST_ACTION',
        entityType: 'test_entity',
        entityId: 'entity-1',
        metadata: undefined,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with default pagination', async () => {
      const result = await auditLogService.getAuditLogs();

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 100,
        skip: 0,
        relations: ['wallet']
      });
    });

    it('should return audit logs with custom pagination', async () => {
      await auditLogService.getAuditLogs(50, 10);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 50,
        skip: 10,
        relations: ['wallet']
      });
    });
  });

  describe('getAllAuditLogs', () => {
    it('should return all audit logs', async () => {
      const result = await auditLogService.getAllAuditLogs();

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });
  });

  describe('getAuditLogsByWallet', () => {
    it('should return audit logs for specific wallet', async () => {
      const result = await auditLogService.getAuditLogsByWallet('wallet-1');

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { walletId: 'wallet-1' },
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });
  });

  describe('getAuditLogsByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      const result = await auditLogService.getAuditLogsByEntity('test_entity', 'entity-1');

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { entityType: 'test_entity', entityId: 'entity-1' },
        relations: ['wallet'],
        order: { timestamp: 'DESC' }
      });
    });
  });
}); 