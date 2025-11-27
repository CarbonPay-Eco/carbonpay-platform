# USDC Mint Constant Setup

## Overview

The CarbonPay program uses a compile-time constant for the USDC mint address to prevent using incorrect mints. This ensures security and prevents accidental use of wrong token addresses.

## Setting the USDC Mint

### Step 1: Create or Get Your USDC Mint Address

**For Devnet:**
```bash
cd platform/app/backend
npm run create:devnet-usdc
```
This will output a mint address like: `ABC123...xyz`

**For Mainnet:**
Use the official USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

### Step 2: Update the Constant

Edit `platform/programs/carbon_pay/src/constants.rs`:

```rust
// For devnet (replace with your mint address):
pub const USDC_MINT: Pubkey = pubkey!("YourDevnetMintAddressHere1111111111111111111");

// OR for mainnet:
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
```

### Step 3: Rebuild and Deploy

```bash
cd platform
anchor build
anchor deploy --provider.cluster devnet  # or mainnet-beta
```

### Step 4: Update Backend .env

After deployment, ensure your backend `.env` matches:

```env
SOLANA_USDC_MINT=<same_address_as_in_constants.rs>
```

## Important Notes

- ⚠️ **The constant in the program MUST match the address in your backend `.env`**
- ⚠️ **If you change the constant, you MUST rebuild and redeploy the program**
- ⚠️ **The program will reject any USDC mint that doesn't match the constant**
- ✅ **This prevents accidental use of wrong mints and enhances security**

## Validation

The program validates the USDC mint in two places:

1. **`initialize_carbon_credits`**: Validates the passed mint matches the constant
2. **`purchase_carbon_credits`**: Validates the mint matches both the constant AND the state

This double validation ensures:
- The mint is correct at initialization
- The mint remains correct for all future transactions
- No one can pass a malicious mint address

