#!/bin/bash
# Script to close existing program and deploy fresh
# This fixes the "Buffer account data size" error

set -e

echo "🔧 Closing existing program to free up space..."
solana program close J8ngc3K1JjbJeVVZLhj1AB3SgsnNosppgHhBD9N9mNc4 --url devnet

echo ""
echo "🔨 Building program..."
anchor build

echo ""
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Update your .env file with the new program ID:"
echo "   SOLANA_PROGRAM_ID=<new_program_id_from_deployment_output>"
echo ""
echo "   Also update lib.rs declare_id!() if the program ID changed"

