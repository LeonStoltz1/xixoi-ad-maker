-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite', 'agency')),
  credits INT DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'published', 'paused')),
  has_watermark BOOLEAN DEFAULT true,
  target_location TEXT,
  target_audience TEXT,
  daily_budget DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Create campaign_assets table (uploaded files)
CREATE TABLE public.campaign_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'text')),
  asset_url TEXT,
  asset_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on campaign_assets
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

-- Campaign assets policies
CREATE POLICY "Users can view assets for own campaigns"
  ON public.campaign_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_assets.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets for own campaigns"
  ON public.campaign_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_assets.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create ad_variants table (AI-generated ads)
CREATE TABLE public.ad_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL CHECK (variant_type IN ('static', 'video', 'ugc', 'roas_prediction')),
  headline TEXT,
  body_copy TEXT,
  cta_text TEXT,
  creative_url TEXT,
  predicted_roas DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ad_variants
ALTER TABLE public.ad_variants ENABLE ROW LEVEL SECURITY;

-- Ad variants policies
CREATE POLICY "Users can view variants for own campaigns"
  ON public.ad_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = ad_variants.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create variants for own campaigns"
  ON public.ad_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = ad_variants.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create campaign_channels table (selected publishing channels)
CREATE TABLE public.campaign_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('meta', 'tiktok', 'google', 'linkedin')),
  is_connected BOOLEAN DEFAULT false,
  channel_campaign_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, channel)
);

-- Enable RLS on campaign_channels
ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;

-- Campaign channels policies
CREATE POLICY "Users can view channels for own campaigns"
  ON public.campaign_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage channels for own campaigns"
  ON public.campaign_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create storage buckets for campaign assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-assets', 'campaign-assets', false);

-- Storage policies for campaign assets
CREATE POLICY "Users can upload their own campaign assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own campaign assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'campaign-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own campaign assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'campaign-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own campaign assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();