-- CarbonPay Database Reset Script
-- This script will truncate all tables (keeping schema intact)

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables (preserves structure, removes data)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE retirements CASCADE;
TRUNCATE TABLE tokenized_projects CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE user_wallets CASCADE;
TRUNCATE TABLE wallets CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Show confirmation
SELECT 'Database reset complete. All data cleared.' AS status;
