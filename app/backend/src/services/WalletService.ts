import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
} from "crypto";
import { AppDataSource } from "../database/data-source";
import { UserWallet } from "../entities/UserWallet";

export class WalletService {
  private static encryptPrivateKey(
    privateKey: Uint8Array,
    password: string
  ): string {
    const salt = randomBytes(32);
    const iv = randomBytes(16);

    // Derive key from password using PBKDF2
    const key = pbkdf2Sync(password, salt, 100000, 32, "sha256");

    // Encrypt using AES-256-GCM
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(privateKey),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted data
    const result = Buffer.concat([salt, iv, authTag, encrypted]);

    return bs58.encode(result);
  }

  private static decryptPrivateKey(
    encryptedData: string,
    password: string
  ): Uint8Array {
    const data = bs58.decode(encryptedData);

    // Extract components
    const salt = data.slice(0, 32);
    const iv = data.slice(32, 48);
    const authTag = data.slice(48, 64);
    const encrypted = data.slice(64);

    // Derive key from password
    const key = pbkdf2Sync(password, salt, 100000, 32, "sha256");

    // Decrypt using AES-256-GCM
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return new Uint8Array(decrypted);
  }

  public static async createWallet(
    userId: string,
    password: string
  ): Promise<UserWallet> {
    const keypair = Keypair.generate();
    const encryptedPrivateKey = this.encryptPrivateKey(
      keypair.secretKey,
      password
    );

    const wallet = new UserWallet();
    wallet.userId = userId;
    wallet.publicKey = keypair.publicKey.toBase58();
    wallet.encryptedPrivateKey = encryptedPrivateKey;

    const walletRepository = AppDataSource.getRepository(UserWallet);
    return await walletRepository.save(wallet);
  }

  public static async getKeypair(
    walletId: string,
    password: string
  ): Promise<Keypair> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ id: walletId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const privateKey = this.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      password
    );
    return Keypair.fromSecretKey(privateKey);
  }

  /**
   * Derive a server-side master password for a user
   * Uses JWT_SECRET + userId to create a consistent, server-accessible password
   */
  private static getServerMasterPassword(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret_here";
    const serverMasterKey = process.env.SERVER_WALLET_MASTER_KEY;
    
    // Use SERVER_WALLET_MASTER_KEY if set, otherwise derive from JWT_SECRET + userId
    if (serverMasterKey) {
      return `${serverMasterKey}-${userId}`;
    }
    return `${jwtSecret}-${userId}`;
  }

  /**
   * Get keypair by userId using server-side master key
   * This is for server-side operations where we don't have the user's password
   * Tries multiple known password patterns to decrypt the wallet
   * Throws an error if decryption fails - wallet must be recreated with proper encryption
   */
  public static async getKeypairByUserId(userId: string): Promise<Keypair> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const wallet = await walletRepository.findOneBy({ userId });

    if (!wallet) {
      throw new Error(
        `Wallet not found for user ${userId}. ` +
        `Please recreate the user wallet using the migration script.`
      );
    }

    // Get server master password (derived from JWT_SECRET or SERVER_WALLET_MASTER_KEY)
    const serverMasterPassword = this.getServerMasterPassword(userId);
    
    // List of possible passwords to try (in order of likelihood)
    const possiblePasswords = [
      serverMasterPassword, // Server-derived master key (most likely for new wallets)
      "default-password-change-me", // Common default for auto-created wallets
      "temp-password", // Used in draft completion
      process.env.SERVER_WALLET_MASTER_KEY || "default-password-change-me", // Raw master key
      `${userId}-${process.env.JWT_SECRET || "your_jwt_secret_here"}`, // Alternative derivation
    ];

    // Try each password until one works
    for (const password of possiblePasswords) {
      try {
        const privateKey = this.decryptPrivateKey(
          wallet.encryptedPrivateKey,
          password
        );
        const keypair = Keypair.fromSecretKey(privateKey);
        
        // Verify the keypair matches the stored public key
        if (keypair.publicKey.toBase58() === wallet.publicKey) {
          return keypair;
        }
      } catch (error) {
        // Try next password
        continue;
      }
    }

    // If all passwords failed, throw error - wallet must be recreated
    throw new Error(
      `Failed to decrypt wallet for user ${userId}. ` +
      `Wallet was encrypted with a password we don't have access to. ` +
      `Please run the wallet migration script to recreate wallets with proper encryption: ` +
      `npm run migrate:wallets`
    );
  }

  /**
   * Recreate a user's wallet with proper server-side encryption
   * This should be used when a wallet cannot be decrypted
   */
  public static async recreateWallet(userId: string): Promise<UserWallet> {
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const existingWallet = await walletRepository.findOneBy({ userId });

    const serverMasterPassword = this.getServerMasterPassword(userId);
    const newKeypair = Keypair.generate();
    const encryptedPrivateKey = this.encryptPrivateKey(
      newKeypair.secretKey,
      serverMasterPassword
    );

    if (existingWallet) {
      // Update existing wallet
      existingWallet.publicKey = newKeypair.publicKey.toBase58();
      existingWallet.encryptedPrivateKey = encryptedPrivateKey;
      return await walletRepository.save(existingWallet);
    } else {
      // Create new wallet
      const wallet = new UserWallet();
      wallet.userId = userId;
      wallet.publicKey = newKeypair.publicKey.toBase58();
      wallet.encryptedPrivateKey = encryptedPrivateKey;
      return await walletRepository.save(wallet);
    }
  }
}
