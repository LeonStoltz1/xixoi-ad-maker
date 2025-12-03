-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Creative memory table for storing ad performance embeddings
CREATE TABLE public.creative_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ad_text TEXT,
  ad_image_url TEXT,
  headline TEXT,
  body_copy TEXT,
  cta_text TEXT,
  performance_score NUMERIC,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  performance_vector vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor ads table for market intelligence
CREATE TABLE public.competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  brand_name TEXT,
  ad_text TEXT,
  ad_image_url TEXT,
  style_embedding vector(1536),
  platform TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optimization logs for tracking AI decisions
CREATE TABLE public.optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  decision_type TEXT,
  reason TEXT,
  before_value NUMERIC,
  after_value NUMERIC,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  auto_executed BOOLEAN DEFAULT false,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent tasks queue for the Gemini Conductor
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Gemini reflections for weekly self-improvement
CREATE TABLE public.gemini_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_type TEXT DEFAULT 'weekly',
  what_worked TEXT,
  what_failed TEXT,
  improvements TEXT,
  prompt_rewrites JSONB,
  metrics_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User autopilot settings
CREATE TABLE public.user_autopilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  autopilot_mode TEXT DEFAULT 'off' CHECK (autopilot_mode IN ('off', 'safe', 'standard', 'aggressive')),
  confidence_threshold INTEGER DEFAULT 85,
  auto_budget_adjustment BOOLEAN DEFAULT false,
  auto_creative_rotation BOOLEAN DEFAULT false,
  auto_pause_underperformers BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.creative_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_autopilot_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creative_memory
CREATE POLICY "Users can view own creative memory"
  ON public.creative_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creative memory"
  ON public.creative_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage creative memory"
  ON public.creative_memory FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for competitor_ads (admin only write, service role read)
CREATE POLICY "Admins can manage competitor ads"
  ON public.competitor_ads FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can manage competitor ads"
  ON public.competitor_ads FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for optimization_logs
CREATE POLICY "Users can view own optimization logs"
  ON public.optimization_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage optimization logs"
  ON public.optimization_logs FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for agent_tasks (service role only for write)
CREATE POLICY "Users can view own agent tasks"
  ON public.agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage agent tasks"
  ON public.agent_tasks FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for gemini_reflections (admin only)
CREATE POLICY "Admins can view reflections"
  ON public.gemini_reflections FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can manage reflections"
  ON public.gemini_reflections FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for user_autopilot_settings
CREATE POLICY "Users can manage own autopilot settings"
  ON public.user_autopilot_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage autopilot settings"
  ON public.user_autopilot_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_creative_memory_user ON public.creative_memory(user_id);
CREATE INDEX idx_creative_memory_campaign ON public.creative_memory(campaign_id);
CREATE INDEX idx_optimization_logs_user ON public.optimization_logs(user_id);
CREATE INDEX idx_optimization_logs_campaign ON public.optimization_logs(campaign_id);
CREATE INDEX idx_agent_tasks_status ON public.agent_tasks(status, next_run);
CREATE INDEX idx_agent_tasks_user ON public.agent_tasks(user_id);
CREATE INDEX idx_competitor_ads_category ON public.competitor_ads(category);