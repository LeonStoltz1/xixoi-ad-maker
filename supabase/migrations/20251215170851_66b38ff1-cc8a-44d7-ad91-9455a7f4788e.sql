-- Alert events table for mutation performance drift
CREATE TABLE IF NOT EXISTS mutation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL, -- 'win_rate_drop', 'roas_drop', 'volume_anomaly'
  mutation_source text, -- 'exploit', 'explore', 'regret_avoidance', or null for global
  severity text NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  metric_name text NOT NULL,
  baseline_value numeric,
  current_value numeric,
  change_pct numeric,
  threshold_pct numeric,
  sample_size integer,
  period_start timestamptz,
  period_end timestamptz,
  message text NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mutation_alerts ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role can manage alerts" ON mutation_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- Admins can view/acknowledge
CREATE POLICY "Admins can view alerts" ON mutation_alerts
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update alerts" ON mutation_alerts
  FOR UPDATE USING (is_admin(auth.uid()));

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_mutation_alerts_created ON mutation_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mutation_alerts_unacknowledged ON mutation_alerts (created_at DESC) WHERE acknowledged_at IS NULL;