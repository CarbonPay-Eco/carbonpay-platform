use anchor_lang::prelude::*;

#[account]

pub struct Purchase {
    pub buyer: Pubkey,         // The user who purchased carbon credits
    pub project: Pubkey,       // The project PDA that the purchase is for
    pub amount: u64,           // Amount of carbon credit tokens purchased
    pub remaining_amount: u64, // Amount of tokens not yet offset
    pub purchase_date: i64,    // Timestamp when purchase was made
    pub purchase_bump: u8,     // Bump for the purchase PDA
    pub nft_mint: Pubkey,      // Mint of the NFT representing this purchase
}

impl Purchase {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const INIT_SPACE: usize = 32 + // buyer: Pubkey
        32 + // project: Pubkey
        8 +  // amount: u64
        8 +  // remaining_amount: u64
        8 +  // purchase_date: i64
        1 +  // purchase_bump: u8
        32; // nft_mint: Pubkey
}
