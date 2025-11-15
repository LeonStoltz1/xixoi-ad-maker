-- Add media rights confirmation timestamp to campaigns table
ALTER TABLE campaigns ADD COLUMN media_rights_confirmed_at timestamp with time zone;

-- Add comment explaining the column
COMMENT ON COLUMN campaigns.media_rights_confirmed_at IS 'Timestamp when user confirmed they own the rights to use the uploaded media/content for advertising purposes. Required for legal compliance.';