-- Add mutated_fields jsonb for clean outcome attribution
ALTER TABLE public.mutation_events 
  ADD COLUMN IF NOT EXISTS mutated_fields JSONB;

-- Index for fast outcome backfill queries
CREATE INDEX IF NOT EXISTS idx_mutation_events_outcome_lookup 
  ON public.mutation_events (user_id, creative_id, mutation_key);