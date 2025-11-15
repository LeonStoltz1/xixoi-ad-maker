-- Add realtor-specific fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_realtor BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS realtor_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brokerage_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS realtor_license_state TEXT;

-- Add optional real estate mode to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS real_estate_mode BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS property_details JSONB;

-- Create index for faster realtor queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_realtor ON profiles(is_realtor) WHERE is_realtor = true;