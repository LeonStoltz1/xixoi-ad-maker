-- Phase 1B: Database Migration for Master Account Architecture
-- Rename ad_accounts to platform_credentials and restructure for system-owned credentials

-- 1. Rename the table
ALTER TABLE ad_accounts RENAME TO platform_credentials;

-- 2. Add new columns for owner model
ALTER TABLE platform_credentials
ADD COLUMN IF NOT EXISTS owner_type text DEFAULT 'system' CHECK (owner_type IN ('system', 'user')),
ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 3. Add unique constraint for system credentials (one per platform)
ALTER TABLE platform_credentials
ADD CONSTRAINT unique_system_platform 
UNIQUE (platform, owner_type);

-- 4. Create index for fast system credential lookups
CREATE INDEX IF NOT EXISTS idx_platform_system
ON platform_credentials (platform)
WHERE owner_type = 'system';

-- 5. Update status column default if needed
ALTER TABLE platform_credentials
ALTER COLUMN status SET DEFAULT 'connected';

-- 6. Clean existing user credentials (remove all non-system accounts)
DELETE FROM platform_credentials
WHERE owner_type IS DISTINCT FROM 'system';

-- 7. Enable RLS (blocks anon/authenticated users, service_role bypasses RLS)
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- 8. Drop old user-based policies
DROP POLICY IF EXISTS "Users can view own ad accounts" ON platform_credentials;
DROP POLICY IF EXISTS "Users can insert own ad accounts" ON platform_credentials;
DROP POLICY IF EXISTS "Users can update own ad accounts" ON platform_credentials;
DROP POLICY IF EXISTS "Users can delete own ad accounts" ON platform_credentials;

-- Note: No new policies needed - service_role bypasses RLS
-- RLS being enabled simply blocks anon/authenticated access
-- Edge functions using service_role key will have full access