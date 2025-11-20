-- Create affiliate_banners table to store generated banners
CREATE TABLE IF NOT EXISTS public.affiliate_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  size TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_banners ENABLE ROW LEVEL SECURITY;

-- Users can insert their own banners
CREATE POLICY "Users can insert own banners"
  ON public.affiliate_banners
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view banners (public gallery)
CREATE POLICY "Anyone can view banners"
  ON public.affiliate_banners
  FOR SELECT
  USING (true);

-- Admins can update banners (to mark as featured)
CREATE POLICY "Admins can update banners"
  ON public.affiliate_banners
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_affiliate_banners_featured ON public.affiliate_banners(is_featured, created_at DESC);
CREATE INDEX idx_affiliate_banners_size ON public.affiliate_banners(size, created_at DESC);