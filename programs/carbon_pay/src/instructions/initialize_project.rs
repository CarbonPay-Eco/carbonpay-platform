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

/// ATAs for `project_owner_nft_account` and `vault` must exist before the call
#[derive(Accounts)]
#[instruction(
    amount: u64,
    price_per_token: u64,
    carbon_pay_fee: u64,
    uri: String,
    name: String,
    symbol: String,
)]
pub struct InitializeProject<'info> {
   
    #[account(mut)]
    pub project_owner: Signer<'info>,

    /// On-chain state of the project
    #[account(
        init,
        payer = project_owner,
        space = Project::DISCRIMINATOR_SIZE + Project::INIT_SPACE,
        seeds = [b"project", project_owner.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub project: Box<Account<'info, Project>>,

    /// The NFT mint - will be used to create a Master Edition NFT
    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = project_owner,
        mint::freeze_authority = project_owner,
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    /// The token mint - will be used for fungible tokens
    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = project_owner,
        mint::freeze_authority = project_owner,
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    /// Owner's ATA for the NFT (must exist before; create with `spl-token create-account`)
    #[account(
        mut,
        constraint = project_owner_nft_account.owner == project_owner.key(),
        constraint = project_owner_nft_account.mint  == nft_mint.key(),
    )]
    pub project_owner_nft_account: Box<Account<'info, TokenAccount>>,

    /// ATA of the `carbon_credits` PDA for fungible tokens (create off-chain)
    #[account(
        mut,
        token::mint = token_mint,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    /// PDA that controls totals and becomes mint authority of fungibles
    #[account(
        mut,
        seeds = [b"carbon_credits"],
        bump = carbon_credits.bump,
    )]
    pub carbon_credits: Box<Account<'info, CarbonCredits>>,

    /// Metadata account managed by the Token Metadata Program
    /// CHECK: This account is created via CPI to the token metadata program
    #[account(mut)] 
    pub metadata: UncheckedAccount<'info>,
    
    /// Master Edition account managed by the Token Metadata Program
    /// CHECK: This account is created via CPI to the token metadata program
    #[account(mut)] 
    pub master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeProject<'info> {
    pub fn handler(
        &mut self,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
        uri: String,
        name: String,
        symbol: String,
        bumps: &InitializeProjectBumps,
    ) -> Result<()> {
        // 1. Initialize on-chain project state and update totals
        self.project.set_inner(Project {
            owner: self.project_owner.key(),
            mint: self.nft_mint.key(),
            token_mint: self.token_mint.key(),  // Added token_mint field
            token_bump: 0,
            amount,
            remaining_amount: amount,
            offset_amount: 0,
            price_per_token,
            carbon_pay_fee,
            carbon_pay_authority: self.carbon_credits.key(),
            project_bump: bumps.project,
            is_active: true,
        });
        self.carbon_credits.add_project_credits(amount)?;

        // 2. Mint the NFT (1 token) for project owner
        let cpi_mint_nft = CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.nft_mint.to_account_info(),
                to: self.project_owner_nft_account.to_account_info(),
                authority: self.project_owner.to_account_info(),
            },
        );
        mint_to(cpi_mint_nft, 1)?;

        // 3. Mint the fungible tokens (amount) to the vault
        let cpi_mint_tokens = CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.token_mint.to_account_info(),
                to: self.vault.to_account_info(),
                authority: self.project_owner.to_account_info(),
            },
        );
        mint_to(cpi_mint_tokens, amount)?;

        // 4. Transfer the fungible token mint authority to the carbon_credits PDA
        let cpi_set_authority = CpiContext::new(
            self.token_program.to_account_info(),
            SetAuthority {
                account_or_mint: self.token_mint.to_account_info(),
                current_authority: self.project_owner.to_account_info(),
            },
        );
        
        set_authority(
            cpi_set_authority,
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
            Some(self.carbon_credits.key()),
        )?;

        // 5. Metadata + master edition for the NFT
        let data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: carbon_pay_fee as u16,
            creators: Some(vec![
                Creator { address: self.project_owner.key(), verified: true, share: 95 },
                Creator { address: self.carbon_credits.key(), verified: false, share: 5 },
            ]),
            collection: None,
            uses: None,
        };
        // Metadata
        create_metadata_accounts_v3(
            CpiContext::new(
                self.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata:        self.metadata.to_account_info(),
                    mint:            self.nft_mint.to_account_info(),
                    mint_authority:  self.project_owner.to_account_info(),
                    payer:           self.project_owner.to_account_info(),
                    update_authority:self.project_owner.to_account_info(),
                    system_program:  self.system_program.to_account_info(),
                    rent:            self.rent.to_account_info(),
                },
            ),
            data,
            true,
            true,
            None,
        )?;
        // Master edition
        create_master_edition_v3(
            CpiContext::new(
                self.token_metadata_program.to_account_info(),
                CreateMasterEditionV3 {
                    edition:         self.master_edition.to_account_info(),
                    mint:            self.nft_mint.to_account_info(),
                    update_authority:self.project_owner.to_account_info(),
                    mint_authority:  self.project_owner.to_account_info(),
                    metadata:        self.metadata.to_account_info(),
                    payer:           self.project_owner.to_account_info(),
                    token_program:   self.token_program.to_account_info(),
                    system_program:  self.system_program.to_account_info(),
                    rent:            self.rent.to_account_info(),
                },
            ),
            Some(0), // Max supply of 0 means there will be no prints (editions) of this NFT
        )?;

        Ok(())
    }
}
