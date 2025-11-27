/**
 * Script to mint USDC tokens to all users in the database
 * 
 * This script:
 * 1. Gets all users from the database
 * 2. Gets their wallet addresses
 * 3. Mints USDC tokens to each user's associated token account
 * 
 * Usage: npm run mint:usdc-to-users [amount]
 * Or: ts-node scripts/mint-usdc-to-users.ts [amount]
 * 
 * Example: npm run mint:usdc-to-users 1000
 * (Mints 1000 USDC to each user, accounting for 6 decimals = 1000000000)
 */

import "reflect-metadata";
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getMint,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { AppDataSource } from "../src/database/data-source";
import { User } from "../src/entities/User";
import { UserWallet } from "../src/entities/UserWallet";
import { WalletService } from "../src/services/WalletService";
import { SOLANA_NETWORK, SOLANA_RPC_URL, SOLANA_SERVER_PRIVATE_KEY } from '../src/config/constants';

async function mintUsdcToUsers(amount: number = 1000) {
  console.log(`Starting USDC minting to users (${amount} USDC each)...`);

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connection established");
    }

    // Get USDC mint from environment
    const usdcMintAddress = process.env.SOLANA_USDC_MINT;
    if (!usdcMintAddress) {
      throw new Error("SOLANA_USDC_MINT not set in environment variables");
    }
    const usdcMint = new PublicKey(usdcMintAddress);
    console.log(`Using USDC mint: ${usdcMintAddress}`);

    // Initialize Solana connection
    let rpcUrl = SOLANA_RPC_URL;
    if (!rpcUrl) {
      if (SOLANA_NETWORK === 'mainnet') {
        rpcUrl = clusterApiUrl('mainnet-beta');
      } else if (SOLANA_NETWORK === 'devnet') {
        rpcUrl = clusterApiUrl('devnet');
      } else {
        rpcUrl = 'http://127.0.0.1:8899';
      }
    }
    
    const connection = new Connection(rpcUrl, 'confirmed');
    console.log(`Connected to ${SOLANA_NETWORK} at ${rpcUrl}`);

    // Initialize server wallet (mint authority)
    const privateKeyBytes = bs58.decode(SOLANA_SERVER_PRIVATE_KEY);
    const serverKeypair = Keypair.fromSecretKey(privateKeyBytes);
    console.log(`Using server wallet: ${serverKeypair.publicKey.toBase58()}`);

    // Verify USDC mint
    const mintInfo = await getMint(connection, usdcMint);
    console.log(`USDC mint decimals: ${mintInfo.decimals}`);
    console.log(`Mint authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}`);
    
    if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(serverKeypair.publicKey)) {
      throw new Error(
        `Server wallet is not the mint authority. ` +
        `Mint authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}, ` +
        `Server wallet: ${serverKeypair.publicKey.toBase58()}`
      );
    }

    // Get all users
    const userRepository = AppDataSource.getRepository(User);
    const walletRepository = AppDataSource.getRepository(UserWallet);
    const users = await userRepository.find();
    console.log(`\nFound ${users.length} users`);

    // Convert amount to token units (accounting for decimals)
    const amountInTokenUnits = BigInt(Math.floor(amount * Math.pow(10, mintInfo.decimals)));
    console.log(`Minting ${amount} USDC (${amountInTokenUnits} token units) to each user\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Get user's wallet
        const userWallet = await walletRepository.findOneBy({ userId: user.id });
        if (!userWallet) {
          console.log(`  [${user.email}] ✗ No wallet found, skipping`);
          errorCount++;
          continue;
        }

        const userPublicKey = new PublicKey(userWallet.publicKey);
        
        // Get or create associated token account
        const userTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          userPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Check if token account exists
        const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
        
        if (!tokenAccountInfo) {
          // Create token account first
          console.log(`  [${user.email}] Creating token account...`);
          const createAtaTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              serverKeypair.publicKey, // payer
              userTokenAccount,
              userPublicKey, // owner
              usdcMint
            )
          );

          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          createAtaTx.recentBlockhash = blockhash;
          createAtaTx.feePayer = serverKeypair.publicKey;
          createAtaTx.sign(serverKeypair);

          const createTxSig = await connection.sendRawTransaction(createAtaTx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          await connection.confirmTransaction(createTxSig, 'confirmed');
          console.log(`  [${user.email}] Token account created: ${createTxSig}`);
        }

        // Mint tokens to user
        console.log(`  [${user.email}] Minting ${amount} USDC...`);
        const mintTxSig = await mintTo(
          connection,
          serverKeypair, // payer
          usdcMint,
          userTokenAccount,
          serverKeypair, // mint authority
          Number(amountInTokenUnits)
        );

        await connection.confirmTransaction(mintTxSig, 'confirmed');
        console.log(`  [${user.email}] ✓ Minted successfully: ${mintTxSig}`);
        successCount++;

      } catch (error: any) {
        console.error(`  [${user.email}] ✗ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n=== Minting Summary ===");
    console.log(`Total users: ${users.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Amount per user: ${amount} USDC`);

    if (errorCount > 0) {
      console.warn("\n⚠ Some users could not receive tokens. Please check the errors above.");
    } else {
      console.log("\n✓ All users received tokens successfully!");
    }

  } catch (error: any) {
    console.error("Minting failed:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Get amount from command line args
const amount = process.argv[2] ? parseFloat(process.argv[2]) : 1000;

// Run script
mintUsdcToUsers(amount)
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });

