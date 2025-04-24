use crate::state::{CarbonCredits, OffsetRequest, Project, Purchase, RequestStatus};
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, MintTo, Burn},
    metadata::{
        create_metadata_accounts_v3,
        mpl_token_metadata::types::{Creator, DataV2},
        CreateMetadataAccountsV3, Metadata,
    },
};
use crate::errors::*;

#[derive(Accounts)]
#[instruction(amount: u64, request_id: String)]
pub struct RequestOffset<'info> {
    /// who is asking for the offset
    #[account(mut)]
    pub offset_requester: Signer<'info>,

    /// the original Purchase, must belong to requester
    #[account(
        mut,
        constraint = purchase.buyer == offset_requester.key()      @ ContractError::NotPurchaseOwner,
        constraint = purchase.remaining_amount >= amount           @ ContractError::InsufficientRemainingTokens,
        seeds = [b"purchase", offset_requester.key().as_ref(), purchase.project.as_ref(), purchase.nft_mint.as_ref()],
        bump = purchase.purchase_bump,
    )]
    pub purchase: Box<Account<'info, Purchase>>,

    /// the Project
    #[account(
        mut,
        seeds = [b"project", project.owner.as_ref(), project.mint.as_ref()],
        bump = project.project_bump,
    )]
    pub project: Box<Account<'info, Project>>,

    /// the original NFT mint & token account
    #[account(mut, constraint = original_nft_mint.key() == purchase.nft_mint @ ContractError::InvalidNFTMint)]
    pub original_nft_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        token::mint = original_nft_mint,
        token::authority = offset_requester,
        constraint = original_nft_account.amount > 0 @ ContractError::InvalidNFTAccount,
    )]
    pub original_nft_account: Box<Account<'info, TokenAccount>>,

    /// NEW NFT mint & ATA must be created client-side beforehand!
    #[account(mut)]
    pub new_nft_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        token::mint = new_nft_mint,
        token::authority = offset_requester,
    )]
    pub new_nft_account: Box<Account<'info, TokenAccount>>,

    /// Metadata account for the new NFT
    /// CHECK: will be initialized by CPI
    #[account(mut)]
    pub new_nft_metadata: UncheckedAccount<'info>,

    /// CarbonCredits PDA
    #[account(
        mut,
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump,
    )]
    pub carbon_credits: Box<Account<'info, CarbonCredits>>,

    /// OffsetRequest record
    #[account(
        init,
        payer = offset_requester,
        space = OffsetRequest::DISCRIMINATOR_SIZE + OffsetRequest::INIT_SPACE,
        seeds = [b"offset_request", offset_requester.key().as_ref(), purchase.key().as_ref(), request_id.as_bytes()],
        bump
    )]
    pub offset_request: Box<Account<'info, OffsetRequest>>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> RequestOffset<'info> {
    pub fn handler(
        &mut self,
        amount: u64,
        request_id: String,
        bumps: &RequestOffsetBumps,
    ) -> Result<()> {
        // 1) validate
        require!(amount > 0, ContractError::InvalidAmount);
        require!(
            amount <= self.purchase.remaining_amount,
            ContractError::InsufficientRemainingTokens
        );

        // 2) compute new remaining
        let remaining = self
            .purchase
            .remaining_amount
            .checked_sub(amount)
            .ok_or(ContractError::ArithmeticOverflow)?;

        // 3) burn original NFT
        token::burn(
            CpiContext::new(
                self.token_program.to_account_info(),
                Burn {
                    mint: self.original_nft_mint.to_account_info(),
                    from: self.original_nft_account.to_account_info(),
                    authority: self.offset_requester.to_account_info(),
                },
            ),
            1,
        )?;

        // 4) if partial, mint new NFT into the existing ATA
        if remaining > 0 {
            // mint exactly 1 new token
            token::mint_to(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    MintTo {
                        mint: self.new_nft_mint.to_account_info(),
                        to: self.new_nft_account.to_account_info(),
                        authority: self.offset_requester.to_account_info(),
                    },
                ),
                1,
            )?;

            // prepare metadata
            let data = DataV2 {
                name: format!("CRBN-{}", remaining),
                symbol: "CRBN".to_string(),
                uri: format!("https://carbonpay.com/id/{}", self.new_nft_mint.key()),
                seller_fee_basis_points: 0,
                creators: Some(vec![Creator {
                    address: self.offset_requester.key(),
                    verified: true,
                    share: 100,
                }]),
                collection: None,
                uses: None,
            };

            // CPI to create metadata
            create_metadata_accounts_v3(
                CpiContext::new(
                    self.token_metadata_program.to_account_info(),
                    CreateMetadataAccountsV3 {
                        metadata: self.new_nft_metadata.to_account_info(),
                        mint: self.new_nft_mint.to_account_info(),
                        mint_authority: self.offset_requester.to_account_info(),
                        payer: self.offset_requester.to_account_info(),
                        update_authority: self.offset_requester.to_account_info(),
                        system_program: self.system_program.to_account_info(),
                        rent: self.rent.to_account_info(),
                    },
                ),
                data,
                true,
                true,
                None,
            )?;
        }

        // 5) update on-chain state
        self.purchase.remaining_amount = remaining;
        self.carbon_credits.offset_credits = self
            .carbon_credits
            .offset_credits
            .checked_add(amount)
            .ok_or(ContractError::ArithmeticOverflow)?;

        // 6) record the Request
        self.offset_request.set_inner(OffsetRequest {
            offset_requester: self.offset_requester.key(),
            purchase: self.purchase.key(),
            project: self.project.key(),
            amount,
            request_id,
            status: RequestStatus::Pending,
            request_date: Clock::get()?.unix_timestamp,
            processed_date: 0,
            request_bump: bumps.offset_request,
            processor: None,
        });

        msg!("Offset request for {} tokens, {} remaining", amount, remaining);
        Ok(())
    }
}
