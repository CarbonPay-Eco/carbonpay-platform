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
    pub const INIT_SPACE: usize = 32 + // offset_requester
        32 + // purchase
        32 + // project
        8 + // amount
        4 + 64 + // request_id (prefix + max length)
        1 + // status enum
        8 + // request_date
        8 + // processed_date
        1 + // request_bump
        1 + 32; // processor (Option<Pubkey>)
}
