-- Create campaign performance metrics table
CREATE TABLE IF NOT EXISTS public.campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'linkedin')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0, -- Click-through rate percentage
  cpc NUMERIC(10,2) DEFAULT 0, -- Cost per click
  roas NUMERIC(10,2) DEFAULT 0, -- Return on ad spend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_demo BOOLEAN DEFAULT true, -- Flag to indicate if this is demo/simulated data
  UNIQUE(campaign_id, platform, date)
);

-- Enable RLS
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- Users can view performance for their own campaigns
CREATE POLICY "Users can view own campaign performance"
ON public.campaign_performance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_performance.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

-- Service role can manage all performance data
CREATE POLICY "Service role can manage performance data"
ON public.campaign_performance
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_campaign_performance_campaign_date 
ON public.campaign_performance(campaign_id, date DESC);

CREATE INDEX idx_campaign_performance_platform 
ON public.campaign_performance(platform);

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_performance_updated_at
BEFORE UPDATE ON public.campaign_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();