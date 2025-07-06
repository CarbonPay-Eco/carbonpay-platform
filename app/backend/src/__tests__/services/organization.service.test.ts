import { OrganizationService } from '../../services/organization.service';
import { setupRepositoryMock } from '../test-helpers';
import { Organization } from '../../database/entities/Organization';
import { WalletService } from '../../services/wallet.service';
import { AuditLogService } from '../../services/audit-log.service';

// Create mock instances
const mockWalletService = {
  findByAddress: jest.fn(),
  getOrCreateWallet: jest.fn()
};

const mockAuditLogService = {
  createAuditLog: jest.fn()
};

// Mock the service classes
jest.mock('../../services/wallet.service', () => ({
  WalletService: jest.fn().mockImplementation(() => mockWalletService)
}));

jest.mock('../../services/audit-log.service', () => ({
  AuditLogService: jest.fn().mockImplementation(() => mockAuditLogService)
}));

describe('OrganizationService', () => {
  let organizationService: OrganizationService;
  let organizationRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    organizationRepository = setupRepositoryMock('Organization');
    organizationService = new OrganizationService();
  });

  describe('getOrganizationByWallet', () => {
    it('should return organization when wallet exists', async () => {
      const mockWallet = { id: 'wallet-1', walletAddress: 'test-address' };
      const mockOrg = { id: 'org-1', walletId: mockWallet.id, companyName: 'Test Corp' };

      mockWalletService.findByAddress.mockResolvedValue(mockWallet);
      organizationRepository.findOne.mockResolvedValue(mockOrg);

      const result = await organizationService.getOrganizationByWallet('test-address');

      expect(result).toEqual(mockOrg);
      expect(mockWalletService.findByAddress).toHaveBeenCalledWith('test-address');
      expect(organizationRepository.findOne).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        relations: ['wallet']
      });
    });

    it('should return null when wallet does not exist', async () => {
      mockWalletService.findByAddress.mockResolvedValue(null);

      const result = await organizationService.getOrganizationByWallet('test-address');

      expect(result).toBeNull();
      expect(organizationRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getOrganizationByUserId', () => {
    it('should return organization when user exists', async () => {
      const mockWallet = { id: 'wallet-1', userId: 'user-1' };
      const mockOrg = { id: 'org-1', walletId: mockWallet.id, companyName: 'Test Corp' };

      mockWalletService.getOrCreateWallet.mockResolvedValue(mockWallet);
      organizationRepository.findOne.mockResolvedValue(mockOrg);

      const result = await organizationService.getOrganizationByUserId('user-1');

      expect(result).toEqual(mockOrg);
      expect(mockWalletService.getOrCreateWallet).toHaveBeenCalledWith('user-1');
      expect(organizationRepository.findOne).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        relations: ['wallet']
      });
    });

    it('should return null when organization not found', async () => {
      const mockWallet = { id: 'wallet-1', userId: 'user-1' };

      mockWalletService.getOrCreateWallet.mockResolvedValue(mockWallet);
      organizationRepository.findOne.mockResolvedValue(null);

      const result = await organizationService.getOrganizationByUserId('user-1');

      expect(result).toBeNull();
    });
  });
}); 