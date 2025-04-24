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
    #[msg("The amount must be greater than 0")]
    InvalidAmount,

    #[msg("Insufficient tokens available")]
    InsufficientTokens,

    #[msg("Project is not active")]
    ProjectInactive,

    #[msg("Invalid project owner")]
    InvalidProjectOwner,

    #[msg("Invalid project mint")]
    InvalidProjectMint,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Invalid CarbonPay authority")]
    InvalidCarbonPayAuthority,

    #[msg("Only the purchase owner can request an offset")]
    NotPurchaseOwner,

    #[msg("Insufficient remaining tokens in the purchase")]
    InsufficientRemainingTokens,

    #[msg("Invalid project for this purchase")]
    InvalidProject,

    #[msg("NFT account must hold at least one token")]
    InvalidNFTAccount,

    #[msg("Invalid NFT mint")]
    InvalidNFTMint,

    #[msg("Offset request already exists")]
    OffsetRequestExists,

    #[msg("Invalid offset request status")]
    InvalidRequestStatus,
}
