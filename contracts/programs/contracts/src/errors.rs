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

#[error_code]
pub enum ContractError {
    #[msg("The project is inactive")]
    ProjectInactive,
    
    #[msg("Insufficient tokens available in the project")]
    InsufficientTokens,
    
    #[msg("Invalid project owner")]
    InvalidProjectOwner,
    
    #[msg("Invalid CarbonPay authority")]
    InvalidCarbonPayAuthority,
    
    #[msg("You are not the owner of this purchase")]
    NotPurchaseOwner,
    
    #[msg("Insufficient remaining tokens in the purchase")]
    InsufficientRemainingTokens,
    
    #[msg("Invalid project for this purchase")]
    InvalidProject,
    
    #[msg("Invalid NFT account")]
    InvalidNFTAccount,
    
    #[msg("Invalid NFT mint")]
    InvalidNFTMint,
}