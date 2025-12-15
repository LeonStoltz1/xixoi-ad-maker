-- Fix views to use SECURITY INVOKER (safer default) and add proper access control
-- These views are for admin monitoring only

-- Drop and recreate with explicit SECURITY INVOKER
DROP VIEW IF EXISTS vw_top_mutation_patterns;
DROP VIEW IF EXISTS vw_genome_health;
DROP VIEW IF EXISTS vw_mutation_lift;
DROP VIEW IF EXISTS vw_mutation_by_source;
DROP VIEW IF EXISTS vw_mutation_lift_delayed;

-- Recreate with SECURITY INVOKER (explicit)
CREATE VIEW vw_top_mutation_patterns WITH (security_invoker = true) AS
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

CREATE VIEW vw_genome_health WITH (security_invoker = true) AS
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

CREATE VIEW vw_mutation_lift WITH (security_invoker = true) AS
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

CREATE VIEW vw_mutation_by_source WITH (security_invoker = true) AS
SELECT
  me.mutation_source,
  COUNT(*) AS total_mutations,
  COUNT(*) FILTER (WHERE me.outcome_metrics IS NOT NULL) AS with_outcomes,
  AVG((me.outcome_metrics->>'roas')::FLOAT) AS avg_roas,
  COUNT(*) FILTER (WHERE me.outcome_class = 'win') AS wins,
  COUNT(*) FILTER (WHERE me.outcome_class = 'loss') AS losses
FROM mutation_events me
GROUP BY me.mutation_source;

CREATE VIEW vw_mutation_lift_delayed WITH (security_invoker = true) AS
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