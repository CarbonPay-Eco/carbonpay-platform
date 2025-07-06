import { AdminService } from '../../services/admin.service';
import { WalletService } from '../../services/wallet.service';
import { AuditLogService } from '../../services/audit-log.service';
import { TokenizedProjectService } from '../../services/tokenized-project.service';
import { RetirementService } from '../../services/retirement.service';
import { AppDataSource } from '../../database/data-source';
import { User } from '../../entities/User';

// Mock dependencies
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../services/wallet.service');
jest.mock('../../services/audit-log.service');
jest.mock('../../services/tokenized-project.service');
jest.mock('../../services/retirement.service');

describe('AdminService', () => {
  let adminService: AdminService;
  let userRepository: any;
  let mockUser: any;
  let mockWalletService: any;
  let mockAuditLogService: any;
  let mockTokenizedProjectService: any;
  let mockRetirementService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockUser = {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Setup repository mocks
    userRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    // Setup service mocks
    mockWalletService = {
      getOrCreateWallet: jest.fn(),
      findByAddress: jest.fn(),
      setWalletRole: jest.fn()
    };

    mockAuditLogService = {
      createAuditLog: jest.fn(),
      getAllAuditLogs: jest.fn()
    };

    mockTokenizedProjectService = {
      getAllProjects: jest.fn()
    };

    mockRetirementService = {
      getAllRetirements: jest.fn()
    };

    // Mock implementations
    userRepository.findOneBy.mockResolvedValue(mockUser);
    mockWalletService.getOrCreateWallet.mockResolvedValue({ id: 'wallet-1', walletAddress: 'admin-wallet' });
    mockWalletService.findByAddress.mockResolvedValue({ id: 'wallet-1', walletAddress: 'admin-wallet' });
    mockWalletService.setWalletRole.mockResolvedValue({ id: 'wallet-1', role: 'admin' });
    mockAuditLogService.getAllAuditLogs.mockResolvedValue([]);
    mockTokenizedProjectService.getAllProjects.mockResolvedValue([]);
    mockRetirementService.getAllRetirements.mockResolvedValue([]);

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepository);

    // Mock service constructors
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);
    (TokenizedProjectService as jest.Mock).mockImplementation(() => mockTokenizedProjectService);
    (RetirementService as jest.Mock).mockImplementation(() => mockRetirementService);

    // Initialize service
    adminService = new AdminService();
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const result = await adminService.isAdmin('user-1');
      expect(result).toBe(true);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should return false for non-admin user', async () => {
      userRepository.findOneBy.mockResolvedValueOnce({ ...mockUser, role: 'user' });
      const result = await adminService.isAdmin('user-2');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      userRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await adminService.isAdmin('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log successfully', async () => {
      const walletAddress = 'admin-wallet';
      const action = 'TEST_ACTION';
      const metadata = { test: 'data' };

      await adminService.createAuditLog(walletAddress, action, metadata);

      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith(walletAddress);
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        'wallet-1',
        action,
        'system',
        'wallet-1',
        metadata
      );
    });

    it('should handle errors gracefully', async () => {
      mockWalletService.getOrCreateWallet.mockRejectedValueOnce(new Error('Test error'));
      
      await adminService.createAuditLog('admin-wallet', 'TEST_ACTION');
      
      expect(mockAuditLogService.createAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('should return all audit logs', async () => {
      const mockLogs = [{ id: 'log-1' }, { id: 'log-2' }];
      mockAuditLogService.getAllAuditLogs.mockResolvedValueOnce(mockLogs);

      const result = await adminService.getAuditLogs();

      expect(result).toEqual(mockLogs);
      expect(mockAuditLogService.getAllAuditLogs).toHaveBeenCalled();
    });
  });

  describe('getAdminProjects', () => {
    it('should return all projects', async () => {
      const mockProjects = [{ id: 'project-1' }, { id: 'project-2' }];
      mockTokenizedProjectService.getAllProjects.mockResolvedValueOnce(mockProjects);

      const result = await adminService.getAdminProjects();

      expect(result).toEqual(mockProjects);
      expect(mockTokenizedProjectService.getAllProjects).toHaveBeenCalled();
    });
  });

  describe('getAllRetirements', () => {
    it('should return all retirements', async () => {
      const mockRetirements = [{ id: 'retirement-1' }, { id: 'retirement-2' }];
      mockRetirementService.getAllRetirements.mockResolvedValueOnce(mockRetirements);

      const result = await adminService.getAllRetirements();

      expect(result).toEqual(mockRetirements);
      expect(mockRetirementService.getAllRetirements).toHaveBeenCalled();
    });
  });

  describe('setWalletAsAdmin', () => {
    it('should set wallet as admin when requested by admin', async () => {
      const adminWalletAddress = 'admin-wallet';
      const targetWalletAddress = 'target-wallet';

      userRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockWalletService.findByAddress.mockResolvedValueOnce({ id: 'admin-wallet-1' });
      mockWalletService.getOrCreateWallet.mockResolvedValueOnce({ id: 'target-wallet-1' });
      mockWalletService.setWalletRole.mockResolvedValueOnce({ id: 'target-wallet-1', role: 'admin' });

      const result = await adminService.setWalletAsAdmin(adminWalletAddress, targetWalletAddress);

      expect(result).toEqual({ id: 'target-wallet-1', role: 'admin' });
      expect(mockWalletService.setWalletRole).toHaveBeenCalledWith('target-wallet-1', 'admin');
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw error when non-admin tries to set admin', async () => {
      userRepository.findOneBy.mockResolvedValueOnce({ ...mockUser, role: 'user' });

      await expect(adminService.setWalletAsAdmin('user-wallet', 'target-wallet'))
        .rejects
        .toThrow('Only admins can set other wallets as admin');
    });
  });
}); 