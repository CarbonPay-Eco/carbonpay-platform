import { UserService } from '../../services/user.service';
import { WalletService } from '../../services/wallet.service';
import { AuditLogService } from '../../services/audit-log.service';
import { SolanaService } from '../../services/solana.service';
import { AppDataSource } from '../../database/data-source';
import { User } from '../../entities/User';
import { UserWallet } from '../../entities/UserWallet';
import { Organization } from '../../database/entities/Organization';

// Mock dependencies
jest.mock('../../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../services/wallet.service');
jest.mock('../../services/audit-log.service');
jest.mock('../../services/solana.service');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: any;
  let userWalletRepository: any;
  let organizationRepository: any;
  let mockWalletService: any;
  let mockAuditLogService: any;
  let mockSolanaService: any;
  let mockOrg: any;
  let mockUserWallet: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockUserWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      walletAddress: 'test-wallet'
    };

    mockOrg = {
      id: 'org-1',
      userId: 'user-1',
      walletId: mockUserWallet.id,
      companyName: 'Test Company',
      description: 'Test company',
      companySize: '10-50',
      industryType: 'Technology',
      country: 'US',
      registrationNumber: 'REG123',
      websiteUrl: 'https://test.com',
      contactEmail: 'contact@test.com',
      fullName: 'John Doe',
      sustainabilityCertifications: ['ISO14001'],
      tracksEmissions: true,
      emissionSources: ['scope1', 'scope2'],
      priorOffsetting: false,
      acceptedTerms: true,
      createdAt: new Date()
    };

    // Setup repository mocks
    userRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    userWalletRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    organizationRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    // Setup service mocks
    mockWalletService = {
      getOrCreateWallet: jest.fn()
    };

    mockAuditLogService = {
      createAuditLog: jest.fn()
    };

    mockSolanaService = {
      verifySignature: jest.fn(),
      mintCredit: jest.fn(),
      burnCredit: jest.fn()
    };

    // Mock implementations
    userRepository.findOneBy.mockResolvedValue(null);
    userWalletRepository.findOneBy.mockResolvedValue(mockUserWallet);
    organizationRepository.findOne.mockResolvedValue(null);
    organizationRepository.findOneBy.mockResolvedValue(null);
    mockWalletService.getOrCreateWallet.mockResolvedValue(mockUserWallet);

    // Mock AppDataSource.getRepository
    const getRepositoryMock = jest.fn((entity: any) => {
      switch (entity) {
        case User:
          return userRepository;
        case UserWallet:
          return userWalletRepository;
        case Organization:
          return organizationRepository;
        default:
          return {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn()
          };
      }
    });

    (AppDataSource.getRepository as jest.Mock).mockImplementation(getRepositoryMock);

    // Mock service constructors
    (WalletService as jest.Mock).mockImplementation(() => mockWalletService);
    (AuditLogService as jest.Mock).mockImplementation(() => mockAuditLogService);
    (SolanaService as jest.Mock).mockImplementation(() => mockSolanaService);

    // Initialize service
    userService = new UserService();
  });

  describe('getUserProfile', () => {
    it('should return user profile with organization data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      userRepository.findOneBy.mockResolvedValueOnce(mockUser);
      organizationRepository.findOne.mockResolvedValueOnce(mockOrg);

      const result = await userService.getUserProfile('user-1');

      expect(result).toEqual({
        ...mockUser,
        organization: mockOrg
      });
    });

    it('should return profile without organization if not found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      userRepository.findOneBy.mockResolvedValueOnce(mockUser);
      organizationRepository.findOne.mockResolvedValueOnce(null);

      const result = await userService.getUserProfile('user-1');

      expect(result).toEqual({
        ...mockUser,
        organization: null
      });
    });
  });

  describe('createUserOrganization', () => {
    it('should create an organization for a user', async () => {
      userWalletRepository.findOneBy.mockResolvedValueOnce(mockUserWallet);
      organizationRepository.create.mockReturnValueOnce(mockOrg);
      organizationRepository.save.mockResolvedValueOnce(mockOrg);

      const orgData = {
        userId: 'user-1',
        companyName: 'Test Company',
        description: 'Test company',
        companySize: '10-50',
        industryType: 'Technology',
        country: 'US',
        registrationNumber: 'REG123',
        websiteUrl: 'https://test.com',
        contactEmail: 'contact@test.com',
        fullName: 'John Doe',
        sustainabilityCertifications: ['ISO14001'],
        tracksEmissions: true,
        emissionSources: ['scope1', 'scope2'],
        priorOffsetting: false,
        acceptedTerms: true
      };

      const result = await userService.createUserOrganization(orgData);

      expect(result).toEqual(mockOrg);
      expect(organizationRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalledWith(
        mockUserWallet.id,
        'ORGANIZATION_CREATE',
        'organizations',
        mockOrg.id,
        { organization: mockOrg }
      );
    });
  });
}); 