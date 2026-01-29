-- Create URL extractions cache table for faster repeated requests
CREATE TABLE public.url_extractions_cache (
  url_hash TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  content TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for cleanup queries
CREATE INDEX idx_url_cache_created_at ON public.url_extractions_cache(created_at);

-- Enable RLS but allow public access for caching (read/write from edge functions)
ALTER TABLE public.url_extractions_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access to url cache"
  ON public.url_extractions_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.url_extractions_cache IS 'Caches URL extraction results for 24-48 hours to avoid redundant scraping';