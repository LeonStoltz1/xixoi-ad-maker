-- Drop the view first to recreate with correct types
drop view if exists admin_watermark_report;

-- Recreate without exposing auth.users
create or replace view admin_watermark_report as
select 
  fa.id,
  fa.ad_variant_id,
  fa.fingerprint,
  fa.image_url,
  fa.published_at,
  fa.tampered,
  fa.charged,
  fa.user_id,
  p.email as user_email,
  c.name as campaign_name,
  c.id as campaign_id,
  av.creative_url,
  av.variant_type as platform,
  p.stripe_customer_id,
  case when fa.charged then 29.00 else 0.00 end as revenue
from free_ads fa
join ad_variants av on fa.ad_variant_id = av.id
join campaigns c on av.campaign_id = c.id
left join profiles p on fa.user_id = p.id
order by fa.published_at desc nulls last;

-- Grant access to authenticated users
grant select on admin_watermark_report to authenticated;