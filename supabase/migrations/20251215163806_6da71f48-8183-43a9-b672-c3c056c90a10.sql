-- Add entropy state tracking to creator_genomes
ALTER TABLE creator_genomes 
ADD COLUMN IF NOT EXISTS last_entropy_state text DEFAULT 'healthy',
ADD COLUMN IF NOT EXISTS last_entropy_value float8 DEFAULT 1.0;