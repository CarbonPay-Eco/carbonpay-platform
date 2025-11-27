/**
 * Migration script to recreate user wallets with proper server-side encryption
 * 
 * This script:
 * 1. Finds all users with wallets
 * 2. Attempts to decrypt each wallet
 * 3. If decryption fails, recreates the wallet with proper encryption
 * 4. Updates the database with the new encrypted wallet
 * 
 * Usage: npm run migrate:wallets
 * Or: ts-node scripts/migrate-wallets.ts
 */

import "reflect-metadata";
import { AppDataSource } from "../src/database/data-source";
import { User } from "../src/entities/User";
import { UserWallet } from "../src/entities/UserWallet";
import { WalletService } from "../src/services/WalletService";

async function migrateWallets() {
  console.log("Starting wallet migration...");

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connection established");
    }

    const userRepository = AppDataSource.getRepository(User);
    const walletRepository = AppDataSource.getRepository(UserWallet);

    // Get all users
    const users = await userRepository.find();
    console.log(`Found ${users.length} users`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const wallet = await walletRepository.findOneBy({ userId: user.id });

        if (!wallet) {
          console.log(`  [${user.email}] No wallet found, creating new one...`);
          await WalletService.recreateWallet(user.id);
          migratedCount++;
          console.log(`  [${user.email}] ✓ Wallet created`);
          continue;
        }

        // Try to decrypt the wallet
        try {
          await WalletService.getKeypairByUserId(user.id);
          console.log(`  [${user.email}] ✓ Wallet decrypts successfully, skipping`);
          skippedCount++;
        } catch (error) {
          // Decryption failed, recreate wallet
          console.log(`  [${user.email}] ✗ Wallet decryption failed, recreating...`);
          const oldPublicKey = wallet.publicKey;
          await WalletService.recreateWallet(user.id);
          const newWallet = await walletRepository.findOneBy({ userId: user.id });
          console.log(
            `  [${user.email}] ✓ Wallet recreated: ${oldPublicKey} -> ${newWallet?.publicKey}`
          );
          migratedCount++;
        }
      } catch (error: any) {
        console.error(`  [${user.email}] ✗ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total users: ${users.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped (already valid): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.warn("\n⚠ Some wallets could not be migrated. Please check the errors above.");
      process.exit(1);
    } else {
      console.log("\n✓ All wallets migrated successfully!");
    }
  } catch (error: any) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run migration
migrateWallets()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });

