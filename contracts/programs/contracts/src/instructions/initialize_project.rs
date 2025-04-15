use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct MintCredits<'info> {
    
    #[account(mut)]
    pub admin: Signer<'info>




}

impl MintCredits {
    pub fn mint_credits(self) -> Result<()> {
        Ok(())
    }
}