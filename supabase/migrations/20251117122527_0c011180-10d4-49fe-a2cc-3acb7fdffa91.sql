
-- Add X (Twitter) as a valid platform
ALTER TABLE platform_credentials 
DROP CONSTRAINT IF EXISTS ad_accounts_platform_check;

ALTER TABLE platform_credentials 
ADD CONSTRAINT platform_credentials_platform_check 
CHECK (platform = ANY (ARRAY['meta'::text, 'google'::text, 'tiktok'::text, 'linkedin'::text, 'x'::text]));

-- Insert X system credential placeholder
INSERT INTO public.platform_credentials (
  platform,
  platform_account_id,
  access_token,
  refresh_token,
  owner_type,
  owner_id,
  status,
  expires_at
) VALUES
  ('x', 'SYSTEM_X_ACCOUNT', 'PLACEHOLDER_TOKEN_TO_BE_REPLACED', NULL, 'system', NULL, 'pending', NULL)
ON CONFLICT (platform, owner_type) DO NOTHING;
