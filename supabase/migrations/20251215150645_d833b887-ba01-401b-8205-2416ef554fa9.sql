-- Phase 1: CRL + Creator Genome Tables

-- 1. Creatives table for tracking all generated creatives
CREATE TABLE IF NOT EXISTS public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  creative_data JSONB NOT NULL DEFAULT '{}',
  variants JSONB[] DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB DEFAULT '{
    "ctr": null,
    "cpa": null,
    "roas": null,
    "conversion_rate": null,
    "spend": 0,
    "decay_curve": [],
    "engagement_decay": null,
    "policy_flags": [],
    "stability_score": null
  }',
  user_feedback JSONB DEFAULT '{}',
  utility_score FLOAT8,
  rank_position INTEGER,
  style_cluster TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Regret Memory - tiered system for learning from outcomes
CREATE TABLE IF NOT EXISTS public.regret_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.creatives(id) ON DELETE SET NULL,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 3),
  context JSONB NOT NULL DEFAULT '{}',
  regret_vector JSONB NOT NULL DEFAULT '{}',
  volatility_score FLOAT8 DEFAULT 0,
  severity FLOAT8 DEFAULT 0,
  outcome_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Creator Genomes - personalized creative DNA
CREATE TABLE IF NOT EXISTS public.creator_genomes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  genome_confidence FLOAT8 DEFAULT 0,
  style_embedding FLOAT8[] DEFAULT '{}',
  text_embedding FLOAT8[] DEFAULT '{}',
  outcome_embedding FLOAT8[] DEFAULT '{}',
  platform_success JSONB DEFAULT '{
    "meta": {"wins": 0, "total": 0, "avg_roas": null},
    "google": {"wins": 0, "total": 0, "avg_roas": null},
    "tiktok": {"wins": 0, "total": 0, "avg_roas": null},
    "linkedin": {"wins": 0, "total": 0, "avg_roas": null},
    "x": {"wins": 0, "total": 0, "avg_roas": null}
  }',
  vertical_preferences TEXT[] DEFAULT '{}',
  style_clusters JSONB DEFAULT '{}',
  baseline_risk_appetite FLOAT8 DEFAULT 0.5,
  contextual_risk_modifier FLOAT8 DEFAULT 0,
  decay_sensitivity FLOAT8 DEFAULT 0.5,
  edit_patterns JSONB DEFAULT '{}',
  regret_sensitivity JSONB DEFAULT '{"positive": 0.5, "negative": 0.5}',
  gap_vectors TEXT[] DEFAULT '{}',
  next_best_mutations TEXT[] DEFAULT '{}',
  mutation_history JSONB DEFAULT '[]',
  intra_genome_entropy FLOAT8 DEFAULT 0,
  total_creatives INTEGER DEFAULT 0,
  profitable_creatives INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Add outcomes column to campaigns if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'outcomes'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN outcomes JSONB DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regret_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_genomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creatives
CREATE POLICY "Users can view own creatives" ON public.creatives
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creatives" ON public.creatives
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creatives" ON public.creatives
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to creatives" ON public.creatives
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for regret_memory
CREATE POLICY "Users can view own regret_memory" ON public.regret_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to regret_memory" ON public.regret_memory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for creator_genomes
CREATE POLICY "Users can view own genome" ON public.creator_genomes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own genome" ON public.creator_genomes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to genomes" ON public.creator_genomes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign_id ON public.creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_platform ON public.creatives(platform);
CREATE INDEX IF NOT EXISTS idx_creatives_style_cluster ON public.creatives(style_cluster);
CREATE INDEX IF NOT EXISTS idx_regret_memory_user_id ON public.regret_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_regret_memory_tier ON public.regret_memory(tier);

-- Trigger for updated_at on creatives
CREATE TRIGGER update_creatives_updated_at
  BEFORE UPDATE ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on creator_genomes
CREATE TRIGGER update_genomes_updated_at
  BEFORE UPDATE ON public.creator_genomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();