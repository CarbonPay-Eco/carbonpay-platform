use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;

use instructions::*;

declare_id!("6CQ4FxzFPcHAS391UD56TyC9qiwiSKB4wAXRQDP9HfaS");

#[program]
pub mod carbon_pay {
    use super::*;

    pub fn initialize_carbon_credits(
        ctx: Context<InitializeCarbonCreditsAccountConstraints>,
    ) -> Result<()> {
        ctx.accounts.initialize_carbon_credits_handler(&ctx.bumps)
    }

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        ctx.accounts.handler(
            amount,
            price_per_token,
            carbon_pay_fee,
            uri,
            name,
            symbol,
            &ctx.bumps,
        )
    }

    pub fn request_offset(
        ctx: Context<RequestOffset>,
        amount: u64,
        request_id: String,
    ) -> Result<()> {
        ctx.accounts.handler(amount, request_id, &ctx.bumps)
    }

    pub fn purchase_carbon_credits(
        ctx: Context<PurchaseCarbonCredits>,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.purchase_carbon_credits(amount, &ctx.bumps)
    }
}
