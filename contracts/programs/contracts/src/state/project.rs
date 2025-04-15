use anchor_lang::prelude::*;

/// 
#[account]
#[derive(InitSpace)]
pub struct Project {
    #[max_len(32)]
    pub project_owner: Pubkey, /// The user who list their carbon credits license in the platform
    pub mint: Pubkey, /// the token mint generated for that specif project
    pub token_bump: u8, /// the token bump
    pub is_active: bool, /// status of the project
    pub amount: u64, /// amount of tokens minted to that specif projetc
    pub project_bump: u8, /// project bump
    
}