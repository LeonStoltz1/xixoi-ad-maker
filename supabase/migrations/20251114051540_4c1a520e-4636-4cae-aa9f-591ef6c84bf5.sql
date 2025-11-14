-- Payouts tracking table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  affiliate NUMERIC(10,2) DEFAULT 0,
  agency NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  net NUMERIC(10,2) DEFAULT 0,
  subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Admin can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_payouts_month ON payouts(month);
CREATE INDEX idx_payouts_subscription ON payouts(subscription_id);