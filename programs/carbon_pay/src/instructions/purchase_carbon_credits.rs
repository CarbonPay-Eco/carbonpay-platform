use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{Project, Purchase, CarbonCredits};
use crate::errors::ContractError;
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct PurchaseCarbonCredits<'info> {
    #[account(
        mut,
        constraint = project.is_active @ ContractError::ProjectInactive,
        constraint = project.remaining_amount >= amount @ ContractError::InsufficientTokens,
        seeds = [b"project", project.owner.as_ref(), project.mint.as_ref()],
        bump = project.project_bump,
    )]
    pub project: Box<Account<'info, Project>>,

    #[account(
        mut,
        constraint = project_mint.key() == project.mint @ ContractError::InvalidProjectMint
    )]
    pub project_mint: Box<Account<'info, Mint>>,

    #[account(
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump
    )]
    pub carbon_credits: Box<Account<'info, CarbonCredits>>,

    #[account(
        mut,
        associated_token::mint = project_mint,
        associated_token::authority = carbon_credits
    )]
    pub project_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = buyer
    )]
    pub purchase_nft_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = buyer,
        associated_token::mint = purchase_nft_mint,
        associated_token::authority = buyer
    )]
    pub buyer_nft_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = project_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = buyer,
        space = Purchase::DISCRIMINATOR_SIZE + Purchase::INIT_SPACE,
        seeds = [b"purchase", buyer.key().as_ref(), project.key().as_ref(), purchase_nft_mint.key().as_ref()],
        bump
    )]
    pub purchase: Box<Account<'info, Purchase>>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> PurchaseCarbonCredits<'info> {
    pub fn purchase_carbon_credits(&mut self, amount: u64, bumps: &PurchaseCarbonCreditsBumps) -> Result<()> {
        self.validate_and_record_purchase(amount, bumps)?;
        self.mint_nft()?;
        self.transfer_credits(amount)?;
        self.update_project_state(amount)?;
        Ok(())
    }

    #[inline(never)]
    fn mint_nft(&self) -> Result<()> {
        token::mint_to(
            CpiContext::new(
                self.token_program.to_account_info(),
                token::MintTo {
                    mint: self.purchase_nft_mint.to_account_info(),
                    to: self.buyer_nft_account.to_account_info(),
                    authority: self.buyer.to_account_info()
                }
            ),
            1,
        )
    }

    #[inline(never)]
    fn transfer_credits(&self, amount: u64) -> Result<()> {
        let bump = &[self.carbon_credits.bump];
        let seeds = &[&b"carbon_credits"[..], bump][..];
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Transfer {
                    from: self.project_token_account.to_account_info(),
                    to: self.buyer_token_account.to_account_info(),
                    authority: self.carbon_credits.to_account_info()
                },
                &[seeds],
            ),
            amount,
        )
    }

    #[inline(never)]
    fn update_project_state(&mut self, amount: u64) -> Result<()> {
        self.project.remaining_amount = self.project.remaining_amount.checked_sub(amount).ok_or(ContractError::ArithmeticOverflow)?;
        msg!("Purchase {} credits, NFT mint: {}", amount, self.purchase_nft_mint.key());
        Ok(())
    }

    fn validate_and_record_purchase(&mut self, amount: u64, bumps: &PurchaseCarbonCreditsBumps) -> Result<()> {
        require!(self.project.is_active, ContractError::ProjectInactive);
        require!(amount > 0, ContractError::InvalidAmount);
        require!(self.carbon_credits.key() == self.project.carbon_pay_authority, ContractError::InvalidCarbonPayAuthority);

        self.purchase.set_inner(Purchase {
            buyer: self.buyer.key(),
            project: self.project.key(),
            amount,
            remaining_amount: amount,
            purchase_date: Clock::get()?.unix_timestamp,
            purchase_bump: bumps.purchase,
            nft_mint: self.purchase_nft_mint.key(),
        });
        Ok(())
    }
}