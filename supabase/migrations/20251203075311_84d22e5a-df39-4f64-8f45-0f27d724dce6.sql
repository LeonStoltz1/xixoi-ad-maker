-- Create payment_economics table to track real Stripe fees
CREATE TABLE public.payment_economics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  gross_amount_usd NUMERIC(10,2) NOT NULL,
  stripe_fees_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_revenue_usd NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'one_time', 'refund', 'chargeback', 'ad_budget')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_economics ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own rows
CREATE POLICY "Users can view own payment economics"
  ON public.payment_economics FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Service role has full access
CREATE POLICY "Service role can manage payment economics"
  ON public.payment_economics FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for efficient queries
CREATE INDEX idx_payment_economics_user_id ON public.payment_economics(user_id);
CREATE INDEX idx_payment_economics_stripe_customer_id ON public.payment_economics(stripe_customer_id);
CREATE INDEX idx_payment_economics_created_at ON public.payment_economics(created_at);
CREATE INDEX idx_payment_economics_type ON public.payment_economics(type);

-- Add fallback Stripe fee configs to config_system_costs
INSERT INTO config_system_costs (key, value, description) VALUES
  ('stripe_fallback_fee_percentage', 0.029, 'Fallback Stripe fee percentage (2.9%)'),
  ('stripe_fallback_fee_fixed_cents', 30, 'Fallback Stripe fixed fee in cents ($0.30)'),
  ('stripe_dispute_fee_usd', 15.00, 'Stripe dispute/chargeback fee in USD')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();