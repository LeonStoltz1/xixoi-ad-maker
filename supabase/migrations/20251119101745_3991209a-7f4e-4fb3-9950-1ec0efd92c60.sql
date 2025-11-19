-- Add page_id column to platform_credentials for Meta Page ID storage
ALTER TABLE platform_credentials 
ADD COLUMN IF NOT EXISTS page_id TEXT;