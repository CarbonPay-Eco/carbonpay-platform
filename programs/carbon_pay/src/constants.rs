use anchor_lang::prelude::*;

/// USDC mint address constant
/// This is set at compile time to prevent using incorrect mint addresses
/// 
/// For devnet: Use the mint created via `npm run create:devnet-usdc`
/// For mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
/// 
/// To change this, update the constant and rebuild the program
pub const USDC_MINT: Pubkey = pubkey!("4vJggTDpyoSjTqhNCY2xLNW4fHdczKZA5x3ZDrmAzzbP");

