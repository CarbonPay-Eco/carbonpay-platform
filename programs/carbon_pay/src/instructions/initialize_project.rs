use crate::state::{CarbonCredits, Project};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3, mpl_token_metadata::types::Creator,
        mpl_token_metadata::types::DataV2, CreateMasterEditionV3, CreateMetadataAccountsV3,
        Metadata,
    },
    token::spl_token::instruction::AuthorityType,
    token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
    amount: u64,
    price_per_token: u64,
    carbon_pay_fee: u64,
    uri: String,
    name: String,
    symbol: String,
)]
pub struct InitializeProjectAccountConstraints<'info> {
    #[account(mut)]
    pub project_owner: Signer<'info>,

    #[account(
        init,
        payer = project_owner,
        space = Project::DISCRIMINATOR_SIZE + Project::INIT_SPACE,
        seeds = [b"project", project_owner.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,

    /// Mint account for the project token
    #[account(
        init,
        payer = project_owner,
        mint::decimals = 0,
        mint::authority = project_owner,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = project_owner,
        associated_token::mint = mint,
        associated_token::authority = carbon_pay_authority,
    )]
    pub carbon_pay_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the CarbonPay authority that receives fees and initially holds tokens
    pub carbon_pay_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump,
    )]
    pub carbon_credits: Account<'info, CarbonCredits>,

    /// CHECK: This is the metadata account that will be created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: This is the master edition account that will be created
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitializeProjectAccountConstraints<'info> {
    #[allow(clippy::too_many_arguments)]
    pub fn initialize_project_handler(
        &mut self,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
        uri: String,
        name: String,
        symbol: String,
        bumps: &InitializeProjectAccountConstraintsBumps,
    ) -> Result<()> {
        // Set up the project
        self.project.set_inner(Project {
            owner: self.project_owner.key(),
            mint: self.mint.key(),
            token_bump: 0,
            amount,
            remaining_amount: amount,
            offset_amount: 0,
            price_per_token,
            carbon_pay_fee,
            carbon_pay_authority: self.carbon_pay_authority.clone().key(),
            project_bump: bumps.project,
            is_active: true,
        });

        // Update global carbon credits metrics
        self.carbon_credits.add_project_credits(amount)?;

        // Mint tokens to CarbonPay authority
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.carbon_pay_token_account.to_account_info(),
            authority: self.project_owner.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts);

        mint_to(cpi_ctx, amount)?;

        // Create metadata for the token
        let metadata_accounts = CreateMetadataAccountsV3 {
            metadata: self.metadata.to_account_info(),
            mint: self.mint.to_account_info(),
            mint_authority: self.project_owner.to_account_info(),
            payer: self.project_owner.to_account_info(),
            update_authority: self.carbon_pay_authority.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };

        let metadata_ctx = CpiContext::new(
            self.token_metadata_program.to_account_info(),
            metadata_accounts,
        );

        let data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: carbon_pay_fee as u16,
            creators: Some(vec![Creator {
                address: self.carbon_pay_authority.key(),
                verified: false,
                share: 100,
            }]),
            collection: None,
            uses: None,
        };

        create_metadata_accounts_v3(
            metadata_ctx,
            data,
            true,
            true,
            None,
        )?;

        // Create master edition
        let master_edition_accounts = CreateMasterEditionV3 {
            edition: self.master_edition.to_account_info(),
            mint: self.mint.to_account_info(),
            update_authority: self.carbon_pay_authority.to_account_info(),
            mint_authority: self.project_owner.to_account_info(),
            metadata: self.metadata.to_account_info(),
            payer: self.project_owner.to_account_info(),
            token_program: self.token_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };

        let master_edition_ctx = CpiContext::new(
            self.token_metadata_program.to_account_info(),
            master_edition_accounts,
        );

        create_master_edition_v3(
            master_edition_ctx,
            Some(0),
        )?;

        // Transfer the mint authority from the project owner to the carbon authority
        let cpi_accounts = SetAuthority {
            account_or_mint: self.mint.to_account_info(),
            current_authority: self.project_owner.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        set_authority(
            cpi_ctx,
            AuthorityType::MintTokens,
            Some(self.carbon_pay_authority.key()),
        )?;

        msg!(
            "Project initialized successfully with {} tokens at price {}",
            amount,
            price_per_token
        );
        Ok(())
    }
}
