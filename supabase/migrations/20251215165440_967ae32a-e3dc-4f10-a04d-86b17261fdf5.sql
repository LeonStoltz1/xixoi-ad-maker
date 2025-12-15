-- Add mutation_key column to mutation_events for reliable outcome matching
ALTER TABLE public.mutation_events
  ADD COLUMN IF NOT EXISTS mutation_key TEXT;

-- Create index for efficient outcome lookups by (creative_id, mutation_key)
CREATE INDEX IF NOT EXISTS idx_mutation_events_creative_key 
  ON public.mutation_events(creative_id, mutation_key);

-- Backfill any existing rows with a default mutation_key
UPDATE public.mutation_events
SET mutation_key = CONCAT('legacy:', id::text)
WHERE mutation_key IS NULL;