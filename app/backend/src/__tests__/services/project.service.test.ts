import { ProjectService } from '../../services/project.service';
import { SolanaService } from '../../services/solana.service';
import { AppDataSource } from '../../database/data-source';
import { Project } from '../../types';

// Mock dependencies
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../services/solana.service');

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: any;
  let mockSolanaService: any;
  let mockProject: Project;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockProject = {
      id: 'project-1',
      tokenId: 'token-1',
      projectName: 'Test Project',
      location: 'Test Location',
      description: 'Test Description',
      certificationBody: 'Test Certification',
      projectRefId: 'REF-1',
      methodology: 'Test Methodology',
      verifierName: 'Test Verifier',
      vintageYear: 2024,
      standard: 'Test Standard',
      totalIssued: 1000,
      available: 1000,
      pricePerTon: 10,
      ipfsHash: 'ipfs-hash',
      documentationUrl: 'https://docs.test',
      onChainMintTx: 'tx-hash',
      status: 'available',
      projectImageUrl: 'https://image.test',
      tags: ['tag1', 'tag2'],
      createdAt: new Date('2025-07-06T02:14:35.962Z')
    };

    // Setup repository mocks
    projectRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    // Setup service mocks
    mockSolanaService = {
      mintCredit: jest.fn()
    };

    // Mock implementations
    projectRepository.findOne.mockResolvedValue(mockProject);
    projectRepository.create.mockReturnValue(mockProject);
    projectRepository.save.mockResolvedValue(mockProject);
    mockSolanaService.mintCredit.mockResolvedValue('tx-hash');

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(projectRepository);

    // Mock service constructors
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);

    // Initialize service
    projectService = new ProjectService();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        projectName: 'New Project',
        location: 'Test Location',
        description: 'Test Description',
        certificationBody: 'Test Certification',
        projectRefId: 'REF-1',
        methodology: 'Test Methodology',
        verifierName: 'Test Verifier',
        vintageYear: 2024,
        standard: 'New Certification',
        totalIssued: 1000,
        pricePerTon: 10,
        documentationUrl: 'https://docs.test',
        projectImageUrl: 'https://image.test',
        tags: ['tag1', 'tag2']
      };

      const result = await projectService.createProject(projectData, 'wallet-1');

      expect(result).toEqual(mockProject);
      expect(mockSolanaService.mintCredit).toHaveBeenCalledWith('wallet-1', {
        project: 'New Project',
        vintage: '2024',
        standard: 'New Certification',
        amount: 1000,
        metadata: {
          tags: ['tag1', 'tag2']
        }
      });
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      projectRepository.findOne.mockResolvedValueOnce(mockProject);

      const result = await projectService.getProjectById('project-1');

      expect(result).toEqual(mockProject);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: [{ id: 'project-1' }, { tokenId: 'project-1' }]
      });
    });
  });
}); 