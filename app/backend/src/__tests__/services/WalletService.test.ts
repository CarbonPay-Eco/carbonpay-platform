import { WalletService } from '../../services/WalletService';
import { EncryptionService } from '../../services/encryption.service';
import { AppDataSource } from '../../database/data-source';
import { UserWallet } from '../../entities/UserWallet';
import { Repository } from 'typeorm';

// Mock the dependencies
jest.mock('../../database/data-source');
jest.mock('../../services/encryption.service');

describe('WalletService', () => {
  let mockWalletRepository: jest.Mocked<Repository<UserWallet>>;
  const strongPassword = 'TestPassword123!@#Strong';
  const userId = 'test-user-id';
  const walletId = 'test-wallet-id';
  const publicKey = 'TestPublicKey123456789';
  const encryptedPrivateKey = 'encrypted-private-key-data';

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWalletRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockWalletRepository);
  });

  describe('Password Verification', () => {
    it('should verify password using EncryptionService', async () => {
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await WalletService.verifyPassword(encryptedPrivateKey, strongPassword);

      expect(result).toBe(true);
      expect(EncryptionService.verifyPassword).toHaveBeenCalledWith(encryptedPrivateKey, strongPassword);
    });

    it('should return false for invalid password', async () => {
      (EncryptionService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await WalletService.verifyPassword(encryptedPrivateKey, 'wrong-password');

      expect(result).toBe(false);
    });
  });

  describe('Password Change', () => {
    const oldPassword = 'OldPassword123!@#';
    const newPassword = 'NewPassword456!@#';
    const newEncryptedKey = 'new-encrypted-private-key';

    beforeEach(() => {
      const mockWallet = {
        id: walletId,
        userId,
        publicKey,
        encryptedPrivateKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);
      mockWalletRepository.save.mockResolvedValue(mockWallet);
      (EncryptionService.reEncrypt as jest.Mock).mockReturnValue(newEncryptedKey);
    });

    it('should change password successfully', async () => {
      await WalletService.changePassword(walletId, oldPassword, newPassword);

      expect(mockWalletRepository.findOneBy).toHaveBeenCalledWith({ id: walletId });
      expect(EncryptionService.reEncrypt).toHaveBeenCalledWith(
        encryptedPrivateKey,
        oldPassword,
        newPassword
      );
      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          encryptedPrivateKey: newEncryptedKey
        })
      );
    });

    it('should throw error if wallet not found', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      await expect(WalletService.changePassword(walletId, oldPassword, newPassword))
        .rejects.toThrow('Wallet not found');
    });

    it('should handle encryption errors', async () => {
      (EncryptionService.reEncrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(WalletService.changePassword(walletId, oldPassword, newPassword))
        .rejects.toThrow('Password change failed: Encryption failed');
    });
  });

  describe('Wallet Creation', () => {
    beforeEach(() => {
      const mockKeypair = {
        publicKey: { toBase58: () => publicKey },
        secretKey: new Uint8Array([1, 2, 3, 4, 5])
      };
      
      // Mock Keypair generation
      jest.doMock('@solana/web3.js', () => ({
        Keypair: {
          generate: () => mockKeypair
        }
      }));

      (EncryptionService.encrypt as jest.Mock).mockReturnValue(encryptedPrivateKey);
      
      const mockSavedWallet = {
        id: walletId,
        userId,
        publicKey,
        encryptedPrivateKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletRepository.save.mockResolvedValue(mockSavedWallet);
    });

    it('should create wallet successfully', async () => {
      const result = await WalletService.createWallet(userId, strongPassword);

      expect(EncryptionService.encrypt).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        strongPassword
      );
      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          publicKey,
          encryptedPrivateKey
        })
      );
      expect(result).toEqual(expect.objectContaining({
        userId,
        publicKey,
        encryptedPrivateKey
      }));
    });

    it('should handle encryption errors during wallet creation', async () => {
      (EncryptionService.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(WalletService.createWallet(userId, strongPassword))
        .rejects.toThrow('Wallet creation failed: Encryption failed');
    });
  });

  describe('Keypair Retrieval', () => {
    const mockPrivateKey = new Uint8Array([1, 2, 3, 4, 5]);
    const mockKeypair = { publicKey: publicKey, secretKey: mockPrivateKey };

    beforeEach(() => {
      const mockWallet = {
        id: walletId,
        userId,
        publicKey,
        encryptedPrivateKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);
      (EncryptionService.decrypt as jest.Mock).mockReturnValue(mockPrivateKey);
      
      // Mock Keypair.fromSecretKey
      jest.doMock('@solana/web3.js', () => ({
        Keypair: {
          fromSecretKey: () => mockKeypair
        }
      }));
    });

    it('should retrieve keypair successfully', async () => {
      const result = await WalletService.getKeypair(walletId, strongPassword);

      expect(mockWalletRepository.findOneBy).toHaveBeenCalledWith({ id: walletId });
      expect(EncryptionService.decrypt).toHaveBeenCalledWith(encryptedPrivateKey, strongPassword);
      expect(result).toEqual(mockKeypair);
    });

    it('should throw error if wallet not found', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      await expect(WalletService.getKeypair(walletId, strongPassword))
        .rejects.toThrow('Wallet not found');
    });

    it('should handle decryption errors', async () => {
      (EncryptionService.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(WalletService.getKeypair(walletId, strongPassword))
        .rejects.toThrow('Failed to retrieve keypair: Decryption failed');
    });
  });

  describe('Wallet Queries', () => {
    const mockWallet = {
      id: walletId,
      userId,
      publicKey,
      encryptedPrivateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get wallet by user ID', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);

      const result = await WalletService.getWalletByUserId(userId);

      expect(mockWalletRepository.findOneBy).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockWallet);
    });

    it('should get wallet by public key', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);

      const result = await WalletService.getWalletByPublicKey(publicKey);

      expect(mockWalletRepository.findOneBy).toHaveBeenCalledWith({ publicKey });
      expect(result).toEqual(mockWallet);
    });

    it('should return null if wallet not found', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      const result = await WalletService.getWalletByUserId('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('Backup Operations', () => {
    const mockWallet = {
      id: walletId,
      userId,
      publicKey,
      encryptedPrivateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMetadata = {
      version: 1,
      kdfType: 'scrypt' as const,
      algorithm: 'aes-256-gcm',
      timestamp: '2024-01-01T00:00:00',
    };

    it('should create backup successfully', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue(mockMetadata);

      const result = await WalletService.createBackup(walletId);

      expect(result).toEqual({
        walletId,
        publicKey,
        encryptedPrivateKey,
        encryptionMetadata: mockMetadata,
        backupTimestamp: expect.any(String),
        version: '2.0',
      });
    });

    it('should throw error if wallet not found for backup', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      await expect(WalletService.createBackup(walletId))
        .rejects.toThrow('Wallet not found');
    });
  });

  describe('Restore Operations', () => {
    const backupData = {
      publicKey,
      encryptedPrivateKey,
    };

    const mockRestoredWallet = {
      id: 'new-wallet-id',
      userId,
      publicKey,
      encryptedPrivateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should restore wallet from backup', async () => {
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue({
        version: 1,
        kdfType: 'scrypt',
        algorithm: 'aes-256-gcm',
        timestamp: '2024-01-01T00:00:00',
      });
      mockWalletRepository.save.mockResolvedValue(mockRestoredWallet);

      const result = await WalletService.restoreFromBackup(userId, backupData);

      expect(EncryptionService.getEncryptionMetadata).toHaveBeenCalledWith(encryptedPrivateKey);
      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          publicKey,
          encryptedPrivateKey
        })
      );
      expect(result).toEqual(mockRestoredWallet);
    });

    it('should handle invalid backup data', async () => {
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid encrypted data');
      });

      await expect(WalletService.restoreFromBackup(userId, backupData))
        .rejects.toThrow('Wallet restoration failed: Invalid encrypted data');
    });
  });

  describe('Password Validation and Generation', () => {
    it('should validate password using EncryptionService', () => {
      const mockValidation = {
        isValid: true,
        score: 85,
        feedback: [],
        requirements: {
          length: true,
          lowercase: true,
          uppercase: true,
          numbers: true,
          specialChars: true,
          commonPatterns: true,
        }
      };

      (EncryptionService.validatePassword as jest.Mock).mockReturnValue(mockValidation);

      const result = WalletService.validatePassword(strongPassword);

      expect(EncryptionService.validatePassword).toHaveBeenCalledWith(strongPassword);
      expect(result).toEqual(mockValidation);
    });

    it('should generate secure password', () => {
      const mockPassword = 'SecureGeneratedPassword123!@#';
      (EncryptionService.generateSecurePassword as jest.Mock).mockReturnValue(mockPassword);

      const result = WalletService.generateSecurePassword(24);

      expect(EncryptionService.generateSecurePassword).toHaveBeenCalledWith(24);
      expect(result).toBe(mockPassword);
    });

    it('should generate secure password with default length', () => {
      const mockPassword = 'SecureGeneratedPassword123!@#';
      (EncryptionService.generateSecurePassword as jest.Mock).mockReturnValue(mockPassword);

      const result = WalletService.generateSecurePassword();

      expect(EncryptionService.generateSecurePassword).toHaveBeenCalledWith(24);
      expect(result).toBe(mockPassword);
    });
  });

  describe('Encryption Information', () => {
    const mockWallet = {
      id: walletId,
      userId,
      publicKey,
      encryptedPrivateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMetadata = {
      version: 1,
      kdfType: 'scrypt' as const,
      algorithm: 'aes-256-gcm',
      timestamp: '2024-01-01T00:00:00',
    };

    it('should get wallet encryption info', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue(mockMetadata);

      const result = await WalletService.getWalletEncryptionInfo(walletId);

      expect(mockWalletRepository.findOneBy).toHaveBeenCalledWith({ id: walletId });
      expect(EncryptionService.getEncryptionMetadata).toHaveBeenCalledWith(encryptedPrivateKey);
      expect(result).toEqual(mockMetadata);
    });

    it('should throw error if wallet not found for encryption info', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      await expect(WalletService.getWalletEncryptionInfo(walletId))
        .rejects.toThrow('Wallet not found');
    });
  });

  describe('Wallet Migration', () => {
    const mockWallet = {
      id: walletId,
      userId,
      publicKey,
      encryptedPrivateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should skip migration if already using new format', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(mockWallet);
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue({
        version: 1,
        kdfType: 'scrypt',
        algorithm: 'aes-256-gcm',
        timestamp: '2024-01-01T00:00:00',
      });

      await WalletService.migrateWalletEncryption(walletId, strongPassword);

      expect(EncryptionService.getEncryptionMetadata).toHaveBeenCalledWith(encryptedPrivateKey);
      // Should not attempt any migration operations
    });

    it('should detect old format and request support', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue({
        ...mockWallet,
        encryptedPrivateKey: 'old-format-encrypted-data'
      });
      
      // Mock old format detection
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid encrypted data format');
      });

      await expect(WalletService.migrateWalletEncryption(walletId, strongPassword))
        .rejects.toThrow('Please contact support for wallet migration');
    });

    it('should throw error if wallet not found for migration', async () => {
      mockWalletRepository.findOneBy.mockResolvedValue(null);

      await expect(WalletService.migrateWalletEncryption(walletId, strongPassword))
        .rejects.toThrow('Wallet not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockWalletRepository.findOneBy.mockRejectedValue(new Error('Database connection failed'));

      await expect(WalletService.getWalletByUserId(userId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle repository save errors', async () => {
      mockWalletRepository.save.mockRejectedValue(new Error('Save operation failed'));

      const backupData = { publicKey, encryptedPrivateKey };
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue({
        version: 1,
        kdfType: 'scrypt',
        algorithm: 'aes-256-gcm',
        timestamp: '2024-01-01T00:00:00',
      });

      await expect(WalletService.restoreFromBackup(userId, backupData))
        .rejects.toThrow('Wallet restoration failed: Save operation failed');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete wallet lifecycle', async () => {
      // Create wallet
      const mockKeypair = {
        publicKey: { toBase58: () => publicKey },
        secretKey: new Uint8Array([1, 2, 3, 4, 5])
      };
      
      (EncryptionService.encrypt as jest.Mock).mockReturnValue(encryptedPrivateKey);
      
      const mockCreatedWallet = {
        id: walletId,
        userId,
        publicKey,
        encryptedPrivateKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletRepository.save.mockResolvedValue(mockCreatedWallet);

      // Test wallet creation
      const createdWallet = await WalletService.createWallet(userId, strongPassword);
      expect(createdWallet).toEqual(mockCreatedWallet);

      // Test password verification
      (EncryptionService.verifyPassword as jest.Mock).mockReturnValue(true);
      const isPasswordValid = await WalletService.verifyPassword(encryptedPrivateKey, strongPassword);
      expect(isPasswordValid).toBe(true);

      // Test backup creation
      mockWalletRepository.findOneBy.mockResolvedValue(mockCreatedWallet);
      (EncryptionService.getEncryptionMetadata as jest.Mock).mockReturnValue({
        version: 1,
        kdfType: 'scrypt' as const,
        algorithm: 'aes-256-gcm',
        timestamp: '2024-01-01T00:00:00',
      });

      const backup = await WalletService.createBackup(walletId);
      expect(backup.walletId).toBe(walletId);
      expect(backup.version).toBe('2.0');
    });
  });
}); 