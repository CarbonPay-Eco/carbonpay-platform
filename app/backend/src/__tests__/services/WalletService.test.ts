import { WalletService } from '../../services/WalletService';
import { AppDataSource } from '../../database/data-source';
import { UserWallet } from '../../entities/UserWallet';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Mock dependencies
jest.mock('../../database/data-source');
jest.mock('@solana/web3.js');
jest.mock('bs58');

describe('WalletService', () => {
  let mockRepository: any;
  let mockKeypair: any;

  beforeEach(() => {
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    mockKeypair = {
      publicKey: {
        toBase58: jest.fn().mockReturnValue('mock-public-key'),
      },
      secretKey: new Uint8Array(32),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    (Keypair.generate as jest.Mock).mockReturnValue(mockKeypair);
    (Keypair.fromSecretKey as jest.Mock).mockReturnValue(mockKeypair);
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create wallet successfully', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.save.mockResolvedValue(mockWallet);

      const result = await WalletService.createWallet('user-123', 'password123');

      expect(Keypair.generate).toHaveBeenCalled();
      expect(mockKeypair.publicKey.toBase58).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: expect.any(String),
      }));
      expect(result).toEqual(mockWallet);
    });

    it('should encrypt private key correctly', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.save.mockResolvedValue(mockWallet);

      await WalletService.createWallet('user-123', 'password123');

      const savedWallet = mockRepository.save.mock.calls[0][0];
      expect(savedWallet.encryptedPrivateKey).toBeDefined();
      expect(typeof savedWallet.encryptedPrivateKey).toBe('string');
      expect(savedWallet.encryptedPrivateKey.length).toBeGreaterThan(0);
    });
  });

  describe('getKeypair', () => {
    it('should get keypair successfully', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.findOneBy.mockResolvedValue(mockWallet);

      const result = await WalletService.getKeypair('wallet-123', 'password123');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'wallet-123' });
      expect(Keypair.fromSecretKey).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(result).toEqual(mockKeypair);
    });

    it('should throw error when wallet not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        WalletService.getKeypair('non-existent-wallet', 'password123')
      ).rejects.toThrow('Wallet not found');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-wallet' });
    });

    it('should decrypt private key correctly', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.findOneBy.mockResolvedValue(mockWallet);

      await WalletService.getKeypair('wallet-123', 'password123');

      expect(Keypair.fromSecretKey).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt private key correctly', async () => {
      // Create a wallet first
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.save.mockResolvedValue(mockWallet);

      await WalletService.createWallet('user-123', 'password123');

      const savedWallet = mockRepository.save.mock.calls[0][0];
      const encryptedPrivateKey = savedWallet.encryptedPrivateKey;

      // Now try to get the keypair (which will decrypt)
      mockRepository.findOneBy.mockResolvedValue({
        ...mockWallet,
        encryptedPrivateKey,
      });

      await WalletService.getKeypair('wallet-123', 'password123');

      // Verify that decryption was attempted
      expect(Keypair.fromSecretKey).toHaveBeenCalled();
    });

    it('should handle decryption errors gracefully', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'invalid-encrypted-key',
      };

      mockRepository.findOneBy.mockResolvedValue(mockWallet);

      // Mock bs58.decode to throw an error
      (bs58.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base58');
      });

      await expect(
        WalletService.getKeypair('wallet-123', 'wrong-password')
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.save.mockResolvedValue(mockWallet);

      await WalletService.createWallet('user-123', '');

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: expect.any(String),
      }));
    });

    it('should handle special characters in password', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      mockRepository.save.mockResolvedValue(mockWallet);

      await WalletService.createWallet('user-123', 'p@ssw0rd!@#$%^&*()');

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: expect.any(String),
      }));
    });

    it('should handle very long password', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      };

      const longPassword = 'a'.repeat(1000);
      mockRepository.save.mockResolvedValue(mockWallet);

      await WalletService.createWallet('user-123', longPassword);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        publicKey: 'mock-public-key',
        encryptedPrivateKey: expect.any(String),
      }));
    });
  });

  describe('database interactions', () => {
    it('should use correct repository', () => {
      WalletService.createWallet('user-123', 'password123');

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(UserWallet);
    });

    it('should handle database save errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        WalletService.createWallet('user-123', 'password123')
      ).rejects.toThrow('Database error');
    });

    it('should handle database find errors', async () => {
      mockRepository.findOneBy.mockRejectedValue(new Error('Database error'));

      await expect(
        WalletService.getKeypair('wallet-123', 'password123')
      ).rejects.toThrow('Database error');
    });
  });
});

