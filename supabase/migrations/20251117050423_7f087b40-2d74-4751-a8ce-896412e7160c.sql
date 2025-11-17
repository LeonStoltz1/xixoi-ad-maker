-- Add variant_set column to ad_variants table for A/B testing
ALTER TABLE ad_variants ADD COLUMN IF NOT EXISTS variant_set text DEFAULT 'A';

-- Add comment explaining the column
COMMENT ON COLUMN ad_variants.variant_set IS 'For A/B testing: identifies which test set this variant belongs to (A or B)';