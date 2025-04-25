use anchor_lang::prelude::*;

/// Project represents a specific carbon credit offering with its own tokens and tracking.
/// Each project has its own independent accounting of credits, separate from other projects.
#[account]
pub struct Project {
    pub owner: Pubkey, // The user who lists their carbon credits license in the platform
    pub mint: Pubkey,  // The NFT mint for the project owner
    pub token_mint: Pubkey, // The token mint for fungible tokens stored in the vault
    pub token_bump: u8, // The token bump
    pub is_active: bool, // Status of the project
    pub amount: u64,   // Total amount of tokens minted for this project
    pub remaining_amount: u64, // Amount of tokens not yet sold in this project
    pub offset_amount: u64, // Amount of tokens that have been offset in this project
    pub price_per_token: u64, // Price per token in lamports
    pub carbon_pay_fee: u64, // Fee percentage taken by CarbonPay (e.g. 500 = 5.00%)
    pub carbon_pay_authority: Pubkey, // Authority that can receive fees
    pub project_bump: u8, // Project bump
}

impl Project {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const INIT_SPACE: usize = 32 +  // project_owner: Pubkey
        32 +  // mint: Pubkey
        32 +  // token_mint: Pubkey
        1 +   // token_bump: u8
        1 +   // is_active: bool
        8 +   // amount: u64
        8 +   // remaining_amount: u64
        8 +   // offset_amount: u64
        8 +   // price_per_token: u64
        8 +   // carbon_pay_fee: u64
        32 +  // carbon_pay_authority: Pubkey
        1; // project_bump: u8

    /// Initialize a new carbon credit project
    pub fn initialize(&mut self) -> Result<()> {
        self.is_active = true;
        self.remaining_amount = self.amount;
        self.offset_amount = 0;
        Ok(())
    }

    /// Record a purchase of credits from this project
    pub fn record_purchase(&mut self, purchase_amount: u64) -> Result<()> {
        self.remaining_amount = self
            .remaining_amount
            .checked_sub(purchase_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }

    /// Record an offset of credits from this project
    pub fn record_offset(&mut self, offset_amount: u64) -> Result<()> {
        self.offset_amount = self
            .offset_amount
            .checked_add(offset_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }
}
