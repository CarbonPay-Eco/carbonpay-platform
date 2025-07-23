import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { AppDataSource } from "../database/data-source";
import { UserWallet } from "../entities/UserWallet";
import { EncryptionService } from "./encryption.service";
import { ENCRYPTION_ERRORS } from "../config/constants";

/**
 * Enhanced WalletService using dedicated encryption service
 * Provides secure wallet management with improved private key encryption
 */
export class WalletService {
  /**
   * Validates password against encrypted private key without decrypting
   */
  public static async verifyPassword(
    encryptedPrivateKey: string,
    password: string
  ): Promise<boolean> {
    return EncryptionService.verifyPassword(encryptedPrivateKey, password);
  }

  /**
   * Changes the password for an encrypted private key
   */
  public static async changePassword(
    walletId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ id: walletId });

    if (!wallet) {
      throw new Error(ENCRYPTION_ERRORS.WALLET_NOT_FOUND);
    }

    try {
      // Re-encrypt with new password using enhanced encryption service
      const newEncryptedPrivateKey = EncryptionService.reEncrypt(
        wallet.encryptedPrivateKey,
        oldPassword,
        newPassword
      );

      // Update wallet with new encrypted private key
      wallet.encryptedPrivateKey = newEncryptedPrivateKey;
      await walletRepository.save(wallet);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Password change failed: ${err.message}`);
    }
  }

  /**
   * Creates a new wallet with enhanced encryption
   */
  public static async createWallet(
    userId: string,
    password: string
  ): Promise<UserWallet> {
    try {
      const keypair = Keypair.generate();
      
      // Use enhanced encryption service
      const encryptedPrivateKey = EncryptionService.encrypt(
        keypair.secretKey,
        password
      );

      const wallet = new UserWallet();
      wallet.userId = userId;
      wallet.publicKey = keypair.publicKey.toBase58();
      wallet.encryptedPrivateKey = encryptedPrivateKey;

      const walletRepository = AppDataSource.getRepository(UserWallet);
      const savedWallet = await walletRepository.save(wallet);

      // Clear sensitive data from memory
      keypair.secretKey.fill(0);

      return savedWallet;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Wallet creation failed: ${err.message}`);
    }
  }

  /**
   * Retrieves decrypted keypair with enhanced security
   */
  public static async getKeypair(
    walletId: string,
    password: string
  ): Promise<Keypair> {
    try {
      const walletRepository = AppDataSource.getRepository(UserWallet);
      const wallet = await walletRepository.findOneBy({ id: walletId });

      if (!wallet) {
        throw new Error(ENCRYPTION_ERRORS.WALLET_NOT_FOUND);
      }

      // Use enhanced decryption service
      const privateKey = EncryptionService.decrypt(
        wallet.encryptedPrivateKey,
        password
      );
      
      const keypair = Keypair.fromSecretKey(privateKey);

      // Clear sensitive data from memory
      privateKey.fill(0);

      return keypair;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to retrieve keypair: ${err.message}`);
    }
  }

  /**
   * Gets wallet by user ID
   */
  public static async getWalletByUserId(userId: string): Promise<UserWallet | null> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    return await walletRepository.findOneBy({ userId });
  }

  /**
   * Gets wallet by public key
   */
  public static async getWalletByPublicKey(publicKey: string): Promise<UserWallet | null> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    return await walletRepository.findOneBy({ publicKey });
  }

  /**
   * Creates a backup of the encrypted private key with additional metadata
   */
  public static async createBackup(walletId: string): Promise<{
    walletId: string;
    publicKey: string;
    encryptedPrivateKey: string;
    encryptionMetadata: any;
    backupTimestamp: string;
  }> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ id: walletId });

    if (!wallet) {
      throw new Error(ENCRYPTION_ERRORS.WALLET_NOT_FOUND);
    }

    // Get encryption metadata
    const metadata = EncryptionService.getEncryptionMetadata(wallet.encryptedPrivateKey);

    return {
      walletId: wallet.id,
      publicKey: wallet.publicKey,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
      encryptionMetadata: metadata,
      backupTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Restores a wallet from backup data
   */
  public static async restoreFromBackup(
    userId: string,
    backupData: {
      publicKey: string;
      encryptedPrivateKey: string;
    }
  ): Promise<UserWallet> {
    try {
      // Validate backup data format
      EncryptionService.getEncryptionMetadata(backupData.encryptedPrivateKey);

      const wallet = new UserWallet();
      wallet.userId = userId;
      wallet.publicKey = backupData.publicKey;
      wallet.encryptedPrivateKey = backupData.encryptedPrivateKey;

      const walletRepository = AppDataSource.getRepository(UserWallet);
      return await walletRepository.save(wallet);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Wallet restoration failed: ${err.message}`);
    }
  }

  /**
   * Validates password strength for wallet operations
   */
  public static validatePassword(password: string) {
    return EncryptionService.validatePassword(password);
  }

  /**
   * Generates a secure password for wallet creation
   */
  public static generateSecurePassword(length: number = 24): string {
    return EncryptionService.generateSecurePassword(length);
  }

  /**
   * Gets encryption metadata for a wallet
   */
  public static async getWalletEncryptionInfo(walletId: string) {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ id: walletId });

    if (!wallet) {
      throw new Error(ENCRYPTION_ERRORS.WALLET_NOT_FOUND);
    }

    return EncryptionService.getEncryptionMetadata(wallet.encryptedPrivateKey);
  }

  /**
   * Migrates old wallet encryption to new format
   */
  public static async migrateWalletEncryption(
    walletId: string,
    password: string
  ): Promise<void> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ id: walletId });

    if (!wallet) {
      throw new Error(ENCRYPTION_ERRORS.WALLET_NOT_FOUND);
    }

    try {
      // Try to get metadata to check if already migrated
      EncryptionService.getEncryptionMetadata(wallet.encryptedPrivateKey);
      // If no error, already using new format
      return;
    } catch {
      // Old format detected, migrate
      try {
        // Decrypt using old method (assuming BS58 encoded)
        const oldData = bs58.decode(wallet.encryptedPrivateKey);
        
        if (oldData.length >= 64) { // Old format: salt(32) + iv(16) + authTag(16) + encrypted
          // This is a simplified migration - in production you'd need the actual old decryption logic
          throw new Error("Please contact support for wallet migration");
        }
      } catch (error) {
        const err = error as Error;
        throw new Error(`Migration failed: ${err.message}`);
      }
    }
  }
}
