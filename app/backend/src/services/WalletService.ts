import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import * as sodium from "libsodium-wrappers";
import { AppDataSource } from "../database/data-source";
import { Wallet } from "../entities/Wallet";

export class WalletService {
  private static async initializeSodium() {
    await sodium.ready;
  }

  private static async encryptPrivateKey(
    privateKey: Uint8Array,
    password: string
  ): Promise<string> {
    await this.initializeSodium();

    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const key = sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(privateKey, nonce, key);

    // Combine salt, nonce, and ciphertext
    const result = new Uint8Array(salt.length + nonce.length + ciphertext.length);
    result.set(salt);
    result.set(nonce, salt.length);
    result.set(ciphertext, salt.length + nonce.length);

    return bs58.encode(result);
  }

  private static async decryptPrivateKey(
    encryptedData: string,
    password: string
  ): Promise<Uint8Array> {
    await this.initializeSodium();

    const data = bs58.decode(encryptedData);
    const salt = data.slice(0, sodium.crypto_pwhash_SALTBYTES);
    const nonce = data.slice(
      sodium.crypto_pwhash_SALTBYTES,
      sodium.crypto_pwhash_SALTBYTES + sodium.crypto_secretbox_NONCEBYTES
    );
    const ciphertext = data.slice(
      sodium.crypto_pwhash_SALTBYTES + sodium.crypto_secretbox_NONCEBYTES
    );

    const key = sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );

    return sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  }

  public static async createWallet(
    userId: string,
    password: string
  ): Promise<Wallet> {
    const keypair = Keypair.generate();
    const encryptedPrivateKey = await this.encryptPrivateKey(
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
    userId: string,
    password: string
  ): Promise<Keypair> {
    const walletRepository = AppDataSource.getRepository(Wallet);
    const wallet = await walletRepository.findOneBy({ userId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const privateKey = await this.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      password
    );

    return Keypair.fromSecretKey(privateKey);
  }
}
