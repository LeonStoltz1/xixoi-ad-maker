import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alert thresholds by mutation source (tighter for exploit, looser for explore)
const THRESHOLDS = {
  exploit: {
    win_rate_drop_pct: 15,      // Alert if win_rate drops >15%
    roas_drop_pct: 20,           // Alert if ROAS drops >20%
    min_sample_size: 10,         // Need at least 10 mutations with outcomes
    severity_critical_pct: 30,   // Critical if drop >30%
  },
  explore: {
    win_rate_drop_pct: 25,       // More tolerance for exploration
    roas_drop_pct: 30,
    min_sample_size: 15,
    severity_critical_pct: 50,
  },
  regret_avoidance: {
    win_rate_drop_pct: 20,
    roas_drop_pct: 25,
    min_sample_size: 8,
    severity_critical_pct: 40,
  },
  global: {
    win_rate_drop_pct: 18,
    roas_drop_pct: 22,
    min_sample_size: 25,
    severity_critical_pct: 35,
  },
};

// Lookback windows
const BASELINE_DAYS = 30;  // 30-day baseline
const CURRENT_DAYS = 7;    // 7-day current window

interface AlertResult {
  alert_type: string;
  mutation_source: string | null;
  severity: string;
  metric_name: string;
  baseline_value: number;
  current_value: number;
  change_pct: number;
  threshold_pct: number;
  sample_size: number;
  period_start: string;
  period_end: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const alerts: AlertResult[] = [];
  const now = new Date();
  const baselineStart = new Date(now.getTime() - BASELINE_DAYS * 24 * 60 * 60 * 1000);
  const currentStart = new Date(now.getTime() - CURRENT_DAYS * 24 * 60 * 60 * 1000);

  console.log(`[check-mutation-alerts] Running alert check at ${now.toISOString()}`);
  console.log(`[check-mutation-alerts] Baseline: ${baselineStart.toISOString()} to ${currentStart.toISOString()}`);
  console.log(`[check-mutation-alerts] Current: ${currentStart.toISOString()} to ${now.toISOString()}`);

  try {
    // Check each mutation source + global
    const sources = ['exploit', 'explore', 'regret_avoidance', null];

    for (const source of sources) {
      const sourceKey = source || 'global';
      const thresholds = THRESHOLDS[sourceKey as keyof typeof THRESHOLDS];

      // Build filter for source
      let baselineQuery = supabase
        .from('mutation_events')
        .select('outcome_metrics, outcome_class')
        .not('outcome_metrics', 'is', null)
        .gte('created_at', baselineStart.toISOString())
        .lt('created_at', currentStart.toISOString());

      let currentQuery = supabase
        .from('mutation_events')
        .select('outcome_metrics, outcome_class')
        .not('outcome_metrics', 'is', null)
        .gte('created_at', currentStart.toISOString());

      if (source) {
        baselineQuery = baselineQuery.eq('mutation_source', source);
        currentQuery = currentQuery.eq('mutation_source', source);
      }

      const [baselineResult, currentResult] = await Promise.all([
        baselineQuery,
        currentQuery,
      ]);

      if (baselineResult.error || currentResult.error) {
        console.error(`[check-mutation-alerts] Query error for ${sourceKey}:`, 
          baselineResult.error || currentResult.error);
        continue;
      }

      const baselineData = baselineResult.data || [];
      const currentData = currentResult.data || [];

      console.log(`[check-mutation-alerts] ${sourceKey}: baseline=${baselineData.length}, current=${currentData.length}`);

      // Skip if insufficient data
      if (baselineData.length < thresholds.min_sample_size || currentData.length < 3) {
        console.log(`[check-mutation-alerts] Skipping ${sourceKey}: insufficient data`);
        continue;
      }

      // Calculate metrics
      const baselineWins = baselineData.filter(d => d.outcome_class === 'win').length;
      const currentWins = currentData.filter(d => d.outcome_class === 'win').length;

      const baselineWinRate = baselineWins / baselineData.length;
      const currentWinRate = currentWins / currentData.length;

      const baselineRoas = baselineData
        .map(d => parseFloat((d.outcome_metrics as any)?.roas) || 0)
        .filter(r => r > 0);
      const currentRoas = currentData
        .map(d => parseFloat((d.outcome_metrics as any)?.roas) || 0)
        .filter(r => r > 0);

      const avgBaselineRoas = baselineRoas.length > 0 
        ? baselineRoas.reduce((a, b) => a + b, 0) / baselineRoas.length 
        : 0;
      const avgCurrentRoas = currentRoas.length > 0 
        ? currentRoas.reduce((a, b) => a + b, 0) / currentRoas.length 
        : 0;

      // Check win_rate drop
      if (baselineWinRate > 0) {
        const winRateChangePct = ((currentWinRate - baselineWinRate) / baselineWinRate) * 100;

        if (winRateChangePct < -thresholds.win_rate_drop_pct) {
          const severity = Math.abs(winRateChangePct) > thresholds.severity_critical_pct 
            ? 'critical' 
            : 'warning';

          alerts.push({
            alert_type: 'win_rate_drop',
            mutation_source: source,
            severity,
            metric_name: 'win_rate',
            baseline_value: baselineWinRate,
            current_value: currentWinRate,
            change_pct: winRateChangePct,
            threshold_pct: thresholds.win_rate_drop_pct,
            sample_size: currentData.length,
            period_start: currentStart.toISOString(),
            period_end: now.toISOString(),
            message: `${sourceKey.toUpperCase()} win_rate dropped ${Math.abs(winRateChangePct).toFixed(1)}% (${(baselineWinRate * 100).toFixed(1)}% → ${(currentWinRate * 100).toFixed(1)}%) in last ${CURRENT_DAYS} days`,
          });
        }
      }

      // Check ROAS drop
      if (avgBaselineRoas > 0) {
        const roasChangePct = ((avgCurrentRoas - avgBaselineRoas) / avgBaselineRoas) * 100;

        if (roasChangePct < -thresholds.roas_drop_pct) {
          const severity = Math.abs(roasChangePct) > thresholds.severity_critical_pct 
            ? 'critical' 
            : 'warning';

          alerts.push({
            alert_type: 'roas_drop',
            mutation_source: source,
            severity,
            metric_name: 'avg_roas',
            baseline_value: avgBaselineRoas,
            current_value: avgCurrentRoas,
            change_pct: roasChangePct,
            threshold_pct: thresholds.roas_drop_pct,
            sample_size: currentRoas.length,
            period_start: currentStart.toISOString(),
            period_end: now.toISOString(),
            message: `${sourceKey.toUpperCase()} avg ROAS dropped ${Math.abs(roasChangePct).toFixed(1)}% (${avgBaselineRoas.toFixed(2)} → ${avgCurrentRoas.toFixed(2)}) in last ${CURRENT_DAYS} days`,
          });
        }
      }

      // Check volume anomaly (sudden drop in mutation generation)
      const expectedVolume = baselineData.length / (BASELINE_DAYS - CURRENT_DAYS) * CURRENT_DAYS;
      if (expectedVolume > 10 && currentData.length < expectedVolume * 0.3) {
        alerts.push({
          alert_type: 'volume_anomaly',
          mutation_source: source,
          severity: 'warning',
          metric_name: 'mutation_volume',
          baseline_value: expectedVolume,
          current_value: currentData.length,
          change_pct: ((currentData.length - expectedVolume) / expectedVolume) * 100,
          threshold_pct: 70,
          sample_size: currentData.length,
          period_start: currentStart.toISOString(),
          period_end: now.toISOString(),
          message: `${sourceKey.toUpperCase()} mutation volume dropped significantly (expected ~${expectedVolume.toFixed(0)}, got ${currentData.length})`,
        });
      }
    }

    // Store alerts in database
    if (alerts.length > 0) {
      console.log(`[check-mutation-alerts] Found ${alerts.length} alerts, storing...`);

      const { error: insertError } = await supabase
        .from('mutation_alerts')
        .insert(alerts);

      if (insertError) {
        console.error('[check-mutation-alerts] Failed to store alerts:', insertError);
      }

      // Send to Slack if webhook configured
      const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');
      if (slackWebhook) {
        await sendSlackAlerts(slackWebhook, alerts);
      }
    } else {
      console.log('[check-mutation-alerts] No alerts triggered');
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_triggered: alerts.length,
        alerts,
        checked_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[check-mutation-alerts] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendSlackAlerts(webhookUrl: string, alerts: AlertResult[]) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🚨 Mutation Engine Alerts (${alerts.length} total)`,
        emoji: true,
      },
    },
  ];

  if (criticalAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔴 CRITICAL (${criticalAlerts.length}):*\n${criticalAlerts.map(a => `• ${a.message}`).join('\n')}`,
      },
    } as any);
  }

  if (warningAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚠️ WARNINGS (${warningAlerts.length}):*\n${warningAlerts.map(a => `• ${a.message}`).join('\n')}`,
      },
    } as any);
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    console.log('[check-mutation-alerts] Slack notification sent');
  } catch (e) {
    console.error('[check-mutation-alerts] Failed to send Slack notification:', e);
  }
}