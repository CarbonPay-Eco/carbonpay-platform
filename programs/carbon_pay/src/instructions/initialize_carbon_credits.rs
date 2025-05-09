use crate::state::CarbonCredits;
use anchor_lang::prelude::*;

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

impl<'info> InitializeCarbonCreditsAccountConstraints<'info> {
    pub fn initialize_carbon_credits_handler(
        &mut self,
        bumps: &InitializeCarbonCreditsAccountConstraintsBumps,
    ) -> Result<()> {
        let carbon_credits = &mut self.carbon_credits;

        carbon_credits.initialize(self.admin.key(), bumps.carbon_credits)?;

        Ok(())
    }
}
