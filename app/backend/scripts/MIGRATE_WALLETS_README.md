# Wallet Migration Script

## Purpose

This script recreates user wallets with proper server-side encryption. It's needed when:
- Wallets were created with user passwords (which the server can't access)
- Wallets were encrypted with old/unknown passwords
- You need to ensure all wallets use the server master key for decryption

## How It Works

1. **Finds all users** in the database
2. **Attempts to decrypt** each user's wallet using the server master key
3. **If decryption fails**, recreates the wallet with proper encryption:
   - Generates a new Solana keypair
   - Encrypts it with the server master key (derived from `JWT_SECRET` or `SERVER_WALLET_MASTER_KEY`)
   - Updates the database with the new encrypted wallet
4. **If decryption succeeds**, skips that wallet (no changes needed)

## Usage

```bash
# From the backend directory
npm run migrate:wallets

# Or directly with ts-node
ts-node scripts/migrate-wallets.ts
```

## Important Notes

⚠️ **WARNING**: This script will change user wallet addresses if it recreates wallets. 

- **Old wallet addresses will no longer be valid**
- **Any on-chain assets in old wallets will be lost** (unless you have the old private keys)
- **This should only be run in development or when setting up a fresh system**

## When to Run

- ✅ **Development/Testing**: Safe to run anytime
- ✅ **Fresh Setup**: Run after seeding initial users
- ⚠️ **Production**: Only run if you understand the implications and have backups
- ❌ **After users have on-chain assets**: Do NOT run unless you have a migration plan

## Output

The script will show:
- Which wallets were migrated (recreated)
- Which wallets were skipped (already valid)
- Any errors encountered
- A summary at the end

Example output:
```
Starting wallet migration...
Database connection established
Found 3 users
  [admin@test.com] ✗ Wallet decryption failed, recreating...
  [admin@test.com] ✓ Wallet recreated: OldKey... -> NewKey...
  [user@test.com] ✓ Wallet decrypts successfully, skipping
  [newuser@test.com] No wallet found, creating new one...
  [newuser@test.com] ✓ Wallet created

=== Migration Summary ===
Total users: 3
Migrated: 2
Skipped (already valid): 1
Errors: 0

✓ All wallets migrated successfully!
```

## Environment Variables

The script uses the same environment variables as the main application:
- `JWT_SECRET`: Used to derive the server master password (default: "your-secret-key")
- `SERVER_WALLET_MASTER_KEY`: Optional, if set, used instead of JWT_SECRET

The master password is derived as: `${SERVER_WALLET_MASTER_KEY || JWT_SECRET}-${userId}`

