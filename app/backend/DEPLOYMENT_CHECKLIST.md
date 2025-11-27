# Deployment Checklist for CarbonPay Program

## Pre-Deployment Steps

### 1. Program ID Verification
- ✅ Program ID in `lib.rs`: `J8ngc3K1JjbJeVVZLhj1AB3SgsnNosppgHhBD9rdfg`
- ⚠️ **IMPORTANT**: After deploying, update `.env` with the actual deployed program ID
- The program ID in `lib.rs` is the one that will be used when you deploy

### 2. Environment Variables Setup

Before deploying, ensure your `.env` has:

```env
# Solana Network
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Program ID (update after deployment)
SOLANA_PROGRAM_ID=<your_deployed_program_id>

# USDC Mint (create using: npm run create:devnet-usdc)
SOLANA_USDC_MINT=<your_devnet_usdc_mint_address>

# Server Wallet (must be the mint authority for USDC)
SOLANA_SERVER_PRIVATE_KEY=<your_server_wallet_private_key>
```

### 3. USDC Mint Setup

1. **Create devnet USDC mint**:
   ```bash
   npm run create:devnet-usdc
   ```

2. **Update `.env`** with the mint address:
   ```env
   SOLANA_USDC_MINT=<mint_address_from_script>
   ```

3. **Verify server wallet is mint authority**:
   - The script will verify this automatically
   - If not, you'll need to set the server wallet as mint authority

### 4. Deploy Program

```bash
# From platform directory
anchor build
anchor deploy --provider.cluster devnet
```

After deployment:
- Copy the program ID from the deployment output
- Update `SOLANA_PROGRAM_ID` in `.env`
- Update `declare_id!()` in `lib.rs` if needed (usually Anchor handles this)

### 5. Initialize Carbon Credits PDA

The program will automatically initialize the carbon_credits PDA when creating the first project, but you can also initialize it manually if needed.

### 6. Mint USDC to Users

After deployment and USDC mint creation:

```bash
npm run mint:usdc-to-users 1000
```

This mints 1000 USDC to each user in the database.

## Program Architecture

The program is designed to:
- ✅ Accept any USDC mint as a parameter (passed from backend)
- ✅ Validate USDC mint has 6 decimals
- ✅ Store USDC mint address in carbon_credits state
- ✅ Use stored USDC mint for all future transactions

## Verification Steps

After deployment:

1. **Check program is deployed**:
   ```bash
   solana program show <program_id> --url devnet
   ```

2. **Verify USDC mint exists**:
   ```bash
   spl-token supply <usdc_mint_address> --url devnet
   ```

3. **Test project creation**:
   - Create a project through the frontend
   - Verify carbon_credits PDA is initialized
   - Check transaction on Solana Explorer

4. **Verify user balances**:
   - Check dashboard shows USDC balance
   - Verify balance matches on-chain

## Notes

- The program ID in `lib.rs` (`J8ngc3K1JjbJeVVZLhj1AB3SgsnNosppgHhBD9rdfg`) is the one that will be used
- If you need a different program ID, update `declare_id!()` before building
- The backend automatically passes the USDC mint from `SOLANA_USDC_MINT` env var
- All USDC operations use the mint stored in the carbon_credits PDA state

