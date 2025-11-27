-- Migration: Add purchase_pda and nft_mint columns to purchases table
-- Date: 2024-11-26

-- Add purchase_pda column (on-chain purchase PDA address)
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS purchase_pda VARCHAR NULL;

-- Add nft_mint column (purchase NFT mint address)
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS nft_mint VARCHAR NULL;

-- Add comment for documentation
COMMENT ON COLUMN purchases.purchase_pda IS 'On-chain purchase PDA address from Solana program';
COMMENT ON COLUMN purchases.nft_mint IS 'Purchase NFT mint address from Solana program';

