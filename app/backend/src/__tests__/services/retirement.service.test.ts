import { RetirementService } from '../../services/retirement.service';
import { SolanaService } from '../../services/solana.service';
import { WalletService } from '../../services/wallet.service';
import { TokenizedProjectService } from '../../services/tokenized-project.service';
import { AuditLogService } from '../../services/audit-log.service';
import { AppDataSource } from '../../database/data-source';

// Mock dependencies
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../services/solana.service');
jest.mock('../../services/wallet.service');
jest.mock('../../services/tokenized-project.service');
jest.mock('../../services/audit-log.service');

describe('RetirementService', () => {
  let retirementService: RetirementService;
  let retirementRepository: any;
  let mockSolanaService: any;
  let mockWalletService: any;
  let mockTokenizedProjectService: any;
  let mockAuditLogService: any;
  let mockRetirement: any;
  let mockWallet: any;
  let mockProject: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockWallet = {
      id: 'wallet-1',
      walletAddress: 'test-wallet',
      userId: 'user-1'
    };

    mockProject = {
      id: 'project-1',
      tokenId: 'token-1',
      available: 1000,
      totalIssued: 1000
    };

    mockRetirement = {
      id: 'retirement-1',
      walletId: mockWallet.id,
      tokenizedProjectId: mockProject.id,
      quantity: 100,
      txHash: 'tx-hash',
      proofUrl: 'https://proof.test',
      autoOffset: false,
      reportingPeriodStart: new Date(),
      reportingPeriodEnd: new Date(),
      retirementDate: new Date(),
      tokenizedProject: mockProject,
      wallet: mockWallet
    };

    // Setup repository mocks
    retirementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn()
    };

    // Setup service mocks
    mockSolanaService = {
      burnCredit: jest.fn()
    };

    mockWalletService = {
      findByAddress: jest.fn(),
      getOrCreateWallet: jest.fn(),
      getWalletByAddress: jest.fn()
    };

    mockTokenizedProjectService = {
      getProjectById: jest.fn(),
      updateProjectSupply: jest.fn()
    };

    mockAuditLogService = {
      createAuditLog: jest.fn()
    };

    // Mock implementations
    retirementRepository.create.mockReturnValue(mockRetirement);
    retirementRepository.save.mockResolvedValue(mockRetirement);
    retirementRepository.find.mockResolvedValue([mockRetirement]);
    retirementRepository.findOne.mockResolvedValue(mockRetirement);

    mockSolanaService.burnCredit.mockResolvedValue('tx-hash');
    mockWalletService.findByAddress.mockResolvedValue(mockWallet);
    mockWalletService.getOrCreateWallet.mockResolvedValue(mockWallet);
    mockWalletService.getWalletByAddress.mockResolvedValue(mockWallet);
    mockTokenizedProjectService.getProjectById.mockResolvedValue(mockProject);
    mockTokenizedProjectService.updateProjectSupply.mockResolvedValue(mockProject);
    mockAuditLogService.createAuditLog.mockResolvedValue({ id: 'audit-1' });

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(retirementRepository);

    // Mock service constructors
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (TokenizedProjectService as jest.Mock).mockImplementation(() => mockTokenizedProjectService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);

    // Initialize service
    retirementService = new RetirementService();
  });

  describe('retireCredits', () => {
    it('should retire credits successfully', async () => {
      const options = {
        proofUrl: 'https://proof.test',
        autoOffset: false,
        reportingPeriodStart: new Date(),
        reportingPeriodEnd: new Date(),
        beneficiary: 'Test Beneficiary',
        retirementMessage: 'Test Message'
      };

      const result = await retirementService.retireCredits(
        'test-wallet',
        'project-1',
        100,
        options
      );

      expect(result).toEqual(mockRetirement);
      expect(mockWalletService.findByAddress).toHaveBeenCalledWith('test-wallet');
      expect(mockTokenizedProjectService.getProjectById).toHaveBeenCalledWith('project-1');
      expect(mockSolanaService.burnCredit).toHaveBeenCalledWith('test-wallet', {
        tokenId: 'token-1',
        amount: 100,
        beneficiary: 'Test Beneficiary',
        retirementMessage: 'Test Message'
      });
      expect(mockTokenizedProjectService.updateProjectSupply).toHaveBeenCalledWith('project-1', 100, false);
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw error if wallet not found', async () => {
      mockWalletService.findByAddress.mockResolvedValueOnce(null);

      await expect(retirementService.retireCredits('invalid-wallet', 'project-1', 100))
        .rejects
        .toThrow('Wallet not found');
    });

    it('should throw error if project not found', async () => {
      mockTokenizedProjectService.getProjectById.mockResolvedValueOnce(null);

      await expect(retirementService.retireCredits('test-wallet', 'invalid-project', 100))
        .rejects
        .toThrow('Project not found');
    });

    it('should throw error if insufficient credits available', async () => {
      mockTokenizedProjectService.getProjectById.mockResolvedValueOnce({
        ...mockProject,
        available: 50
      });

      await expect(retirementService.retireCredits('test-wallet', 'project-1', 100))
        .rejects
        .toThrow('Insufficient available credits');
    });
  });

  describe('getRetirementsByWallet', () => {
    it('should return retirements for wallet', async () => {
      const result = await retirementService.getRetirementsByWallet('test-wallet');

      expect(result).toEqual([mockRetirement]);
      expect(mockWalletService.findByAddress).toHaveBeenCalledWith('test-wallet');
      expect(retirementRepository.find).toHaveBeenCalledWith({
        where: { walletId: 'wallet-1' },
        relations: ['wallet', 'tokenizedProject'],
        order: { retirementDate: 'DESC' }
      });
    });

    it('should return empty array if wallet not found', async () => {
      mockWalletService.findByAddress.mockResolvedValueOnce(null);

      const result = await retirementService.getRetirementsByWallet('invalid-wallet');

      expect(result).toEqual([]);
    });
  });

  describe('getUserRetirements', () => {
    it('should return retirements for user', async () => {
      const result = await retirementService.getUserRetirements('user-1');

      expect(result).toEqual([mockRetirement]);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith('user-1');
      expect(retirementRepository.find).toHaveBeenCalledWith({
        where: { walletId: 'wallet-1' },
        relations: ['tokenizedProject'],
        order: { retirementDate: 'DESC' }
      });
    });
  });

  describe('getRetirementById', () => {
    it('should return retirement by ID for user', async () => {
      const result = await retirementService.getRetirementById('retirement-1', 'user-1');

      expect(result).toEqual(mockRetirement);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith('user-1');
      expect(retirementRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'retirement-1',
          walletId: 'wallet-1'
        },
        relations: ['tokenizedProject']
      });
    });
  });

  describe('getPublicRetirements', () => {
    it('should return public retirements for wallet', async () => {
      const result = await retirementService.getPublicRetirements('test-wallet');

      expect(result).toEqual([mockRetirement]);
      expect(mockWalletService.getWalletByAddress).toHaveBeenCalledWith('test-wallet');
      expect(retirementRepository.find).toHaveBeenCalledWith({
        where: { walletId: 'wallet-1' },
        relations: ['tokenizedProject'],
        order: { retirementDate: 'DESC' }
      });
    });

    it('should return empty array if wallet not found', async () => {
      mockWalletService.getWalletByAddress.mockResolvedValueOnce(null);

      const result = await retirementService.getPublicRetirements('invalid-wallet');

      expect(result).toEqual([]);
    });
  });
}); 