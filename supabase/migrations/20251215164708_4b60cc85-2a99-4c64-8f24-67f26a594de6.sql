-- Create mutation_events table for tracking learned mutation suggestions
CREATE TABLE public.mutation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  creative_id UUID REFERENCES public.creatives(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  base_style_cluster TEXT,
  mutations JSONB NOT NULL DEFAULT '[]'::jsonb,
  mutation_score FLOAT8 DEFAULT 0,
  rank_before INTEGER,
  rank_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  outcome_metrics JSONB,
  outcome_class TEXT CHECK (outcome_class IN ('win', 'loss', 'near_miss', 'unstable')),
  applied BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.mutation_events ENABLE ROW LEVEL SECURITY;

-- Users can view own mutation events
CREATE POLICY "Users can view own mutation events"
  ON public.mutation_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to mutation_events"
  ON public.mutation_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_mutation_events_user_id ON public.mutation_events(user_id);
CREATE INDEX idx_mutation_events_creative_id ON public.mutation_events(creative_id);
CREATE INDEX idx_mutation_events_outcome_class ON public.mutation_events(outcome_class);