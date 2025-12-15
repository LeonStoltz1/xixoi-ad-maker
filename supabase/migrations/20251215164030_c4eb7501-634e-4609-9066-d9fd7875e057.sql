-- Add defaults for entropy state tracking columns
ALTER TABLE public.creator_genomes
  ALTER COLUMN last_entropy_state SET DEFAULT 'healthy',
  ALTER COLUMN last_entropy_value SET DEFAULT 1;

-- Update any existing null values
UPDATE public.creator_genomes
SET last_entropy_state = 'healthy', last_entropy_value = 1
WHERE last_entropy_state IS NULL OR last_entropy_value IS NULL;