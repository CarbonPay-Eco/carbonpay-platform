import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { DataSource } from "typeorm";
import { User } from "../../entities/User";
import { Wallet } from "../../entities/Wallet";
import { setupTestDatabase, teardownTestDatabase, cleanupTestDatabase } from "../../test-utils/database";

describe("Auth-Wallet Integration Flow", () => {
  let testDataSource: DataSource;
  let userRepository: any;
  let walletRepository: any;

  beforeAll(async () => {
    testDataSource = await setupTestDatabase();
    userRepository = testDataSource.getRepository(User);
    walletRepository = testDataSource.getRepository(Wallet);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await teardownTestDatabase();
  });

  describe("Database Integration", () => {
    test("should create and link user and wallet entities", async () => {
      // Create user
      const user = new User();
      user.email = "test@example.com";
      user.passwordHash = "hashedPassword";
      const savedUser = await userRepository.save(user);

      // Create wallet linked to user
      const wallet = new Wallet();
      wallet.userId = savedUser.id;
      wallet.publicKey = "mockPublicKey123";
      wallet.encryptedPrivateKey = "encryptedPrivateKey";
      const savedWallet = await walletRepository.save(wallet);

      // Verify relationships
      expect(savedUser).toBeDefined();
      expect(savedWallet).toBeDefined();
      expect(savedWallet.userId).toBe(savedUser.id);

      // Test queries
      const foundUser = await userRepository.findOneBy({ email: "test@example.com" });
      const foundWallet = await walletRepository.findOneBy({ userId: savedUser.id });

      expect(foundUser.id).toBe(savedUser.id);
      expect(foundWallet.userId).toBe(savedUser.id);
    });

    test("should handle multiple users with different wallets", async () => {
      // Create first user
      const user1 = new User();
      user1.email = "user1@example.com";
      user1.passwordHash = "hashedPassword1";
      const savedUser1 = await userRepository.save(user1);

      // Create second user
      const user2 = new User();
      user2.email = "user2@example.com";
      user2.passwordHash = "hashedPassword2";
      const savedUser2 = await userRepository.save(user2);

      // Create wallets for both users
      const wallet1 = new Wallet();
      wallet1.userId = savedUser1.id;
      wallet1.publicKey = "publicKey1";
      wallet1.encryptedPrivateKey = "encryptedPrivateKey1";
      await walletRepository.save(wallet1);

      const wallet2 = new Wallet();
      wallet2.userId = savedUser2.id;
      wallet2.publicKey = "publicKey2";
      wallet2.encryptedPrivateKey = "encryptedPrivateKey2";
      await walletRepository.save(wallet2);

      // Verify isolation
      const wallet1Found = await walletRepository.findOneBy({ userId: savedUser1.id });
      const wallet2Found = await walletRepository.findOneBy({ userId: savedUser2.id });

      expect(wallet1Found.publicKey).toBe("publicKey1");
      expect(wallet2Found.publicKey).toBe("publicKey2");
      expect(wallet1Found.userId).not.toBe(wallet2Found.userId);
    });

    test("should enforce email uniqueness", async () => {
      // Create first user
      const user1 = new User();
      user1.email = "duplicate@example.com";
      user1.passwordHash = "hashedPassword1";
      await userRepository.save(user1);

      // Try to create second user with same email
      const user2 = new User();
      user2.email = "duplicate@example.com";
      user2.passwordHash = "hashedPassword2";

      await expect(userRepository.save(user2)).rejects.toThrow();
    });
  });

  describe("Data Consistency", () => {
    test("should maintain referential integrity", async () => {
      const user = new User();
      user.email = "consistency@example.com";
      user.passwordHash = "hashedPassword";
      const savedUser = await userRepository.save(user);

      const wallet = new Wallet();
      wallet.userId = savedUser.id;
      wallet.publicKey = "consistencyPublicKey";
      wallet.encryptedPrivateKey = "consistencyPrivateKey";
      await walletRepository.save(wallet);

      // Verify data integrity
      const users = await userRepository.find();
      const wallets = await walletRepository.find();

      expect(users).toHaveLength(1);
      expect(wallets).toHaveLength(1);
      expect(wallets[0].userId).toBe(users[0].id);
    });

    test("should handle timestamps correctly", async () => {
      const user = new User();
      user.email = "timestamp@example.com";
      user.passwordHash = "hashedPassword";
      const savedUser = await userRepository.save(user);

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });
  });
}); 