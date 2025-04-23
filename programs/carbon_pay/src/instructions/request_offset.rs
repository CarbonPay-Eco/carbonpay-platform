use crate::state::{CarbonCredits, OffsetRequest, Project, Purchase, RequestStatus};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
#[instruction(amount: u64, request_id: String)]
pub struct RequestOffsetAccountConstraints<'info> {
    #[account(mut)]
    pub offset_requester: Signer<'info>,

    #[account(
        mut,
        constraint = purchase.buyer == offset_requester.key() @ crate::errors::ContractError::NotPurchaseOwner,
        constraint = purchase.remaining_amount >= amount @ crate::errors::ContractError::InsufficientRemainingTokens,
        seeds = [b"purchase", offset_requester.key().as_ref(), purchase.project.as_ref(), purchase.nft_mint.as_ref()],
        bump = purchase.purchase_bump,
    )]
    pub purchase: Account<'info, Purchase>,

    #[account(
        mut,
        constraint = project.key() == purchase.project @ crate::errors::ContractError::InvalidProject,
        seeds = [b"project", project.owner.as_ref(), project.mint.as_ref()],
        bump = project.project_bump,
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        token::mint = purchase.nft_mint,
        token::authority = offset_requester,
        constraint = buyer_nft_account.amount > 0 @ crate::errors::ContractError::InvalidNFTAccount,
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,

    /// CHECK: This is the CarbonPay authority that will approve the offset
    #[account(
        constraint = project.carbon_pay_authority == carbon_pay_authority.key() @ crate::errors::ContractError::InvalidCarbonPayAuthority,
    )]
    pub carbon_pay_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = offset_requester,
        space = OffsetRequest::DISCRIMINATOR_SIZE + OffsetRequest::INIT_SPACE,
        seeds = [b"offset_request", offset_requester.key().as_ref(), purchase.key().as_ref(), request_id.as_bytes()],
        bump
    )]
    pub offset_request: Account<'info, OffsetRequest>,

    #[account(
        mut,
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump,
    )]
    pub carbon_credits: Account<'info, CarbonCredits>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> RequestOffsetAccountConstraints<'info> {
    pub fn request_offset_handler(
        &mut self,
        amount: u64,
        request_id: String,
        bumps: &RequestOffsetAccountConstraintsBumps,
    ) -> Result<()> {
        let offset_requester = self.offset_requester.key();
        let purchase_key = self.purchase.key();
        let project_key = self.project.key();

        // Initialize the offset request
        self.offset_request.set_inner(OffsetRequest {
            offset_requester,
            purchase: purchase_key,
            project: project_key,
            amount,
            request_id,
            status: RequestStatus::Pending,
            request_date: Clock::get()?.unix_timestamp,
            processed_date: 0,
            request_bump: bumps.offset_request,
            processor: None,
        });
        msg!(
            "Offset request created for {} tokens. Awaiting approval from CarbonPay authority",
            amount
        );

        Ok(())
    }
}
