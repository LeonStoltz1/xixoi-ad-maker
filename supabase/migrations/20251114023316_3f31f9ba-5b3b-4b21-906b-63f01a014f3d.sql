-- Create free_ads table for tracking invisible watermarks
CREATE TABLE IF NOT EXISTS public.free_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_variant_id UUID NOT NULL REFERENCES public.ad_variants(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  tampered BOOLEAN DEFAULT false,
  charged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_free_ads_user_variant ON public.free_ads(user_id, ad_variant_id);
CREATE INDEX IF NOT EXISTS idx_free_ads_fingerprint ON public.free_ads(fingerprint);

-- Enable RLS
ALTER TABLE public.free_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own free ads"
  ON public.free_ads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own free ads"
  ON public.free_ads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all free ads"
  ON public.free_ads
  FOR ALL
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_free_ads_updated_at
  BEFORE UPDATE ON public.free_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();