-- =====================================================
-- XIXOI AFFILIATE ENGINE - COMPLETE DATABASE SCHEMA
-- =====================================================

-- 1. affiliate_tiers (tracks tier classification history)
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('inactive', 'light', 'active', 'power', 'super')),
  previous_tier TEXT,
  tier_changed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. affiliate_clicks (track all referral link clicks)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. affiliate_bonus_rewards (milestone cash bonuses)
CREATE TABLE IF NOT EXISTS affiliate_bonus_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('milestone', 'competition', 'special')),
  milestone_level INT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  earned_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. affiliate_leaderboard (monthly performance tracking)
CREATE TABLE IF NOT EXISTS affiliate_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rank INTEGER,
  total_conversions INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commissions NUMERIC DEFAULT 0,
  growth_percentage NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(affiliate_id, period_start)
);

-- 5. affiliate_onboarding_progress (track 7-day challenge)
CREATE TABLE IF NOT EXISTS affiliate_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(affiliate_id, day_number)
);

-- 6. affiliate_content_swipes (weekly content drops)
CREATE TABLE IF NOT EXISTS affiliate_content_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('hook', 'script', 'carousel', 'thumbnail', 'case_study')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  performance_score NUMERIC,
  anonymized_creator TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. super_affiliate_pages (custom landing pages)
CREATE TABLE IF NOT EXISTS super_affiliate_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE UNIQUE,
  custom_slug TEXT UNIQUE NOT NULL,
  page_title TEXT,
  hero_image_url TEXT,
  bio TEXT,
  social_links JSONB,
  custom_cta TEXT,
  discount_code TEXT,
  cookie_duration_days INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  conversions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Add new columns to existing affiliates table
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'inactive' CHECK (current_tier IN ('inactive', 'light', 'active', 'power', 'super'));
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS commission_duration_months INT DEFAULT 12;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS last_tier_check TIMESTAMPTZ DEFAULT now();
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS growth_rate NUMERIC DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS super_affiliate_eligible BOOLEAN DEFAULT false;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_bonus_rewards_affiliate_id ON affiliate_bonus_rewards(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_bonus_rewards_status ON affiliate_bonus_rewards(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_period ON affiliate_leaderboard(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_affiliate_leaderboard_rank ON affiliate_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_affiliates_current_tier ON affiliates(current_tier);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);

-- 10. Enable RLS on all new tables
ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_bonus_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_affiliate_pages ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies - Affiliates can view their own data
CREATE POLICY "Affiliates can view own tier history" ON affiliate_tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_tiers.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own clicks" ON affiliate_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_clicks.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own bonuses" ON affiliate_bonus_rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_bonus_rewards.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view leaderboard" ON affiliate_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Affiliates can view own onboarding" ON affiliate_onboarding_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_onboarding_progress.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view content swipes" ON affiliate_content_swipes
  FOR SELECT USING (true);

CREATE POLICY "Affiliates can view own super page" ON super_affiliate_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = super_affiliate_pages.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

-- 12. Service role policies for automation
CREATE POLICY "Service role can manage all affiliate data" ON affiliate_tiers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage clicks" ON affiliate_clicks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage bonuses" ON affiliate_bonus_rewards
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage leaderboard" ON affiliate_leaderboard
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage onboarding" ON affiliate_onboarding_progress
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage swipes" ON affiliate_content_swipes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage super pages" ON super_affiliate_pages
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Helper function: Calculate affiliate tier
CREATE OR REPLACE FUNCTION calculate_affiliate_tier(
  conversions INT,
  monthly_rev NUMERIC
)
RETURNS TEXT AS $$
BEGIN
  IF conversions >= 100 OR monthly_rev >= 3000 THEN
    RETURN 'super';
  ELSIF conversions >= 26 THEN
    RETURN 'power';
  ELSIF conversions >= 6 THEN
    RETURN 'active';
  ELSIF conversions >= 1 THEN
    RETURN 'light';
  ELSE
    RETURN 'inactive';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 14. Helper function: Check milestone eligibility
CREATE OR REPLACE FUNCTION check_milestone_eligibility(
  affiliate_id_param UUID,
  conversions INT
)
RETURNS TABLE(milestone_level INT, reward_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    (20, 200::NUMERIC),
    (50, 500::NUMERIC),
    (100, 1000::NUMERIC),
    (500, 5000::NUMERIC),
    (1000, 10000::NUMERIC)
  ) AS milestones(level, amount)
  WHERE conversions >= milestones.level
  AND NOT EXISTS (
    SELECT 1 FROM affiliate_bonus_rewards
    WHERE affiliate_id = affiliate_id_param
    AND milestone_level = milestones.level
    AND reward_type = 'milestone'
  )
  ORDER BY milestones.level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- 15. Trigger: Update affiliate tier on referral changes
CREATE OR REPLACE FUNCTION update_affiliate_tier_on_referral()
RETURNS TRIGGER AS $$
DECLARE
  aff_record RECORD;
  new_tier TEXT;
BEGIN
  -- Get affiliate stats
  SELECT 
    a.id,
    a.current_tier,
    COUNT(ar.id) as total_conversions,
    SUM(ar.total_paid) as monthly_revenue
  INTO aff_record
  FROM affiliates a
  LEFT JOIN affiliate_referrals ar ON ar.affiliate_id = a.id
  WHERE a.id = NEW.affiliate_id
  GROUP BY a.id, a.current_tier;
  
  -- Calculate new tier
  new_tier := calculate_affiliate_tier(
    COALESCE(aff_record.total_conversions, 0),
    COALESCE(aff_record.monthly_revenue, 0)
  );
  
  -- Update if tier changed
  IF new_tier != aff_record.current_tier THEN
    UPDATE affiliates
    SET 
      current_tier = new_tier,
      last_tier_check = now(),
      super_affiliate_eligible = (new_tier = 'super')
    WHERE id = aff_record.id;
    
    -- Log tier change
    INSERT INTO affiliate_tiers (affiliate_id, tier, previous_tier)
    VALUES (aff_record.id, new_tier, aff_record.current_tier);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_affiliate_tier
  AFTER INSERT OR UPDATE ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_tier_on_referral();

-- 16. Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_leaderboard;