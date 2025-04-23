use anchor_lang::prelude::*;

mod instructions;
mod state;

mod errors;

use instructions::*;

declare_id!("9YH9M52ZzPGQXyeq7dsUbKWrRHt2Ucv4p7RQnvLvdLtd");

#[program]
pub mod carbon_pay {
    use super::*;

    pub fn initialize_carbon_credits(
        context: Context<InitializeCarbonCreditsAccountConstraints>,
    ) -> Result<()> {
        context.accounts.initialize_carbon_credits_handler(&context.bumps)
    }

    pub fn initialize_project(
        context: Context<InitializeProjectAccountConstraints>,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        context.accounts.initialize_project_handler(
            amount,
            price_per_token,
            carbon_pay_fee,
            uri,
            name,
            symbol,
            &context.bumps,
        )
    }

    pub fn request_offset(
        context: Context<RequestOffsetAccountConstraints>,
        amount: u64,
        request_id: String,
    ) -> Result<()> {
        context.accounts.request_offset_handler(amount, request_id, &context.bumps)
    }

    pub fn purchase_carbon_credits(
        context: Context<PurchaseCarbonCreditsAccountConstraints>,
        amount: u64,
        
    ) -> Result<()> {
       context.accounts.purchase_carbon_credits_handler(amount, &context.bumps)
    }

    // pub fn offset_carbon_credits(
    //     context: Context<OffsetCarbonCreditsAccountConstraints>,
    //     amount: u64,
    // ) -> Result<()> {
    //     instructions::offset_carbon_credits_handler(context, amount)
    // }
}
