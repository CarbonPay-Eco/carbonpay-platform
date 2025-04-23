use anchor_lang::prelude::*;

/// CarbonCredits tracks the global metrics of all carbon credits across all projects in the platform.
/// This serves as a central dashboard for platform-wide statistics and does not replace
/// the individual tracking of credits within each Project.

#[account]
pub struct CarbonCredits {
    pub authority: Pubkey,      // The admin/authority of the CarbonPay platform
    pub total_credits: u64,     // Sum of all credits ever issued across all projects
    pub active_credits: u64, // Sum of all credits that are currently active (not offset) across all projects
    pub offset_credits: u64, // Sum of all credits that have been offset/retired across all projects
    pub projects_count: u64, // Total number of projects created on the platform
    pub total_fees_earned: u64, // Total fees earned by the platform from all projects
    pub bump: u8,            // The PDA bump
}

impl CarbonCredits {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const INIT_SPACE: usize = 32 + // authority: Pubkey
        8 +  // total_credits: u64
        8 +  // active_credits: u64
        8 +  // offset_credits: u64
        8 +  // projects_count: u64
        8 +  // total_fees_earned: u64
        1; // bump: u8

    /// Initialize the global platform dashboard
    pub fn initialize(&mut self, authority: Pubkey, bump: u8) -> Result<()> {
        self.authority = authority;
        self.total_credits = 0;
        self.active_credits = 0;
        self.offset_credits = 0;
        self.projects_count = 0;
        self.total_fees_earned = 0;
        self.bump = bump;
        Ok(())
    }

    /// Add a new project's credits to the global tracking
    pub fn add_project_credits(&mut self, credits_amount: u64) -> Result<()> {
        // Update global counts when a new project is created
        self.total_credits = self
            .total_credits
            .checked_add(credits_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.active_credits = self
            .active_credits
            .checked_add(credits_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.projects_count = self
            .projects_count
            .checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }

    /// Record a carbon credit offset in the global tracking
    pub fn record_offset(&mut self, offset_amount: u64) -> Result<()> {
        // Update global counts when credits are offset
        self.active_credits = self
            .active_credits
            .checked_sub(offset_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.offset_credits = self
            .offset_credits
            .checked_add(offset_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }

    /// Add platform fees to the global tracking
    pub fn add_fees(&mut self, fee_amount: u64) -> Result<()> {
        // Track total fees earned by the platform
        self.total_fees_earned = self
            .total_fees_earned
            .checked_add(fee_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(())
    }
}
