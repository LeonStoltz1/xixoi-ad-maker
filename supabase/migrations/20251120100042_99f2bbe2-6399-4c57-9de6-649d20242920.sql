-- Add meta_sub_platforms column to campaigns table to store Facebook/Instagram selection
-- This is CRITICAL for fund management - we must not run ads on platforms users unchecked

ALTER TABLE campaigns
ADD COLUMN meta_sub_platforms jsonb DEFAULT '{"facebook": true, "instagram": true}'::jsonb;

COMMENT ON COLUMN campaigns.meta_sub_platforms IS 'Stores which Meta sub-platforms (Facebook, Instagram) the user selected for this campaign. CRITICAL: Must be enforced in publish-meta to avoid mismanaging user funds.';