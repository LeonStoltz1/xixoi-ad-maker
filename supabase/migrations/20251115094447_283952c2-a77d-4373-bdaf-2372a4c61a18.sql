-- Add political tier fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS political_tier BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS political_ads_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS political_ads_limit INTEGER DEFAULT 100;

-- Create political candidates table
CREATE TABLE IF NOT EXISTS political_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT NOT NULL,
  party TEXT,
  race TEXT, -- "US Senate - Texas"
  election_year INTEGER,
  website TEXT,
  fec_id TEXT,
  address TEXT,
  office_sought TEXT,
  id_document_front_url TEXT,
  id_document_back_url TEXT,
  selfie_url TEXT,
  wallet_address TEXT,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE political_candidates ENABLE ROW LEVEL SECURITY;

-- RLS policies for political_candidates
CREATE POLICY "Users can view own candidate profiles"
  ON political_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own candidate profile"
  ON political_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidate profile"
  ON political_candidates FOR UPDATE
  USING (auth.uid() = user_id);

-- Create political ads table
CREATE TABLE IF NOT EXISTS political_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  candidate_id UUID REFERENCES political_candidates,
  campaign_id UUID REFERENCES campaigns,
  ad_copy TEXT NOT NULL,
  image_url TEXT,
  platform TEXT NOT NULL,
  watermark_url TEXT,
  signature_base58 TEXT,
  policy_focus TEXT,
  tone TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  compliance_checked BOOLEAN DEFAULT false,
  compliance_issues JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE political_ads ENABLE ROW LEVEL SECURITY;

-- RLS policies for political_ads
CREATE POLICY "Users can view own political ads"
  ON political_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create political ads"
  ON political_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own political ads"
  ON political_ads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own political ads"
  ON political_ads FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view verified ads for verification portal
CREATE POLICY "Public can view published political ads"
  ON political_ads FOR SELECT
  USING (published = true AND compliance_checked = true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_political_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER political_candidates_updated_at
  BEFORE UPDATE ON political_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_political_updated_at();

CREATE TRIGGER political_ads_updated_at
  BEFORE UPDATE ON political_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_political_updated_at();