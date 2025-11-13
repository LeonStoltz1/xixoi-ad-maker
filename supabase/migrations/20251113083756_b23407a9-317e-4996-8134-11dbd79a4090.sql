-- Update ad_variants table to allow platform-specific variant types
ALTER TABLE ad_variants DROP CONSTRAINT IF EXISTS ad_variants_variant_type_check;

-- Add new constraint allowing platform-specific variant types
ALTER TABLE ad_variants ADD CONSTRAINT ad_variants_variant_type_check 
CHECK (variant_type IN ('static', 'video', 'ugc', 'roas_prediction', 'meta', 'tiktok', 'google', 'linkedin'));