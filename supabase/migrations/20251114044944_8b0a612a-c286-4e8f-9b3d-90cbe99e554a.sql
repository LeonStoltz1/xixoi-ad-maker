-- OAuth and Ad Publishing Infrastructure

-- Create ad_accounts table for storing encrypted OAuth tokens
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'linkedin')),
  platform_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, platform, platform_account_id)
);

-- Add RLS policies for ad_accounts
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad accounts"
  ON ad_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad accounts"
  ON ad_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad accounts"
  ON ad_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ad accounts"
  ON ad_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user ON ad_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_platform ON ad_accounts (user_id, platform);

-- Add trigger for updated_at
CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();