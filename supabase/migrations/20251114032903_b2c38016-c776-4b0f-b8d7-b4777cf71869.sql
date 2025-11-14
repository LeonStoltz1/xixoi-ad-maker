-- Add AI targeting columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS audience_suggestion JSONB,
ADD COLUMN IF NOT EXISTS auto_targeted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detected_product_type TEXT,
ADD COLUMN IF NOT EXISTS suggested_daily_budget NUMERIC;