/**
 * Script to create a test USDC mint on devnet
 * 
 * This creates a token mint with 6 decimals (like USDC) that can be used
 * for testing on devnet.
 * 
 * Usage: npm run create:devnet-usdc
 * Or: ts-node scripts/create-devnet-usdc-mint.ts
 */

import "reflect-metadata";
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { createMint, getMint } from '@solana/spl-token';
import bs58 from 'bs58';
import { SOLANA_NETWORK, SOLANA_RPC_URL, SOLANA_SERVER_PRIVATE_KEY } from '../src/config/constants';

async function createDevnetUsdcMint() {
  console.log("Creating test USDC mint on devnet...");

  try {
    // Initialize connection
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

    // Initialize server wallet
    const privateKeyBytes = bs58.decode(SOLANA_SERVER_PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    console.log(`Using server wallet: ${keypair.publicKey.toBase58()}`);

    // Check balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Server wallet balance: ${balance / 1e9} SOL`);

    if (balance < 0.1 * 1e9) {
      console.warn("⚠️  Warning: Low balance. You may need to airdrop SOL:");
      console.warn(`   solana airdrop 2 ${keypair.publicKey.toBase58()} --url devnet`);
    }

    // Create mint with 6 decimals (like USDC)
    console.log("\nCreating token mint with 6 decimals...");
    const mint = await createMint(
      connection,
      keypair, // payer
      keypair.publicKey, // mint authority
      keypair.publicKey, // freeze authority
      6 // decimals (USDC uses 6)
    );

    console.log(`\n✓ Test USDC mint created successfully!`);
    console.log(`\nMint Address: ${mint.toBase58()}`);
    console.log(`\nAdd this to your .env file:`);
    console.log(`SOLANA_USDC_MINT=${mint.toBase58()}`);

    // Verify the mint
    const mintInfo = await getMint(connection, mint);
    console.log(`\nMint Details:`);
    console.log(`  Decimals: ${mintInfo.decimals}`);
    console.log(`  Supply: ${mintInfo.supply.toString()}`);
    console.log(`  Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}`);
    console.log(`  Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() || 'None'}`);

  } catch (error: any) {
    console.error("Error creating mint:", error.message);
    if (error.message.includes('insufficient funds')) {
      console.error("\n⚠️  Insufficient funds. Please airdrop SOL to your server wallet:");
      const privateKeyBytes = bs58.decode(SOLANA_SERVER_PRIVATE_KEY);
      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      console.error(`   solana airdrop 2 ${keypair.publicKey.toBase58()} --url devnet`);
    }
    process.exit(1);
  }
}

// Run script
createDevnetUsdcMint()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });

