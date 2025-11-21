-- Add lease and scheduling columns to both queue tables
ALTER TABLE public.ai_generation_queue
ADD COLUMN IF NOT EXISTS lease_id UUID,
ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.quick_start_publish_queue
ADD COLUMN IF NOT EXISTS lease_id UUID,
ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ DEFAULT now();

-- Indexes for lease queries
CREATE INDEX IF NOT EXISTS idx_ai_queue_lease ON public.ai_generation_queue(status, next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_publish_queue_lease ON public.quick_start_publish_queue(status, next_attempt_at) WHERE status = 'queued';

-- Function to atomically lease AI generation jobs
CREATE OR REPLACE FUNCTION lease_ai_jobs(batch_size INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  campaign_id UUID,
  request_type TEXT,
  request_payload JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lease_id UUID := gen_random_uuid();
  lease_duration INTERVAL := '2 minutes';
BEGIN
  RETURN QUERY
  UPDATE ai_generation_queue
  SET 
    status = 'processing',
    lease_id = new_lease_id,
    lease_expires_at = now() + lease_duration,
    started_at = now(),
    updated_at = now()
  WHERE ai_generation_queue.id IN (
    SELECT ai_generation_queue.id
    FROM ai_generation_queue
    WHERE status = 'pending'
      AND next_attempt_at <= now()
    ORDER BY created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    ai_generation_queue.id,
    ai_generation_queue.user_id,
    ai_generation_queue.campaign_id,
    ai_generation_queue.request_type,
    ai_generation_queue.request_payload,
    ai_generation_queue.created_at;
END;
$$;

-- Function to atomically lease publish jobs
CREATE OR REPLACE FUNCTION lease_publish_jobs(batch_size INTEGER DEFAULT 3)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  campaign_id UUID,
  platform TEXT,
  retry_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lease_id UUID := gen_random_uuid();
  lease_duration INTERVAL := '5 minutes';
BEGIN
  RETURN QUERY
  UPDATE quick_start_publish_queue
  SET 
    status = 'publishing',
    lease_id = new_lease_id,
    lease_expires_at = now() + lease_duration,
    started_at = now(),
    updated_at = now()
  WHERE quick_start_publish_queue.id IN (
    SELECT quick_start_publish_queue.id
    FROM quick_start_publish_queue
    WHERE status = 'queued'
      AND next_attempt_at <= now()
    ORDER BY created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    quick_start_publish_queue.id,
    quick_start_publish_queue.user_id,
    quick_start_publish_queue.campaign_id,
    quick_start_publish_queue.platform,
    quick_start_publish_queue.retry_count,
    quick_start_publish_queue.created_at;
END;
$$;

-- Function to release expired leases (recovery mechanism)
CREATE OR REPLACE FUNCTION release_expired_leases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Release expired AI generation leases
  UPDATE ai_generation_queue
  SET 
    status = 'pending',
    lease_id = NULL,
    lease_expires_at = NULL,
    next_attempt_at = now() + interval '30 seconds'
  WHERE status = 'processing'
    AND lease_expires_at < now();

  -- Release expired publish leases
  UPDATE quick_start_publish_queue
  SET 
    status = 'queued',
    lease_id = NULL,
    lease_expires_at = NULL,
    next_attempt_at = now() + interval '30 seconds'
  WHERE status = 'publishing'
    AND lease_expires_at < now();
END;
$$;

-- Update queue position function to respect next_attempt_at
DROP FUNCTION IF EXISTS update_queue_positions();
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update AI generation queue positions (only for jobs ready to run)
  WITH ranked_queue AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at) AS new_position
    FROM ai_generation_queue
    WHERE status = 'pending'
      AND next_attempt_at <= now()
  )
  UPDATE ai_generation_queue
  SET 
    queue_position = ranked_queue.new_position,
    estimated_wait_seconds = (ranked_queue.new_position * 10),
    updated_at = now()
  FROM ranked_queue
  WHERE ai_generation_queue.id = ranked_queue.id;

  -- Update publish queue positions (only for jobs ready to run)
  WITH ranked_publish AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at) AS new_position
    FROM quick_start_publish_queue
    WHERE status = 'queued'
      AND next_attempt_at <= now()
  )
  UPDATE quick_start_publish_queue
  SET 
    queue_position = ranked_publish.new_position,
    estimated_start_time = now() + (ranked_publish.new_position * interval '15 seconds'),
    updated_at = now()
  FROM ranked_publish
  WHERE quick_start_publish_queue.id = ranked_publish.id;
END;
$$;