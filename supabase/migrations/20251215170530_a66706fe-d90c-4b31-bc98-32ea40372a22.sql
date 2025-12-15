-- Add missing mutation_source column
ALTER TABLE mutation_events ADD COLUMN IF NOT EXISTS mutation_source text;

-- Essential Indexes
CREATE INDEX IF NOT EXISTS idx_mutation_events_created_at ON mutation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mutation_events_user_source ON mutation_events (user_id, mutation_source);
CREATE INDEX IF NOT EXISTS idx_mutation_events_outcomes ON mutation_events (user_id) WHERE outcome_metrics IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mutation_events_applied_outcomes ON mutation_events (applied, created_at) WHERE outcome_metrics IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mutation_events_mutation_key ON mutation_events (mutation_key);

-- Top Performing Mutation Patterns
CREATE OR REPLACE VIEW vw_top_mutation_patterns AS
SELECT
  SPLIT_PART(me.mutation_key, ':', 2) || ':' || SPLIT_PART(me.mutation_key, ':', 3) AS pattern,
  COUNT(*) AS times_used,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS avg_roas,
  COUNT(*) FILTER (WHERE me.outcome_class = 'win') AS wins,
  COUNT(*) FILTER (WHERE me.outcome_metrics IS NOT NULL)::FLOAT
    / NULLIF(COUNT(*), 0) AS backfill_rate,
  COUNT(*) FILTER (WHERE me.outcome_class = 'win')::FLOAT
    / NULLIF(COUNT(*) FILTER (WHERE me.outcome_metrics IS NOT NULL), 0) AS win_rate
FROM mutation_events me
WHERE me.outcome_metrics IS NOT NULL
GROUP BY pattern
HAVING COUNT(*) >= 5
ORDER BY avg_roas DESC
LIMIT 20;

-- Genome Health Dashboard
CREATE OR REPLACE VIEW vw_genome_health AS
SELECT
  p.id AS user_id,
  cg.genome_confidence,
  cg.intra_genome_entropy,
  COUNT(me.id) FILTER (WHERE me.outcome_metrics IS NOT NULL) AS total_mutations_with_outcomes,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS user_avg_roas,
  COUNT(DISTINCT me.campaign_id) AS campaigns_impacted
FROM profiles p
LEFT JOIN creator_genomes cg ON cg.user_id = p.id
LEFT JOIN mutation_events me 
  ON me.user_id = p.id 
  AND me.outcome_metrics IS NOT NULL
GROUP BY p.id, cg.genome_confidence, cg.intra_genome_entropy
ORDER BY cg.genome_confidence DESC NULLS LAST;

-- Mutation Lift vs Baseline
CREATE OR REPLACE VIEW vw_mutation_lift AS
SELECT
  me.mutation_source,
  COUNT(*) AS mutations_with_outcomes,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS mutated_roas,
  AVG((c_base.performance_metrics->>'roas')::FLOAT) AS base_roas,
  (
    AVG((me.outcome_metrics->>'roas')::FLOAT)
    / NULLIF(AVG((c_base.performance_metrics->>'roas')::FLOAT), 0)
    - 1
  ) * 100 AS roas_lift_pct
FROM mutation_events me
JOIN creatives c_base 
  ON c_base.id = me.creative_id
WHERE me.outcome_metrics IS NOT NULL
  AND c_base.performance_metrics ? 'roas'
  AND (c_base.performance_metrics->>'roas')::FLOAT > 0
GROUP BY me.mutation_source;

-- Mutation Summary by Source
CREATE OR REPLACE VIEW vw_mutation_by_source AS
SELECT
  me.mutation_source,
  COUNT(*) AS total_mutations,
  COUNT(*) FILTER (WHERE me.outcome_metrics IS NOT NULL) AS with_outcomes,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS avg_roas,
  COUNT(*) FILTER (WHERE me.outcome_class = 'win') AS wins,
  COUNT(*) FILTER (WHERE me.outcome_class = 'loss') AS losses
FROM mutation_events me
GROUP BY me.mutation_source;

-- Time-Delayed Lift View (72hr stabilization)
CREATE OR REPLACE VIEW vw_mutation_lift_delayed AS
SELECT
  me.mutation_source,
  DATE_TRUNC('day', me.created_at + INTERVAL '3 days') AS effective_date,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS mutated_roas_delayed,
  AVG((c_base.performance_metrics->>'roas')::FLOAT) AS base_roas,
  (
    AVG((me.outcome_metrics->>'roas')::FLOAT)
    / NULLIF(AVG((c_base.performance_metrics->>'roas')::FLOAT), 0)
    - 1
  ) * 100 AS roas_lift_pct_delayed
FROM mutation_events me
JOIN creatives c_base ON c_base.id = me.creative_id
WHERE me.outcome_metrics IS NOT NULL
  AND me.created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY me.mutation_source, effective_date
ORDER BY effective_date DESC;