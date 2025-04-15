use anchor_lang::prelude::*;

/// 
#[account]
#[derive(InitSpace)]
pub struct CarbonCredits {
    pub owner: Pubkey, /// owner 
    pub total_credits: u64,
    pub bump: u8,
}
