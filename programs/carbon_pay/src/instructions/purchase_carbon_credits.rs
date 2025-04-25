use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{create_metadata_accounts_v3, mpl_token_metadata::types::{Creator, DataV2}, CreateMetadataAccountsV3, Metadata}, token::{self, Mint, MintTo, Token, TokenAccount}
};
use crate::state::{Project, Purchase, CarbonCredits};
use crate::errors::ContractError;

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
    pub project: Account<'info, Project>,
    
    /// CHECK: project owner is the project owner
    /// who receives the payment
    #[account(
        mut,
        constraint = project_owner.key() == project.owner @ ContractError::InvalidProjectOwner
    )]
    pub project_owner: UncheckedAccount<'info>,

    /// project's fungible token mint (separate from NFT mint)
    #[account(
        mut,
        constraint = project_mint.key() == project.token_mint @ ContractError::InvalidProjectMint
    )]
    pub project_mint: Account<'info, Mint>,

    /// CarbonCredits PDA
    #[account(
        mut,
        seeds = [b"carbon_credits"], bump = carbon_credits.bump,
        constraint = carbon_credits.key() == project.carbon_pay_authority @ ContractError::InvalidCarbonPayAuthority
    )]
    pub carbon_credits: Account<'info, CarbonCredits>,

    /// project's vault ATA (already created off-chain)
    #[account(
        mut,
        token::mint = project_mint,
        token::authority = carbon_credits,
        owner = token::ID
    )]
    pub project_token_account: Account<'info, TokenAccount>,

    /// purchase NFT mint (create off-chain)
    #[account(
        mut,
        constraint = purchase_nft_mint.mint_authority.unwrap() == buyer.key() @ ContractError::Unauthorized
    )]
    pub purchase_nft_mint: Account<'info, Mint>,

    /// buyer's ATA for the purchase NFT (create off-chain)
    #[account(
        mut,
        token::mint = purchase_nft_mint,
        token::authority = buyer,
        owner = token::ID
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,

    /// buyer's ATA for the fungible tokens (create off-chain)
    #[account(
        mut,
        token::mint = project_mint,
        token::authority = buyer,
        owner = token::ID
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// on-chain purchase record
    #[account(
        init,
        payer = buyer,
        space = Purchase::DISCRIMINATOR_SIZE + Purchase::INIT_SPACE,
        seeds = [b"purchase", buyer.key().as_ref(), project.key().as_ref(), purchase_nft_mint.key().as_ref()],
        bump
    )]
    pub purchase: Box<Account<'info, Purchase>>,

    /// purchase NFT metadata account (CPI will create)
    /// CHECK: This account will be initialized by the Token Metadata program via CPI. Safe because we're just passing it to the authorized CPI call.
    #[account(mut)]
    pub purchase_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> PurchaseCarbonCredits<'info> {
    pub fn purchase_carbon_credits(&mut self, amount: u64, bumps: &PurchaseCarbonCreditsBumps) -> Result<()> {
        // 1) payments
        let total = amount.checked_mul(self.project.price_per_token).ok_or(ContractError::ArithmeticOverflow)?;
        let fee  = total.checked_mul(self.project.carbon_pay_fee as u64).ok_or(ContractError::ArithmeticOverflow)?
                        .checked_div(10_000).ok_or(ContractError::ArithmeticOverflow)?;
        let to_owner = total.checked_sub(fee).ok_or(ContractError::ArithmeticOverflow)?;

        // 2) transfer SOL
        anchor_lang::system_program::transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: self.buyer.to_account_info(),
                    to:   self.project_owner.to_account_info(),
                },
            ),
            to_owner,
        )?;
        anchor_lang::system_program::transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: self.buyer.to_account_info(),
                    to:   self.carbon_credits.to_account_info(),
                },
            ),
            fee,
        )?;

        // 3) mint the purchase NFT
        token::mint_to(
            CpiContext::new(
                self.token_program.to_account_info(),
                MintTo {
                    mint:      self.purchase_nft_mint.to_account_info(),
                    to:        self.buyer_nft_account.to_account_info(),
                    authority: self.buyer.to_account_info(),
                },
            ),
            1,
        )?;

        // 4) create NFT metadata
        create_metadata_accounts_v3(
            CpiContext::new(
                self.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata:self.purchase_metadata.to_account_info(),
                    mint: self.purchase_nft_mint.to_account_info(),
                    mint_authority:self.buyer.to_account_info(),
                    payer:self.buyer.to_account_info(),
                    update_authority:self.buyer.to_account_info(),
                    system_program:self.system_program.to_account_info(),
                    rent:self.rent.to_account_info(),
                },
            ),
            DataV2 {
                name: format!("Carbon Credits Purchase - {}", amount),
                symbol:"CRBN".to_string(),
                uri: format!("https://carbonpay.com/purchases/{}", self.purchase_nft_mint.key()),
                seller_fee_basis_points: 0,
                creators: Some(vec![Creator{
                    address:  self.buyer.key(),
                    verified: true,
                    share:    100,
                }]),
                collection: None,
                uses:       None,
            },
            true,
            true,
            None,
        )?;

        // 5) transfer the fungible tokens from vault to buyer
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Transfer {
                    from:self.project_token_account.to_account_info(),
                    to:self.buyer_token_account.to_account_info(),
                    authority:self.carbon_credits.to_account_info(),
                },
                &[&[b"carbon_credits", &[self.carbon_credits.bump]]],
            ),
            amount,
        )?;

        // 6) update on-chain state
        self.purchase.set_inner(Purchase {
            buyer:self.buyer.key(),
            project:self.project.key(),
            amount,
            remaining_amount:amount,
            purchase_date:Clock::get()?.unix_timestamp,
            purchase_bump:bumps.purchase,
            nft_mint:self.purchase_nft_mint.key(),
        });
        self.project.remaining_amount = self.project.remaining_amount.checked_sub(amount).ok_or(ContractError::ArithmeticOverflow)?;

    
        Ok(())
    }
}
