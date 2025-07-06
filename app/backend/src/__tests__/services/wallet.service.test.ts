import { WalletService } from '../../services/wallet.service';
import { setupRepositoryMock } from '../test-helpers';
import { Wallet } from '../../database/entities/Wallet';

describe('WalletService', () => {
  let walletService: WalletService;
  let walletRepository: any;

  beforeEach(() => {
    walletRepository = setupRepositoryMock('Wallet');
    walletService = new WalletService();
  });

  describe('findByAddress', () => {
    it('should find wallet by address', async () => {
      const mockWallet = { id: 'wallet-1', walletAddress: 'test-address' };
      walletRepository.findOne.mockResolvedValue(mockWallet);

      const result = await walletService.findByAddress('test-address');

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findOne).toHaveBeenCalledWith({ where: { walletAddress: 'test-address' } });
    });

    it('should return null when wallet not found', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      const result = await walletService.findByAddress('test-address');

      expect(result).toBeNull();
    });
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet if found', async () => {
      const mockWallet = { id: 'wallet-1', walletAddress: 'test-address', provider: 'test-provider' };
      walletRepository.findOne.mockResolvedValue(mockWallet);

      const result = await walletService.getOrCreateWallet('test-address', 'test-provider');

      expect(result).toEqual(mockWallet);
      expect(walletRepository.create).not.toHaveBeenCalled();
      expect(walletRepository.save).not.toHaveBeenCalled();
    });

    it('should create new wallet if not found', async () => {
      const mockWallet = { id: 'wallet-1', walletAddress: 'test-address', provider: 'test-provider', createdAt: expect.any(Date) };
      walletRepository.findOne.mockResolvedValue(null);
      walletRepository.create.mockReturnValue(mockWallet);
      walletRepository.save.mockResolvedValue(mockWallet);

      const result = await walletService.getOrCreateWallet('test-address', 'test-provider');

      expect(result).toEqual(mockWallet);
      expect(walletRepository.create).toHaveBeenCalledWith({
        walletAddress: 'test-address',
        provider: 'test-provider',
        createdAt: expect.any(Date)
      });
      expect(walletRepository.save).toHaveBeenCalledWith(mockWallet);
    });

    it('should create wallet without provider if not specified', async () => {
      const mockWallet = { id: 'wallet-1', walletAddress: 'test-address', createdAt: expect.any(Date) };
      walletRepository.findOne.mockResolvedValue(null);
      walletRepository.create.mockReturnValue(mockWallet);
      walletRepository.save.mockResolvedValue(mockWallet);

      const result = await walletService.getOrCreateWallet('test-address');

      expect(result).toEqual(mockWallet);
      expect(walletRepository.create).toHaveBeenCalledWith({
        walletAddress: 'test-address',
        createdAt: expect.any(Date)
      });
    });
  });
}); 