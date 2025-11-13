-- Create table to track ad spend for billing
CREATE TABLE IF NOT EXISTS public.ad_spend_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'linkedin')),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  billed BOOLEAN NOT NULL DEFAULT false,
  stripe_invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_ad_spend_user_period ON public.ad_spend_tracking(user_id, billing_period_start, billing_period_end);
CREATE INDEX idx_ad_spend_billed ON public.ad_spend_tracking(billed, billing_period_end);
CREATE INDEX idx_ad_spend_campaign ON public.ad_spend_tracking(campaign_id);

-- Enable RLS
ALTER TABLE public.ad_spend_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ad spend"
  ON public.ad_spend_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad spend"
  ON public.ad_spend_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all ad spend records (for billing automation)
CREATE POLICY "Service role can manage all ad spend"
  ON public.ad_spend_tracking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ad_spend_tracking_updated_at
  BEFORE UPDATE ON public.ad_spend_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add monthly_ad_spend_limit to profiles for elite plan monitoring
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_ad_spend_limit NUMERIC(10, 2) DEFAULT NULL;

COMMENT ON TABLE public.ad_spend_tracking IS 'Tracks ad spend across platforms for billing purposes, especially for Scale Elite plan 5% fee';
COMMENT ON COLUMN public.profiles.monthly_ad_spend_limit IS 'Optional spending limit for Scale Elite users';