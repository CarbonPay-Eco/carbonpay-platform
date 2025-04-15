use anchor_lang::prelude::*; 

#[error_code]
pub enum ErrorCode {
    #[msg("Only the admin can mint credits")]
    UnauthorizedAdmin,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Math operation overflow")]
    MathOverflow,
}