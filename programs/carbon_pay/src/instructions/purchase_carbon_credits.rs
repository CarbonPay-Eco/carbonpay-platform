use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Project, Purchase};

 
#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct PurchaseCarbonCreditsAccountConstraints<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        constraint = project.is_active @ crate::errors::ContractError::ProjectInactive,
        constraint = project.remaining_amount >= amount @ crate::errors::ContractError::InsufficientTokens,
        seeds = [b"project", project.owner.as_ref(), project.mint.as_ref()],
        bump = project.project_bump,
    )]
    pub project: Account<'info, Project>,
    
    #[account(
        mut,
        constraint = project.owner == project_owner.key() @ crate::errors::ContractError::InvalidProjectOwner,
    )]
    /// CHECK: This is the project owner, we verify against the project account
    pub project_owner: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = buyer,
    )]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = buyer,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = buyer,
        space = Purchase::DISCRIMINATOR_SIZE + Purchase::INIT_SPACE, 
        seeds = [b"purchase", buyer.key().as_ref(), project.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub purchase: Account<'info, Purchase>,
    
    /// CHECK: This is the CarbonPay authority
    #[account(
        constraint = project.carbon_pay_authority == carbon_pay_authority.key() @ crate::errors::ContractError::InvalidCarbonPayAuthority,
    )]
    pub carbon_pay_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
impl<'info> PurchaseCarbonCreditsAccountConstraints<'info> {

    pub fn purchase_carbon_credits_handler(
        &mut self,
        amount: u64,
        bumps: &PurchaseCarbonCreditsAccountConstraintsBumps,
    ) -> Result<()> {
        let purchase_bump = bumps.purchase;
        
        // Mint 1 NFT to the buyer
        token::mint_to(
            CpiContext::new(
                self.token_program.to_account_info(),
                MintTo {
                    mint: self.nft_mint.to_account_info(),
                    to: self.buyer_nft_account.to_account_info(),
                    authority: self.buyer.to_account_info(),
                },
            ),
            1,
        )?;
        
        // Update project remaining amount
        self.project.remaining_amount = self.project.remaining_amount
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        // Initialize purchase record
        self.purchase.set_inner(Purchase {
            buyer: self.buyer.key(),
            project: self.project.key(),
            amount,
            remaining_amount: amount,
            purchase_date: Clock::get()?.unix_timestamp,
            purchase_bump,
            nft_mint: self.nft_mint.key(),
        });
        
        // Log payment information
        let total_payment = self.project.price_per_token
            .checked_mul(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        msg!(
            "Purchase of {} carbon credits created, total cost: {} lamports",
            amount,
            total_payment
        );
        
        Ok(())
    }
}
