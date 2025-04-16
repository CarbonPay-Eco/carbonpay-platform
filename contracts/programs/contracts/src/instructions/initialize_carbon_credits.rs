use anchor_lang::prelude::*;
use crate::state::CarbonCredits;

#[derive(Accounts)]
pub struct InitializeCarbonCreditsAccountConstraints<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = CarbonCredits::DISCRIMINATOR_SIZE + CarbonCredits::INIT_SPACE,
        seeds = [b"carbon_credits"],
        bump
    )]
    pub carbon_credits: Account<'info, CarbonCredits>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_carbon_credits_handler(context: Context<InitializeCarbonCreditsAccountConstraints>) -> Result<()> {
    let carbon_credits = &mut context.accounts.carbon_credits;
    
    // Initialize the global carbon credits metrics
    carbon_credits.initialize(
        context.accounts.admin.key(),
        context.bumps.carbon_credits
    )?;
    
    msg!("CarbonCredits global account initialized");
    Ok(())
} 