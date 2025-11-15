-- Phase 1: Campaign Budget & State Management Schema

-- 1. Add new columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS daily_budget numeric,
ADD COLUMN IF NOT EXISTS lifetime_budget numeric,
ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz,
ADD COLUMN IF NOT EXISTS status_reason text;

-- Update existing status column to have default if not set
ALTER TABLE campaigns 
ALTER COLUMN status SET DEFAULT 'draft';

-- 2. Create campaign_spend_daily table for tracking daily spend per platform
CREATE TABLE IF NOT EXISTS campaign_spend_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, date, platform)
);

-- 3. Create campaign_budget_events table for audit trail
CREATE TABLE IF NOT EXISTS campaign_budget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  old_daily_budget numeric,
  new_daily_budget numeric,
  old_lifetime_budget numeric,
  new_lifetime_budget numeric,
  old_status text,
  new_status text,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE campaign_spend_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_budget_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for campaign_spend_daily
CREATE POLICY "Users can view spend for own campaigns"
  ON campaign_spend_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_spend_daily.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage spend data"
  ON campaign_spend_daily FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. RLS policies for campaign_budget_events
CREATE POLICY "Users can view events for own campaigns"
  ON campaign_budget_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_budget_events.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for own campaigns"
  ON campaign_budget_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_budget_events.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_spend_daily_campaign_date 
  ON campaign_spend_daily(campaign_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_spend_daily_date 
  ON campaign_spend_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_budget_events_campaign 
  ON campaign_budget_events(campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_status 
  ON campaigns(status) WHERE status IN ('active', 'paused', 'scheduled');

-- 8. Trigger to update campaigns.total_spent when spend_daily changes
CREATE OR REPLACE FUNCTION update_campaign_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET total_spent = (
    SELECT COALESCE(SUM(spend), 0)
    FROM campaign_spend_daily
    WHERE campaign_id = NEW.campaign_id
  ),
  updated_at = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_total_spent
AFTER INSERT OR UPDATE ON campaign_spend_daily
FOR EACH ROW
EXECUTE FUNCTION update_campaign_total_spent();

-- 9. Enable realtime for campaign_spend_daily
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_spend_daily;