-- Fix 1: Add search_path to update_political_updated_at function
CREATE OR REPLACE FUNCTION public.update_political_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix 2: Add search_path to update_campaign_total_spent function
CREATE OR REPLACE FUNCTION public.update_campaign_total_spent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE campaigns
  SET total_spent = (
    SELECT COALESCE(SUM(spend), 0)
    FROM campaign_spend_daily
    WHERE campaign_id = NEW.campaign_id
  ),
  updated_at = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$function$;

-- Fix 3: Add search_path to update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix 4: Recreate admin_watermark_report view without SECURITY DEFINER
-- First drop the existing view
DROP VIEW IF EXISTS public.admin_watermark_report;

-- Recreate without SECURITY DEFINER (views should not use SECURITY DEFINER for security)
CREATE VIEW public.admin_watermark_report AS
SELECT 
  fa.id,
  fa.ad_variant_id,
  fa.user_id,
  fa.fingerprint,
  fa.image_url,
  fa.published_at,
  fa.tampered,
  fa.charged,
  av.campaign_id,
  av.creative_url,
  c.name as campaign_name,
  p.email as user_email,
  p.stripe_customer_id,
  av.variant_type as platform,
  CASE 
    WHEN fa.charged = true THEN 29.00
    ELSE 0
  END as revenue
FROM free_ads fa
LEFT JOIN ad_variants av ON fa.ad_variant_id = av.id
LEFT JOIN campaigns c ON av.campaign_id = c.id
LEFT JOIN profiles p ON fa.user_id = p.id;

-- Ensure proper RLS on the view (only admins can view)
ALTER VIEW public.admin_watermark_report SET (security_invoker = true);

-- Fix 5: Enable leaked password protection via auth configuration
-- Note: This requires updating auth configuration which is done separately via configure-auth tool