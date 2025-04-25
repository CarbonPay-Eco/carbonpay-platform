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
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Only the admin can mint credits")]
    UnauthorizedAdmin,
    
    #[msg("Project is inactive")]
    ProjectInactive,
    
    #[msg("Invalid project owner")]
    InvalidProjectOwner,
    
    #[msg("Invalid Carbon Pay authority")]
    InvalidCarbonPayAuthority,
    
    #[msg("Invalid project mint")]
    InvalidProjectMint,
    
    #[msg("Invalid NFT mint")]
    InvalidNFTMint,
    
    #[msg("Invalid NFT account")]
    InvalidNFTAccount,
    
    #[msg("Insufficient tokens available")]
    InsufficientTokens,
    
    #[msg("Insufficient remaining tokens for offset")]
    InsufficientRemainingTokens,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("The amount must be greater than 0")]
    InvalidAmount,
    
    #[msg("Only the purchase owner can request an offset")]
    NotPurchaseOwner,
    
    #[msg("Invalid request status")]
    InvalidRequestStatus,
    
    #[msg("Offset request already processed")]
    RequestAlreadyProcessed,
    
    #[msg("Invalid offset request")]
    InvalidOffsetRequest,
    
    #[msg("Invalid project for this purchase")]
    InvalidProject,
    
    #[msg("Offset request already exists")]
    OffsetRequestExists,
    
    #[msg("Math operation overflow")]
    MathOverflow,
    
    #[msg("Insufficient fungible tokens in account")]
    InsufficientFungibleTokens,
}
