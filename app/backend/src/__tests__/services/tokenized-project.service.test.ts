import { TokenizedProjectService } from '../../services/tokenized-project.service';
import { SolanaService } from '../../services/solana.service';
import { WalletService } from '../../services/wallet.service';
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
jest.mock('../../services/audit-log.service');

describe('TokenizedProjectService', () => {
  let tokenizedProjectService: TokenizedProjectService;
  let tokenizedProjectRepository: any;
  let mockSolanaService: any;
  let mockWalletService: any;
  let mockAuditLogService: any;
  let mockProject: any;
  let mockWallet: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockWallet = {
      id: 'wallet-1',
      walletAddress: 'test-wallet'
    };

    mockProject = {
      id: 'project-1',
      tokenId: 'token-1',
      projectName: 'Test Project',
      location: 'Test Location',
      description: 'Test Description',
      certificationBody: 'Test Certification',
      vintageYear: 2024,
      totalIssued: 1000,
      available: 1000,
      onChainMintTx: 'tx-hash',
      status: 'available',
      createdAt: new Date()
    };

    // Setup repository mocks
    tokenizedProjectRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn()
    };

    // Setup service mocks
    mockSolanaService = {
      mintCredit: jest.fn()
    };

    mockWalletService = {
      getOrCreateWallet: jest.fn()
    };

    mockAuditLogService = {
      createAuditLog: jest.fn()
    };

    // Mock implementations
    tokenizedProjectRepository.create.mockReturnValue(mockProject);
    tokenizedProjectRepository.save.mockResolvedValue(mockProject);
    tokenizedProjectRepository.find.mockResolvedValue([mockProject]);
    tokenizedProjectRepository.findOne.mockResolvedValue(mockProject);

    mockSolanaService.mintCredit.mockResolvedValue('tx-hash');
    mockWalletService.getOrCreateWallet.mockResolvedValue(mockWallet);
    mockAuditLogService.createAuditLog.mockResolvedValue({ id: 'audit-1' });

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(tokenizedProjectRepository);

    // Mock service constructors
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);

    // Initialize service
    tokenizedProjectService = new TokenizedProjectService();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        projectName: 'New Project',
        location: 'New Location',
        description: 'New Description',
        certificationBody: 'New Certification',
        vintageYear: 2024,
        totalIssued: 1000
      };

      const result = await tokenizedProjectService.createProject('test-wallet', projectData);

      expect(result).toEqual(mockProject);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith('test-wallet');
      expect(mockSolanaService.mintCredit).toHaveBeenCalledWith('test-wallet', {
        project: 'New Project',
        vintage: '2024',
        standard: 'New Certification',
        amount: 1000,
        metadata: {
          location: 'New Location',
          description: 'New Description',
          methodology: undefined
        }
      });
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw error if token ID already exists', async () => {
      const projectData = {
        tokenId: 'existing-token',
        projectName: 'New Project'
      };

      tokenizedProjectRepository.findOne.mockResolvedValueOnce(mockProject);

      await expect(tokenizedProjectService.createProject('test-wallet', projectData))
        .rejects
        .toThrow('Project with token ID existing-token already exists');
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects', async () => {
      const result = await tokenizedProjectService.getAllProjects();

      expect(result).toEqual([mockProject]);
      expect(tokenizedProjectRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' }
      });
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      const result = await tokenizedProjectService.getProjectById('project-1');

      expect(result).toEqual(mockProject);
      expect(tokenizedProjectRepository.findOne).toHaveBeenCalledWith({
        where: [{ id: 'project-1' }, { tokenId: 'project-1' }]
      });
    });

    it('should return null if project not found', async () => {
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(null);

      const result = await tokenizedProjectService.getProjectById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateProjectSupply', () => {
    it('should update project supply for retirement', async () => {
      const project = { ...mockProject, available: 1000 };
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(project);
      tokenizedProjectRepository.save.mockImplementationOnce(proj => Promise.resolve(proj));

      const result = await tokenizedProjectService.updateProjectSupply('project-1', 500, true);

      expect(result).toBeDefined();
      if (result) {
        expect(result.available).toBe(500);
        expect(result.status).toBe('available');
      }
    });

    it('should update status to sold_out when no credits available', async () => {
      const project = { ...mockProject, available: 1000 };
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(project);
      tokenizedProjectRepository.save.mockImplementationOnce(proj => Promise.resolve(proj));

      const result = await tokenizedProjectService.updateProjectSupply('project-1', 1000, true);

      expect(result).toBeDefined();
      if (result) {
        expect(result.available).toBe(0);
        expect(result.status).toBe('sold_out');
      }
    });

    it('should throw error if insufficient supply for retirement', async () => {
      const project = { ...mockProject, available: 100 };
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(project);

      await expect(tokenizedProjectService.updateProjectSupply('project-1', 500, true))
        .rejects
        .toThrow('Insufficient supply for retirement');
    });

    it('should add supply when not retirement', async () => {
      const project = { ...mockProject, totalIssued: 1000, available: 1000 };
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(project);
      tokenizedProjectRepository.save.mockImplementationOnce(proj => Promise.resolve(proj));

      const result = await tokenizedProjectService.updateProjectSupply('project-1', 500, false);

      expect(result).toBeDefined();
      if (result) {
        expect(result.totalIssued).toBe(1500);
        expect(result.available).toBe(1500);
      }
    });

    it('should return null if project not found', async () => {
      tokenizedProjectRepository.findOne.mockResolvedValueOnce(null);

      const result = await tokenizedProjectService.updateProjectSupply('non-existent', 500, true);

      expect(result).toBeNull();
    });
  });

  describe('getAvailableProjects', () => {
    it('should return available projects', async () => {
      const result = await tokenizedProjectService.getAvailableProjects();

      expect(result).toEqual([mockProject]);
      expect(tokenizedProjectRepository.find).toHaveBeenCalledWith({
        where: { status: 'available' },
        order: { createdAt: 'DESC' }
      });
    });
  });
}); 