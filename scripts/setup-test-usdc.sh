#!/bin/bash

# Script to set up USDC mint for localnet testing
# This creates a USDC mint and updates the constant in constants.rs

set -e

echo "🔧 Setting up USDC mint for localnet testing..."

# Run the TypeScript script to create the mint and get its address
cd "$(dirname "$0")/.."
MINT_ADDRESS=$(node -e "
const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');

(async () => {
  // Use the same connection as Anchor tests (from Anchor.toml)
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const payer = Keypair.generate();
  
  // Airdrop SOL
  const airdrop = await connection.requestAirdrop(payer.publicKey, 2e9);
  await connection.confirmTransaction(airdrop, 'confirmed');
  
  // Create mint
  const mint = await createMint(connection, payer, payer.publicKey, null, 6);
  console.log(mint.toBase58());
})();
")

if [ -z "$MINT_ADDRESS" ]; then
  echo "❌ Failed to create USDC mint"
  exit 1
fi

echo "✅ Created USDC mint: $MINT_ADDRESS"

# Update constants.rs
CONSTANTS_FILE="programs/carbon_pay/src/constants.rs"
sed -i.bak "s/pub const USDC_MINT: Pubkey = pubkey!(\".*\")/pub const USDC_MINT: Pubkey = pubkey!(\"$MINT_ADDRESS\")/" "$CONSTANTS_FILE"
rm -f "${CONSTANTS_FILE}.bak"

echo "✅ Updated constants.rs with mint address: $MINT_ADDRESS"
echo "🔨 Rebuilding program..."
anchor build

echo "✅ Setup complete! You can now run: anchor test"

