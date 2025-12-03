-- Create config_system_costs table for platform cost tracking
CREATE TABLE public.config_system_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.config_system_costs ENABLE ROW LEVEL SECURITY;

-- Only service role can access (internal system table)
CREATE POLICY "Service role can manage system costs"
  ON public.config_system_costs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read costs (for UI display)
CREATE POLICY "Authenticated users can read system costs"
  ON public.config_system_costs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed initial cost values
INSERT INTO public.config_system_costs (key, value, description) VALUES
  ('gemini_cost_per_1k_tokens_usd', 0.00035, 'Cost per 1K tokens for Gemini 2.5 Flash'),
  ('meta_api_cost_per_call', 0.0001, 'Estimated cost per Meta API call'),
  ('tiktok_api_cost_per_call', 0.0001, 'Estimated cost per TikTok API call'),
  ('average_campaign_refresh_cost', 0.002, 'Average cost to refresh campaign data'),
  ('autopilot_loop_cost', 0.015, 'Cost per autopilot optimization loop'),
  ('profit_safety_loop_cost', 0.008, 'Cost per profit safety check'),
  ('conductor_execution_cost', 0.025, 'Cost per conductor execution'),
  ('creative_generation_cost', 0.05, 'Cost per creative generation'),
  ('price_test_cost', 0.02, 'Cost per price test execution'),
  ('max_llm_cost_per_user_per_month', 500, 'Maximum LLM cost allowed per user per month');

-- Create user_llm_usage table to track per-user costs
CREATE TABLE public.user_llm_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  llm_tokens_used BIGINT NOT NULL DEFAULT 0,
  llm_cost_usd NUMERIC NOT NULL DEFAULT 0,
  autopilot_loops INTEGER NOT NULL DEFAULT 0,
  conductor_executions INTEGER NOT NULL DEFAULT 0,
  creative_generations INTEGER NOT NULL DEFAULT 0,
  price_tests INTEGER NOT NULL DEFAULT 0,
  safety_checks INTEGER NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,
  total_infra_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_start)
);

-- Enable RLS
ALTER TABLE public.user_llm_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own LLM usage"
  ON public.user_llm_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage
CREATE POLICY "Service role can manage LLM usage"
  ON public.user_llm_usage
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for fast lookups
CREATE INDEX idx_user_llm_usage_user_month ON public.user_llm_usage(user_id, month_start);

-- Function to increment user LLM usage
CREATE OR REPLACE FUNCTION public.increment_user_llm_usage(
  p_user_id UUID,
  p_tokens BIGINT DEFAULT 0,
  p_cost NUMERIC DEFAULT 0,
  p_autopilot_loops INTEGER DEFAULT 0,
  p_conductor_executions INTEGER DEFAULT 0,
  p_creative_generations INTEGER DEFAULT 0,
  p_price_tests INTEGER DEFAULT 0,
  p_safety_checks INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0,
  p_infra_cost NUMERIC DEFAULT 0
)
RETURNS public.user_llm_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_llm_usage;
BEGIN
  INSERT INTO public.user_llm_usage (
    user_id, month_start, llm_tokens_used, llm_cost_usd,
    autopilot_loops, conductor_executions, creative_generations,
    price_tests, safety_checks, api_calls, total_infra_cost
  )
  VALUES (
    p_user_id, date_trunc('month', CURRENT_DATE)::date, p_tokens, p_cost,
    p_autopilot_loops, p_conductor_executions, p_creative_generations,
    p_price_tests, p_safety_checks, p_api_calls, p_infra_cost
  )
  ON CONFLICT (user_id, month_start)
  DO UPDATE SET
    llm_tokens_used = user_llm_usage.llm_tokens_used + p_tokens,
    llm_cost_usd = user_llm_usage.llm_cost_usd + p_cost,
    autopilot_loops = user_llm_usage.autopilot_loops + p_autopilot_loops,
    conductor_executions = user_llm_usage.conductor_executions + p_conductor_executions,
    creative_generations = user_llm_usage.creative_generations + p_creative_generations,
    price_tests = user_llm_usage.price_tests + p_price_tests,
    safety_checks = user_llm_usage.safety_checks + p_safety_checks,
    api_calls = user_llm_usage.api_calls + p_api_calls,
    total_infra_cost = user_llm_usage.total_infra_cost + p_infra_cost,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;