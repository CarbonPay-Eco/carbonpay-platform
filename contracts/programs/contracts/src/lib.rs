use anchor_lang::prelude::*;



mod state;
mod instructions;

mod errors;

use instructions::*;

declare_id!("9YH9M52ZzPGQXyeq7dsUbKWrRHt2Ucv4p7RQnvLvdLtd");

#[program]
pub mod contracts {
    use super::*;
    
    pub fn initialize_carbon_credits(context: Context<InitializeCarbonCreditsAccountConstraints>) -> Result<()> {
        instructions::initialize_carbon_credits_handler(context)
    }
    
    pub fn initialize_project(
        context: Context<InitializeProjectAccountConstraints>,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
    ) -> Result<()> {
        context.accounts.initialize_project_handler(amount, price_per_token, carbon_pay_fee, &context.bumps)
    }
}


