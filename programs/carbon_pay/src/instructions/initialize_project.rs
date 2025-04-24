use crate::state::{CarbonCredits, Project};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3,
        mpl_token_metadata::types::{Creator, DataV2},
        CreateMasterEditionV3, CreateMetadataAccountsV3, Metadata,
    },
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
    /// The creator of this project, pays for everything
    #[account(mut)]
    pub project_owner: Signer<'info>,

    /// On‐chain project state
    #[account(
        init,
        payer = project_owner,
        space = Project::DISCRIMINATOR_SIZE + Project::INIT_SPACE,
        seeds = [b"project", project_owner.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub project: Box<Account<'info, Project>>,

    /// The NFT mint for this project (also will become the fungible‐mint later)
    #[account(
        init,
        payer = project_owner,
        mint::decimals = 0,
        mint::authority = project_owner,
        mint::freeze_authority = project_owner,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// Vault holds both the single NFT and fungible tokens
    #[account(
        init,
        payer = project_owner,
        associated_token::mint = mint,
        associated_token::authority = project_owner,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    /// Global CarbonCredits account (PDA), which tracks totals & will hold mint authority
    #[account(
        mut,
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump,
    )]
    pub carbon_credits: Box<Account<'info, CarbonCredits>>,

    /// Metadata account for the NFT
    /// CHECK: This account is initialized by Token Metadata Program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// Master edition account for the NFT
    /// CHECK: This account is initialized by Token Metadata Program
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
        // 0️⃣ Populate project struct
        self.project.set_inner(Project {
            owner:                   self.project_owner.key(),
            mint:                    self.mint.key(),
            token_bump:              0,
            amount,
            remaining_amount:        amount,
            offset_amount:           0,
            price_per_token,
            carbon_pay_fee,
            carbon_pay_authority:    self.carbon_credits.key(),
            project_bump:            bumps.project,
            is_active:               true,
        });

        // 1️⃣ Update global totals
        self.carbon_credits.add_project_credits(amount)?;

        // 2️⃣ Mint exactly one NFT into `vault`
        {
            let cpi_accounts = MintTo {
                mint:      self.mint.to_account_info(),
                to:        self.vault.to_account_info(),
                authority: self.project_owner.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                self.token_program.to_account_info(),
                cpi_accounts,
            );
            mint_to(cpi_ctx, 1)?;
        }

        // 3️⃣ Reassign mint authority from the signer → your PDA
        {
            let cpi_accounts = SetAuthority {
                account_or_mint:    self.mint.to_account_info(),
                current_authority:  self.project_owner.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                self.token_program.to_account_info(),
                cpi_accounts,
            );
            set_authority(
                cpi_ctx,
                anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
                Some(self.carbon_credits.key()),
            )?;
        }

        // 4️⃣ Prepare PDA seeds array for the rest of the CPIs
        let bump = self.carbon_credits.bump;
        let authority_seeds: &[&[u8]] = &[
            b"carbon_credits",
            &[bump],
        ];

        // 5️⃣ Create Metadata (signed by PDA)
        {
            let data = DataV2 {
                name,
                symbol,
                uri,
                seller_fee_basis_points: carbon_pay_fee as u16,
                creators: Some(vec![Creator {
                    address:  self.carbon_credits.key(),
                    verified: false,
                    share:    100,
                }]),
                collection: None,
                uses:       None,
            };
            let accounts = CreateMetadataAccountsV3 {
                metadata:         self.metadata.to_account_info(),
                mint:             self.mint.to_account_info(),
                mint_authority:   self.carbon_credits.to_account_info(),
                payer:            self.project_owner.to_account_info(),
                update_authority: self.carbon_credits.to_account_info(),
                system_program:   self.system_program.to_account_info(),
                rent:             self.rent.to_account_info(),
            };
            let seeds = &[authority_seeds];
            let ctx = CpiContext::new_with_signer(
                self.token_metadata_program.to_account_info(),
                accounts,
                seeds,
            );
            create_metadata_accounts_v3(ctx, data, true, true, None)?;
        }

        // 6️⃣ Create Master Edition (signed by PDA)
        {
            let accounts = CreateMasterEditionV3 {
                edition:           self.master_edition.to_account_info(),
                mint:              self.mint.to_account_info(),
                update_authority:  self.carbon_credits.to_account_info(),
                mint_authority:    self.carbon_credits.to_account_info(),
                metadata:          self.metadata.to_account_info(),
                payer:             self.project_owner.to_account_info(),
                token_program:     self.token_program.to_account_info(),
                system_program:    self.system_program.to_account_info(),
                rent:              self.rent.to_account_info(),
            };
            let seeds = &[authority_seeds];
            let ctx = CpiContext::new_with_signer(
                self.token_metadata_program.to_account_info(),
                accounts,
                seeds,
            );
            create_master_edition_v3(ctx, Some(0))?;
        }

        // 7️⃣ Mint the full fungible supply into `vault` (signed by PDA)
        {
            let cpi_accounts = MintTo {
                mint:      self.mint.to_account_info(),
                to:        self.vault.to_account_info(),
                authority: self.carbon_credits.to_account_info(),
            };
            let seeds = &[authority_seeds];
            let cpi_ctx = CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                cpi_accounts,
                seeds,
            );
            mint_to(cpi_ctx, amount)?;
        }

        msg!(
            "Project initialized: {} tokens @ {} lamports each",
            amount,
            price_per_token
        );
        Ok(())
    }
}
