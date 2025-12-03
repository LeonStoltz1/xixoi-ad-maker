-- Phase 10: Profit Engine Tables

-- 1. Product Profitability Table
CREATE TABLE public.product_profitability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_of_goods NUMERIC(10,2) NOT NULL DEFAULT 0,
  margin NUMERIC(10,2) GENERATED ALWAYS AS (base_price - cost_of_goods) STORED,
  margin_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN base_price > 0 THEN ((base_price - cost_of_goods) / base_price) * 100 ELSE 0 END
  ) STORED,
  pricing_strategy TEXT DEFAULT 'standard',
  elasticity_coefficient NUMERIC(6,4),
  min_viable_price NUMERIC(10,2),
  max_tested_price NUMERIC(10,2),
  optimal_price NUMERIC(10,2),
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 2. Profit Logs Table
CREATE TABLE public.profit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  product_id TEXT,
  event_type TEXT NOT NULL,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  margin_before NUMERIC(10,2),
  margin_after NUMERIC(10,2),
  revenue_impact NUMERIC(10,2),
  profit_impact NUMERIC(10,2),
  decision_rationale TEXT,
  confidence NUMERIC(4,2),
  auto_executed BOOLEAN DEFAULT false,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Elasticity Tests Table
CREATE TABLE public.elasticity_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  test_price NUMERIC(10,2) NOT NULL,
  baseline_price NUMERIC(10,2) NOT NULL,
  baseline_conversion_rate NUMERIC(6,4),
  test_conversion_rate NUMERIC(6,4),
  price_change_percent NUMERIC(6,2),
  demand_change_percent NUMERIC(6,2),
  calculated_elasticity NUMERIC(6,4),
  test_duration_hours INTEGER DEFAULT 24,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elasticity_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_profitability
CREATE POLICY "Users can view own product profitability"
  ON public.product_profitability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product profitability"
  ON public.product_profitability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product profitability"
  ON public.product_profitability FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own product profitability"
  ON public.product_profitability FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all product profitability"
  ON public.product_profitability FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for profit_logs
CREATE POLICY "Users can view own profit logs"
  ON public.profit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profit logs"
  ON public.profit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for elasticity_tests
CREATE POLICY "Users can view own elasticity tests"
  ON public.elasticity_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own elasticity tests"
  ON public.elasticity_tests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all elasticity tests"
  ON public.elasticity_tests FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_product_profitability_user ON public.product_profitability(user_id);
CREATE INDEX idx_profit_logs_user ON public.profit_logs(user_id);
CREATE INDEX idx_profit_logs_campaign ON public.profit_logs(campaign_id);
CREATE INDEX idx_profit_logs_event_type ON public.profit_logs(event_type);
CREATE INDEX idx_elasticity_tests_user_product ON public.elasticity_tests(user_id, product_id);

-- Updated at trigger
CREATE TRIGGER update_product_profitability_updated_at
  BEFORE UPDATE ON public.product_profitability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();