import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
} from "crypto";
import { AppDataSource } from "../database/data-source";
import { Wallet } from "../entities/Wallet";

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
  ): Promise<Wallet> {
    const keypair = Keypair.generate();
    const encryptedPrivateKey = this.encryptPrivateKey(
      keypair.secretKey,
      password
    );

    const wallet = new Wallet();
    wallet.userId = userId;
    wallet.publicKey = keypair.publicKey.toBase58();
    wallet.encryptedPrivateKey = encryptedPrivateKey;

    const walletRepository = AppDataSource.getRepository(Wallet);
    return await walletRepository.save(wallet);
  }

  public static async getKeypair(
    walletId: string,
    password: string
  ): Promise<Keypair> {
    const walletRepository = AppDataSource.getRepository(Wallet);
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
}
