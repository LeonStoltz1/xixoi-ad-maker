-- Add AI targeting columns to campaigns (if not exists)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS audience_suggestion JSONB,
ADD COLUMN IF NOT EXISTS auto_targeted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detected_product_type TEXT,
ADD COLUMN IF NOT EXISTS suggested_daily_budget NUMERIC;

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  payout_method TEXT DEFAULT 'stripe',
  payout_email TEXT,
  total_earned NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates (id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_payment_at TIMESTAMP WITH TIME ZONE,
  total_revenue NUMERIC DEFAULT 0,
  affiliate_earnings NUMERIC DEFAULT 0,
  stripe_customer_id TEXT,
  notes TEXT
);

-- Create affiliate_payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates (id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  method TEXT,
  transaction_id TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT
);

-- Enable RLS on affiliates
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own data
CREATE POLICY "Users can view own affiliate data"
ON affiliates FOR SELECT
USING (auth.uid() = user_id);

-- Affiliates can update their own data
CREATE POLICY "Users can update own affiliate data"
ON affiliates FOR UPDATE
USING (auth.uid() = user_id);

-- Affiliates can insert their own data
CREATE POLICY "Users can insert own affiliate data"
ON affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on affiliate_referrals
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their referrals
CREATE POLICY "Affiliates can view own referrals"
ON affiliate_referrals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM affiliates
  WHERE affiliates.id = affiliate_referrals.affiliate_id
  AND affiliates.user_id = auth.uid()
));

-- Enable RLS on affiliate_payouts
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their payouts
CREATE POLICY "Affiliates can view own payouts"
ON affiliate_payouts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM affiliates
  WHERE affiliates.id = affiliate_payouts.affiliate_id
  AND affiliates.user_id = auth.uid()
));

-- Affiliates can request payouts
CREATE POLICY "Affiliates can request payouts"
ON affiliate_payouts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM affiliates
  WHERE affiliates.id = affiliate_payouts.affiliate_id
  AND affiliates.user_id = auth.uid()
));