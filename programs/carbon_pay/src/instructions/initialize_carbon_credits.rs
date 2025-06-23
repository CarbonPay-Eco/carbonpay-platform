use crate::state::CarbonCredits;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct InitializeCarbonCreditsAccountConstraints<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// USDC mint account for payments
    #[account(
        constraint = usdc_mint.decimals == 6 @ crate::errors::ContractError::InvalidUsdcDecimals,
    )]
    pub usdc_mint: Account<'info, Mint>,

    /// Platform vault to hold USDC fees (ATA for carbon_credits PDA)
    #[account(
        init,
        payer = admin,
        associated_token::mint = usdc_mint,
        associated_token::authority = carbon_credits,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        space = CarbonCredits::DISCRIMINATOR_SIZE + CarbonCredits::INIT_SPACE,
        seeds = [b"carbon_credits"],
        bump
    )]
    pub carbon_credits: Account<'info, CarbonCredits>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitializeCarbonCreditsAccountConstraints<'info> {
    pub fn initialize_carbon_credits_handler(
        &mut self,
        bumps: &InitializeCarbonCreditsAccountConstraintsBumps,
    ) -> Result<()> {
        let carbon_credits = &mut self.carbon_credits;

        carbon_credits.initialize(
            self.admin.key(),
            self.usdc_mint.key(),
            self.usdc_vault.key(),
            bumps.carbon_credits,
        )?;

        Ok(())
    }
}
