
-- Fix ambiguous column reference in lease_ai_jobs
CREATE OR REPLACE FUNCTION public.lease_ai_jobs(batch_size integer DEFAULT 5)
RETURNS TABLE(id uuid, user_id uuid, campaign_id uuid, request_type text, request_payload jsonb, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_lease_id UUID := gen_random_uuid();
  lease_duration INTERVAL := '2 minutes';
BEGIN
  RETURN QUERY
  UPDATE ai_generation_queue q
  SET 
    status = 'processing',
    lease_id = new_lease_id,
    lease_expires_at = now() + lease_duration,
    started_at = now(),
    updated_at = now()
  WHERE q.id IN (
    SELECT q2.id
    FROM ai_generation_queue q2
    WHERE q2.status = 'pending'
      AND q2.next_attempt_at <= now()
    ORDER BY q2.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    q.id,
    q.user_id,
    q.campaign_id,
    q.request_type,
    q.request_payload,
    q.created_at;
END;
$function$;

-- Fix ambiguous column reference in lease_publish_jobs
CREATE OR REPLACE FUNCTION public.lease_publish_jobs(batch_size integer DEFAULT 3)
RETURNS TABLE(id uuid, user_id uuid, campaign_id uuid, platform text, retry_count integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_lease_id UUID := gen_random_uuid();
  lease_duration INTERVAL := '5 minutes';
BEGIN
  RETURN QUERY
  UPDATE quick_start_publish_queue q
  SET 
    status = 'publishing',
    lease_id = new_lease_id,
    lease_expires_at = now() + lease_duration,
    started_at = now(),
    updated_at = now()
  WHERE q.id IN (
    SELECT q2.id
    FROM quick_start_publish_queue q2
    WHERE q2.status = 'queued'
      AND q2.next_attempt_at <= now()
    ORDER BY q2.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    q.id,
    q.user_id,
    q.campaign_id,
    q.platform,
    q.retry_count,
    q.created_at;
END;
$function$;

-- Add missing stripe_price_id column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
