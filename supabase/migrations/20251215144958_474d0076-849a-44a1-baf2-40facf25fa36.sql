-- Fix: Recreate view with explicit SECURITY INVOKER (safer default)
DROP VIEW IF EXISTS public.affiliate_leaderboard_public;

CREATE VIEW public.affiliate_leaderboard_public 
WITH (security_invoker = true)
AS
SELECT 
  a.id as affiliate_id,
  a.code as affiliate_code,
  a.current_tier,
  COUNT(ar.id) as total_referrals,
  a.growth_rate
FROM public.affiliates a
LEFT JOIN public.affiliate_referrals ar ON ar.affiliate_id = a.id AND ar.is_suspicious = false
WHERE a.is_blocked = false
GROUP BY a.id, a.code, a.current_tier, a.growth_rate
ORDER BY total_referrals DESC;

-- Grant to authenticated only
GRANT SELECT ON public.affiliate_leaderboard_public TO authenticated;
REVOKE ALL ON public.affiliate_leaderboard_public FROM anon;