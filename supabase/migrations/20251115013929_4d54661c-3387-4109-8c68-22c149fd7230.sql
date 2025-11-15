-- Add campaign status tracking and payment monitoring
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paused_reason TEXT,
ADD COLUMN IF NOT EXISTS last_payment_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_failures INTEGER DEFAULT 0;

-- Create table to track platform campaign status
CREATE TABLE IF NOT EXISTS campaign_platform_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_campaign_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, platform)
);

-- Enable RLS
ALTER TABLE campaign_platform_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own campaign platform status"
ON campaign_platform_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_platform_status.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own campaign platform status"
ON campaign_platform_status FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_platform_status.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

-- Add payment failure tracking to ad_budget_reloads
ALTER TABLE ad_budget_reloads
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_platform_status_campaign ON campaign_platform_status(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_budget_reloads_status ON ad_budget_reloads(user_id, payment_status);