-- Add account_name column to platform_credentials if it doesn't exist
-- This will store platform-specific metadata like Facebook Page ID for Meta

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_credentials' 
    AND column_name = 'account_name'
  ) THEN
    ALTER TABLE platform_credentials 
    ADD COLUMN account_name text;
  END IF;
END $$;

COMMENT ON COLUMN platform_credentials.account_name IS 'Platform-specific metadata: For Meta, stores Facebook Page ID';