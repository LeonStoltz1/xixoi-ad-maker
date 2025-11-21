-- AI Generation Queue Table
CREATE TABLE IF NOT EXISTS public.ai_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'variants', 'targeting', 'copy_rewrite', etc.
  request_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  queue_position INTEGER,
  estimated_wait_seconds INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick-Start Publish Queue Table
CREATE TABLE IF NOT EXISTS public.quick_start_publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'meta', 'google', 'tiktok', 'linkedin', 'x'
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'publishing', 'live', 'failed'
  queue_position INTEGER,
  estimated_start_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_queue_user_status ON public.ai_generation_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_status_created ON public.ai_generation_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_publish_queue_user_status ON public.quick_start_publish_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_publish_queue_status_created ON public.quick_start_publish_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_publish_queue_campaign ON public.quick_start_publish_queue(campaign_id);

-- RLS Policies
ALTER TABLE public.ai_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_start_publish_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queue entries
CREATE POLICY "Users can view own AI queue entries"
  ON public.ai_generation_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own publish queue entries"
  ON public.quick_start_publish_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all queue entries
CREATE POLICY "Service role can manage AI queue"
  ON public.ai_generation_queue FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage publish queue"
  ON public.quick_start_publish_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update AI generation queue positions
  WITH ranked_queue AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at) AS new_position
    FROM ai_generation_queue
    WHERE status = 'pending'
  )
  UPDATE ai_generation_queue
  SET 
    queue_position = ranked_queue.new_position,
    estimated_wait_seconds = (ranked_queue.new_position * 10), -- ~10 seconds per request
    updated_at = now()
  FROM ranked_queue
  WHERE ai_generation_queue.id = ranked_queue.id;

  -- Update publish queue positions
  WITH ranked_publish AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at) AS new_position
    FROM quick_start_publish_queue
    WHERE status = 'queued'
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

-- Trigger to auto-update positions when new entries added
CREATE OR REPLACE FUNCTION trigger_update_queue_positions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_queue_positions();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_queue_insert_trigger
AFTER INSERT ON public.ai_generation_queue
FOR EACH ROW
EXECUTE FUNCTION trigger_update_queue_positions();

CREATE TRIGGER publish_queue_insert_trigger
AFTER INSERT ON public.quick_start_publish_queue
FOR EACH ROW
EXECUTE FUNCTION trigger_update_queue_positions();