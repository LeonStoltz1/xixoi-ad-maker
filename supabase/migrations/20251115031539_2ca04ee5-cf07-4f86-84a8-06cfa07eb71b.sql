-- Add structured contact and CTA fields to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS primary_goal text CHECK (primary_goal IN ('website', 'calls', 'email', 'messages', 'lead_form')),
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS landing_url text;

-- Add comment explaining the fields
COMMENT ON COLUMN campaigns.primary_goal IS 'Primary campaign call-to-action goal: website, calls, email, messages, or lead_form';
COMMENT ON COLUMN campaigns.contact_phone IS 'Phone number for call-now CTAs (with country code)';
COMMENT ON COLUMN campaigns.contact_email IS 'Email address for email CTAs';
COMMENT ON COLUMN campaigns.landing_url IS 'Landing page URL for website CTAs';