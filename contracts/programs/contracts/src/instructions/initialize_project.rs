use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, MintTo, mint_to, SetAuthority, set_authority};
use anchor_spl::token::spl_token::instruction::AuthorityType;
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Project, CarbonCredits};

#[derive(Accounts)]
#[instruction(amount: u64, price_per_token: u64, carbon_pay_fee: u64)]
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
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
impl<'info> InitializeProjectAccountConstraints<'info> {

    pub fn initialize_project_handler(
        &mut self,
        amount: u64,
        price_per_token: u64,
        carbon_pay_fee: u64,
        bumps: &InitializeProjectAccountConstraintsBumps,
    ) -> Result<()> {
        // Set up the project
        self.project.set_inner(Project {
            owner: self.project_owner.key(),
            mint: self.mint.key(),
            token_bump: 0,
            amount: amount,
            remaining_amount: amount,
            offset_amount: 0,
            price_per_token: price_per_token,
            carbon_pay_fee: carbon_pay_fee,
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
        
        msg!("Project initialized successfully with {} tokens at price {}", amount, price_per_token);
        Ok(())
    }
}