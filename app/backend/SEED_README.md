# CarbonPay Database Seeding

This directory contains scripts to seed the CarbonPay database with initial data for development and testing.

## Scripts

### `seed.sh` - Main Seeding Script

Seeds the database with:
- **Admin user** with full privileges
- **Regular user** for testing purchases
- **3 Carbon Credit Projects** (Amazon, Atlantic Forest, Solar Energy)

All users are created via the API so their Solana keypairs are properly generated.

### `reset-db.sql` - Database Reset Script

Truncates all tables while preserving the schema. Useful for starting fresh.

## Quick Start

### 1. Reset Database (Optional)

To clear all data and start fresh:

```bash
# Run from the backend directory
docker exec carbonpay-postgres psql -U carbonpay -d carbonpay -f /path/to/reset-db.sql

# Or if the file is mounted:
docker exec -i carbonpay-postgres psql -U carbonpay -d carbonpay < reset-db.sql
```

### 2. Run Seed Script

Make sure the backend server is running first:

```bash
npm run dev
```

Then in another terminal, run the seed script:

```bash
./seed.sh
```

## Default Credentials

### Admin Account
- **Email:** `admin@carbonpay.eco`
- **Password:** `Admin123!`
- **Role:** admin
- **Company:** CarbonPay Platform

### Test User Account
- **Email:** `user@test.com`
- **Password:** `User123!`
- **Role:** user
- **Company:** Test Company Ltda

## Custom Configuration

You can customize the seed data by setting environment variables:

```bash
# Custom API URL
API_URL=http://localhost:4000/api ./seed.sh

# Custom admin credentials
ADMIN_EMAIL=myadmin@company.com ADMIN_PASSWORD=MyPassword123! ./seed.sh

# Custom user credentials
USER_EMAIL=testuser@company.com USER_PASSWORD=TestPass123! ./seed.sh
```

## Created Projects

The seed script creates 3 tokenized carbon credit projects:

### 1. Amazon Rainforest Conservation Project
- **Location:** Pará, Brazil
- **Standard:** Verra VCS
- **Reference ID:** VCS-2024-001
- **Total Credits:** 50,000 tons
- **Price:** $25.00/ton
- **Type:** REDD+ (Avoided Deforestation)

### 2. Atlantic Forest Restoration Initiative
- **Location:** São Paulo, Brazil
- **Standard:** Verra VCS
- **Reference ID:** VCS-2024-002
- **Total Credits:** 30,000 tons
- **Price:** $30.00/ton
- **Type:** Afforestation and Reforestation

### 3. São Carlos Solar Energy Project
- **Location:** São Carlos, Brazil
- **Standard:** Gold Standard
- **Reference ID:** GS-2024-001
- **Total Credits:** 20,000 tons
- **Price:** $35.00/ton
- **Type:** Renewable Energy

## Troubleshooting

### "Connection refused" error

Make sure:
1. Backend server is running (`npm run dev`)
2. PostgreSQL database is running (`docker ps | grep postgres`)
3. API_URL is correct (default: `http://localhost:3000/api`)

### "User already exists" error

Either:
- Run the reset script first to clear existing data
- Use different email addresses via environment variables

### Token issues

If you see authentication errors:
1. Check that the `/user/login` endpoint is working
2. Verify the credentials match what you're using
3. Try registering and logging in manually first

## Manual Testing Flow

After seeding:

1. **Login as user** (`user@test.com`)
2. **Browse projects** on the dashboard
3. **Purchase credits** from any project
4. **View purchase history** in Assets page
5. **Retire credits** to offset emissions
6. **Login as admin** (`admin@carbonpay.eco`) to:
   - View all users and organizations
   - Create new projects
   - Manage the platform

## Database Schema

The database uses TypeORM with the following main entities:

- `users` - User accounts
- `user_wallets` - Solana wallets for users
- `organizations` - Company/organization data
- `tokenized_projects` - Carbon credit projects
- `purchases` - Credit purchase transactions
- `retirements` - Credit retirement records
- `audit_logs` - System audit trail

## Notes

- All users get Solana keypairs automatically created via `WalletService`
- Projects are marked as `OFFLINE` initially (not yet minted on-chain)
- Prices are stored in cents (e.g., 2500 = $25.00)
- All dates are in UTC
- UUIDs are used for all primary keys
