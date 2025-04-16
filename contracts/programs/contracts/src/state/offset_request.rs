use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Pending,
    Approved,
    Rejected,
}

#[account]
pub struct OffsetRequest {
    pub offset_requester: Pubkey,   // Buyer requesting the offset
    pub purchase: Pubkey,          // The purchase account this request is for
    pub project: Pubkey,           // The project this purchase belongs to
    pub amount: u64,               // Amount of tokens to offset
    pub request_id: String,        // Unique identifier for this request
    pub status: RequestStatus,     // Status of the request (pending/approved/rejected)
    pub request_date: i64,         // When the request was created
    pub processed_date: i64,       // When the request was processed (approved/rejected)
    pub request_bump: u8,          // Bump for the PDA
    pub processor: Option<Pubkey>, // Authority who processed the request
}

impl OffsetRequest {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const PUBKEY_SIZE: usize = 32;
    pub const BUMP_SIZE: usize = 1;
    pub const U64_SIZE: usize = 8;
    pub const I64_SIZE: usize = 8;
    pub const U8_SIZE: usize = 1;
    pub const OPTION_SIZE: usize = 1;
    pub const REQUEST_ID_MAX_LEN: usize = 64;
    pub const STRING_PREFIX_SIZE: usize = 4; // For string length prefix
    pub const ENUM_SIZE: usize = 1; // Enum is u8 under the hood

    pub const INIT_SPACE: usize = Self::PUBKEY_SIZE +       // offset_requester
        Self::PUBKEY_SIZE +       // purchase
        Self::PUBKEY_SIZE +       // project
        Self::U64_SIZE +          // amount
        Self::STRING_PREFIX_SIZE + Self::REQUEST_ID_MAX_LEN + // request_id
        Self::ENUM_SIZE +         // status
        Self::I64_SIZE +          // request_date
        Self::I64_SIZE +          // processed_date
        Self::BUMP_SIZE +         // request_bump
        Self::OPTION_SIZE + Self::PUBKEY_SIZE; // processor (Option<Pubkey>)
}
