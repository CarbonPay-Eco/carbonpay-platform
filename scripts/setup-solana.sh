#!/bin/bash

# CarbonPay - Script de Setup Solana
# Este script ajuda a configurar o ambiente Solana para o CarbonPay

set -e

echo "🌳 CarbonPay - Solana Setup Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found${NC}"
    echo "Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

echo -e "${GREEN}✅ Solana CLI installed${NC}"
solana --version
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${YELLOW}⚠️  Anchor CLI not found${NC}"
    echo "Please install Anchor from: https://www.anchor-lang.com/docs/installation"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "avm install latest"
    echo "avm use latest"
    exit 1
fi

echo -e "${GREEN}✅ Anchor CLI installed${NC}"
anchor --version
echo ""

# Ask for network
echo "Select Solana network:"
echo "1) Localnet (for development)"
echo "2) Devnet (for testing)"
echo "3) Mainnet (for production)"
read -p "Enter choice (1-3): " network_choice

case $network_choice in
    1)
        NETWORK="localnet"
        RPC_URL="http://127.0.0.1:8899"
        echo -e "${GREEN}Selected: Localnet${NC}"
        ;;
    2)
        NETWORK="devnet"
        RPC_URL="https://api.devnet.solana.com"
        echo -e "${GREEN}Selected: Devnet${NC}"
        ;;
    3)
        NETWORK="mainnet"
        RPC_URL="https://api.mainnet-beta.solana.com"
        echo -e "${YELLOW}Selected: Mainnet (production)${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""

# Set Solana config
solana config set --url $RPC_URL
echo ""

# Generate or use existing wallet
read -p "Do you want to generate a new server wallet? (y/n): " gen_wallet

WALLET_PATH="$HOME/.config/solana/carbonpay-server.json"

if [ "$gen_wallet" = "y" ]; then
    echo "Generating new wallet..."
    solana-keygen new --outfile $WALLET_PATH --force
    echo -e "${GREEN}✅ Wallet generated at: $WALLET_PATH${NC}"
else
    if [ ! -f "$WALLET_PATH" ]; then
        echo -e "${RED}❌ Wallet not found at: $WALLET_PATH${NC}"
        echo "Please create a wallet first or choose to generate a new one"
        exit 1
    fi
    echo -e "${GREEN}✅ Using existing wallet at: $WALLET_PATH${NC}"
fi

echo ""

# Get wallet public key
WALLET_PUBKEY=$(solana-keygen pubkey $WALLET_PATH)
echo -e "${GREEN}Server Wallet Public Key:${NC} $WALLET_PUBKEY"
echo ""

# Get wallet balance
BALANCE=$(solana balance $WALLET_PUBKEY 2>/dev/null || echo "0")
echo "Current balance: $BALANCE"
echo ""

# Airdrop if needed and not mainnet
if [ "$NETWORK" != "mainnet" ]; then
    if [[ "$BALANCE" == "0"* ]]; then
        echo "Requesting airdrop..."
        if [ "$NETWORK" = "localnet" ]; then
            # For localnet, need to start validator first
            echo "Make sure local validator is running: solana-test-validator"
            read -p "Press enter when validator is ready..."
        fi

        solana airdrop 2 $WALLET_PUBKEY || echo -e "${YELLOW}⚠️  Airdrop failed. You may need to fund the wallet manually${NC}"
        echo ""
    fi
fi

# Convert wallet to base58 for .env
echo "Converting wallet to base58 format..."
PRIVATE_KEY_BASE58=$(cat $WALLET_PATH | jq -r '.' | python3 -c "
import json
import sys
import base58

data = json.load(sys.stdin)
# Take first 64 bytes (full keypair)
private_key = bytes(data[:64])
print(base58.b58encode(private_key).decode('utf-8'))
" 2>/dev/null || echo "ERROR")

if [ "$PRIVATE_KEY_BASE58" = "ERROR" ]; then
    echo -e "${YELLOW}⚠️  Could not convert to base58. Using alternative method...${NC}"
    # Alternative using node if Python fails
    PRIVATE_KEY_BASE58=$(cat $WALLET_PATH | node -e "
        const bs58 = require('bs58');
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
        console.log(bs58.encode(Buffer.from(data)));
    " 2>/dev/null || echo "ERROR")
fi

echo ""

# Deploy program if in project root
if [ -f "Anchor.toml" ]; then
    read -p "Do you want to build and deploy the CarbonPay program? (y/n): " deploy_prog

    if [ "$deploy_prog" = "y" ]; then
        echo "Building program..."
        anchor build
        echo ""

        echo "Deploying program..."
        anchor deploy
        echo ""

        # Get program ID
        PROGRAM_ID=$(solana address -k target/deploy/carbon_pay-keypair.json 2>/dev/null || echo "UNKNOWN")
        echo -e "${GREEN}Program deployed!${NC}"
        echo -e "${GREEN}Program ID:${NC} $PROGRAM_ID"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  Anchor.toml not found. Skipping program deployment${NC}"
    echo "If you want to deploy, run this script from the project root"
    echo ""
    PROGRAM_ID="bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg"
fi

# Create .env file for backend
echo "Creating .env configuration..."
cat > app/backend/.env.solana << EOF
# Solana Configuration - Generated by setup script
SOLANA_NETWORK=$NETWORK
SOLANA_PROGRAM_ID=$PROGRAM_ID
SOLANA_RPC_URL=$RPC_URL
SOLANA_SERVER_PRIVATE_KEY=$PRIVATE_KEY_BASE58
SOLANA_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Server Wallet Info (for reference only - do not commit)
# Public Key: $WALLET_PUBKEY
# Wallet Path: $WALLET_PATH
EOF

echo -e "${GREEN}✅ Configuration saved to: app/backend/.env.solana${NC}"
echo ""

# Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Copy Solana configuration to your .env file:"
echo "   cat app/backend/.env.solana >> app/backend/.env"
echo ""
echo "2. Start the backend server:"
echo "   cd app/backend"
echo "   npm run dev"
echo ""
echo "3. Initialize the CarbonCredits PDA (one-time setup):"
echo "   Call the admin endpoint or use a script to:"
echo "   await solanaOnchainService.initializeCarbonCredits(usdcMint)"
echo ""
if [ "$NETWORK" = "mainnet" ]; then
echo "4. ⚠️  MAINNET: Fund your server wallet with SOL:"
echo "   Address: $WALLET_PUBKEY"
echo "   Recommended: At least 1 SOL for transaction fees"
echo ""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Important Security Notes:"
echo "- ⚠️  Keep your private key ($WALLET_PATH) secure!"
echo "- ⚠️  Never commit .env files to version control"
echo "- ⚠️  Use a hardware wallet or KMS for production"
echo "- ⚠️  Regularly backup your wallet"
echo ""
echo "For more information, see: SOLANA_INTEGRATION.md"
echo ""
