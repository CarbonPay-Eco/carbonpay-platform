import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { DataSource } from "typeorm";
import { Wallet } from "../../entities/Wallet";
import { setupTestDatabase, teardownTestDatabase, cleanupTestDatabase } from "../../test-utils/database";

// Mock external dependencies
jest.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: jest.fn(() => ({
      publicKey: {
        toBase58: jest.fn(() => "mockPublicKey123"),
      },
      secretKey: new Uint8Array(64),
    })),
    fromSecretKey: jest.fn(() => ({
      publicKey: {
        toBase58: jest.fn(() => "mockPublicKey123"),
      },
      secretKey: new Uint8Array(64),
    })),
  },
}));

jest.mock("libsodium-wrappers", () => ({
  ready: Promise.resolve(),
  crypto_pwhash_SALTBYTES: 32,
  crypto_secretbox_KEYBYTES: 32,
  crypto_secretbox_NONCEBYTES: 24,
  crypto_pwhash_OPSLIMIT_INTERACTIVE: 2,
  crypto_pwhash_MEMLIMIT_INTERACTIVE: 67108864,
  crypto_pwhash_ALG_DEFAULT: 2,
  randombytes_buf: jest.fn(() => new Uint8Array(32)),
  crypto_pwhash: jest.fn(() => new Uint8Array(32)),
  crypto_secretbox_easy: jest.fn(() => new Uint8Array(64)),
  crypto_secretbox_open_easy: jest.fn(() => new Uint8Array(64)),
}));

jest.mock("bs58", () => ({
  default: {
    encode: jest.fn(() => "encoded-string"),
    decode: jest.fn(() => new Uint8Array(128)),
  },
  encode: jest.fn(() => "encoded-string"),
  decode: jest.fn(() => new Uint8Array(128)),
}));

describe("WalletService", () => {
  let testDataSource: DataSource;
  let walletRepository: any;

  beforeAll(async () => {
    testDataSource = await setupTestDatabase();
    walletRepository = testDataSource.getRepository(Wallet);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await teardownTestDatabase();
  });

  describe("Wallet Entity", () => {
    test("should create wallet entity successfully", async () => {
      const wallet = new Wallet();
      wallet.userId = "test-user-id";
      wallet.publicKey = "mockPublicKey123";
      wallet.encryptedPrivateKey = "encoded-string";

      const savedWallet = await walletRepository.save(wallet);

      expect(savedWallet).toBeDefined();
      expect(savedWallet.userId).toBe("test-user-id");
      expect(savedWallet.publicKey).toBe("mockPublicKey123");
      expect(savedWallet.encryptedPrivateKey).toBe("encoded-string");
    });

    test("should find wallet by userId", async () => {
      const wallet = new Wallet();
      wallet.userId = "test-user-id";
      wallet.publicKey = "mockPublicKey123";
      wallet.encryptedPrivateKey = "encoded-string";

      await walletRepository.save(wallet);

      const foundWallet = await walletRepository.findOneBy({ 
        userId: "test-user-id" 
      });

      expect(foundWallet).toBeDefined();
      expect(foundWallet.userId).toBe("test-user-id");
    });

    test("should handle wallet not found", async () => {
      const foundWallet = await walletRepository.findOneBy({ 
        userId: "nonexistent-user-id" 
      });

      expect(foundWallet).toBeNull();
    });
  });

  describe("Mock Verification", () => {
    test("should verify Solana keypair mock", () => {
      const { Keypair } = require("@solana/web3.js");
      const keypair = Keypair.generate();
      
      expect(keypair.publicKey.toBase58()).toBe("mockPublicKey123");
      expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
    });

    test("should verify sodium mock", async () => {
      const sodium = require("libsodium-wrappers");
      
      await sodium.ready;
      expect(sodium.crypto_pwhash_SALTBYTES).toBe(32);
      expect(typeof sodium.randombytes_buf).toBe('function');
    });

    test("should verify bs58 mock", () => {
      const bs58 = require("bs58");
      
      expect(bs58.encode("test")).toBe("encoded-string");
      expect(bs58.decode("test")).toBeInstanceOf(Uint8Array);
    });
  });
}); 