import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function weights
const WEIGHTS = {
  expected_roi: 0.4,
  conversion_stability: 0.25,
  retention_impact: 0.2,
  novelty_bonus: 0.15,
};

// Wilson score for Bayesian smoothing (95% confidence lower bound)
function wilsonScore(wins: number, total: number): number {
  if (total === 0) return 0.5;
  const z = 1.96;
  const p = wins / total;
  const denominator = 1 + z * z / total;
  const center = p + z * z / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total);
  return (center - spread) / denominator;
}

// Time-decayed regret severity: severity × exp(-λ × age_days)
function getDecayedSeverity(severity: number, createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const lambda = 0.05; // ~50% decay after 14 days
  return severity * Math.exp(-lambda * ageDays);
}

// Normalized entropy: entropy / log2(k) where k = number of clusters
function calculateNormalizedEntropy(distribution: Record<string, number>): number {
  const values = Object.values(distribution);
  const total = values.reduce((a, b) => a + b, 0);
  const k = values.filter(v => v > 0).length;
  if (total === 0 || k <= 1) return 1;
  
  let entropy = 0;
  for (const count of values) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy / Math.log2(k);
}

// Calculate Bayesian expected ROI with uncertainty
function calculateExpectedROI(metrics: Record<string, unknown>, priorMean = 1.0): number {
  const roas = metrics?.roas as number;
  if (!roas) return priorMean;
  const spend = (metrics?.spend as number) || 0;
  const n = spend > 0 ? Math.min(spend / 100, 10) : 0;
  const priorVariance = 0.5;
  return (priorVariance * roas + (1/n) * priorMean) / (priorVariance + 1/n);
}

function calculateConversionStability(metrics: Record<string, unknown>): number {
  const stability = metrics?.stability_score as number;
  if (stability !== undefined && stability !== null) return stability;
  const decayCurve = metrics?.decay_curve as number[];
  if (decayCurve?.length > 1) {
    const mean = decayCurve.reduce((a, b) => a + b, 0) / decayCurve.length;
    const variance = decayCurve.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / decayCurve.length;
    return Math.max(0, 1 - variance);
  }
  return 0.5;
}

function calculateRetentionImpact(metrics: Record<string, unknown>): number {
  const decay = metrics?.engagement_decay as number;
  if (decay !== null && decay !== undefined) return Math.max(0, 1 - decay);
  const ctr = metrics?.ctr as number;
  if (ctr !== null && ctr !== undefined) return Math.min(1, ctr * 10);
  return 0.5;
}

// Decision provenance for audit logging
interface DecisionProvenance {
  creative_id: string;
  base_utility: number;
  final_utility: number;
  genome_bonus: number;
  gates_applied: string[];
  penalties: Array<{ reason: string; amount: number }>;
  boosts: Array<{ reason: string; amount: number }>;
  regret_matches: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { creatives: inputCreatives, campaign_id } = await req.json();
    if (!inputCreatives || !Array.isArray(inputCreatives)) {
      throw new Error('creatives array required');
    }

    // Fetch genome with Wilson-smoothed platform success
    const { data: genome } = await supabase
      .from('creator_genomes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch regret memory for time-decayed penalties
    const { data: regretMemory } = await supabase
      .from('regret_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch recent creatives for cluster distribution
    const { data: recentCreatives } = await supabase
      .from('creatives')
      .select('style_cluster')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const clusterDistribution: Record<string, number> = {};
    for (const c of recentCreatives || []) {
      const cluster = (c.style_cluster as string) || 'unknown';
      clusterDistribution[cluster] = (clusterDistribution[cluster] || 0) + 1;
    }
    const totalCreatives = recentCreatives?.length || 0;

    // Normalized entropy for drift detection
    const normalizedEntropy = calculateNormalizedEntropy(clusterDistribution);
    const isLowEntropy = normalizedEntropy < 0.4 && totalCreatives > 10;

    const rankedCreatives = [];
    const gatedCreatives = [];
    const provenanceLog: DecisionProvenance[] = [];

    for (const creative of inputCreatives) {
      const metrics = (creative.performance_metrics || {}) as Record<string, unknown>;
      const styleCluster = (creative.style_cluster || creative.creative_data?.style_cluster || 'unknown') as string;
      const platform = (creative.platform || 'unknown') as string;

      const provenance: DecisionProvenance = {
        creative_id: creative.id,
        base_utility: 0,
        final_utility: 0,
        genome_bonus: 0,
        gates_applied: [],
        penalties: [],
        boosts: [],
        regret_matches: [],
      };

      // === HARD GATES ===
      const policyFlags = metrics.policy_flags as string[];
      if (policyFlags?.length > 0) {
        provenance.gates_applied.push(`policy_flags: ${policyFlags.join(', ')}`);
        gatedCreatives.push({ ...creative, gated: true, gate_reason: 'policy_violation', provenance });
        provenanceLog.push(provenance);
        continue;
      }

      const roas = metrics.roas as number;
      if (roas !== null && roas < 0) {
        provenance.gates_applied.push('negative_roi');
        gatedCreatives.push({ ...creative, gated: true, gate_reason: 'negative_roi', provenance });
        provenanceLog.push(provenance);
        continue;
      }

      // Cluster saturation (30% max)
      const clusterCount = clusterDistribution[styleCluster] || 0;
      if (totalCreatives > 3 && clusterCount / totalCreatives > 0.3) {
        const clusterRegrets = (regretMemory || []).filter(
          r => r.context?.style_cluster === styleCluster && r.tier === 1
        );
        if (clusterRegrets.length > 2) {
          provenance.gates_applied.push(`cluster_saturation: ${styleCluster} at ${((clusterCount/totalCreatives)*100).toFixed(0)}%`);
          gatedCreatives.push({ ...creative, gated: true, gate_reason: 'cluster_saturation_with_regret', provenance });
          provenanceLog.push(provenance);
          continue;
        }
      }

      // === UTILITY CALCULATION ===
      const expectedROI = calculateExpectedROI(metrics);
      const stability = calculateConversionStability(metrics);
      const retention = calculateRetentionImpact(metrics);
      const clusterRatio = totalCreatives > 0 ? clusterCount / totalCreatives : 0;
      const novelty = Math.max(0, 1 - clusterRatio);

      let utility = 
        WEIGHTS.expected_roi * expectedROI +
        WEIGHTS.conversion_stability * stability +
        WEIGHTS.retention_impact * retention +
        WEIGHTS.novelty_bonus * novelty;

      provenance.base_utility = utility;

      // === REGRET PENALTIES (time-decayed) ===
      for (const regret of regretMemory || []) {
        const decayedSeverity = getDecayedSeverity(regret.severity || 0.5, regret.created_at);
        if (decayedSeverity < 0.1) continue; // Skip stale regrets

        const ctx = regret.context || {};
        if (ctx.style_cluster === styleCluster || ctx.platform === platform) {
          const penalty = decayedSeverity * 0.1 * regret.tier;
          utility -= penalty;
          provenance.penalties.push({ reason: `regret_match_tier${regret.tier}`, amount: penalty });
          provenance.regret_matches.push(regret.id);
        }

        // Near-miss promotion (tier 2-3, low volatility, decayed severity > 0.3)
        if (regret.tier >= 2 && regret.volatility_score < 0.3 && decayedSeverity > 0.3) {
          const boost = 0.05 * (1 - regret.volatility_score);
          utility += boost;
          provenance.boosts.push({ reason: 'near_miss_promotion', amount: boost });
        }
      }

      // === GENOME BONUS (Wilson-smoothed, capped at 25%) ===
      let genomeBonus = 0;
      if (genome?.genome_confidence > 0.5) {
        const platformSuccess = genome.platform_success?.[platform];
        if (platformSuccess?.total > 0) {
          const smoothedWinRate = wilsonScore(platformSuccess.wins || 0, platformSuccess.total);
          genomeBonus = smoothedWinRate * 0.25 * genome.genome_confidence;
          provenance.boosts.push({ reason: `genome_platform(wilson=${smoothedWinRate.toFixed(3)})`, amount: genomeBonus });
        }

        const clusterAffinity = genome.style_clusters?.[styleCluster] || 0;
        if (clusterAffinity > 0.5) {
          const styleBonus = Math.min(0.1, clusterAffinity * 0.15);
          genomeBonus += styleBonus;
          provenance.boosts.push({ reason: 'genome_style_affinity', amount: styleBonus });
        }
      }

      const cappedGenomeBonus = Math.min(genomeBonus, provenance.base_utility * 0.25);
      utility += cappedGenomeBonus;
      provenance.genome_bonus = cappedGenomeBonus;

      // === LOW ENTROPY PENALTY (normalized) ===
      if (isLowEntropy && clusterCount > 5) {
        const penalty = (0.4 - normalizedEntropy) * 0.2;
        utility *= (1 - penalty);
        provenance.penalties.push({ reason: `low_entropy(${normalizedEntropy.toFixed(2)})`, amount: penalty });
      }

      provenance.final_utility = utility;
      provenanceLog.push(provenance);

      rankedCreatives.push({
        ...creative,
        utility_score: utility,
        genome_boosted: genome?.genome_confidence > 0.5,
        provenance,
        rank_position: 0,
      });
    }

    // Sort and assign ranks
    rankedCreatives.sort((a, b) => (b.utility_score || 0) - (a.utility_score || 0));
    rankedCreatives.forEach((c, i) => { c.rank_position = i + 1; });

    // Store ranked creatives
    if (campaign_id) {
      for (const creative of rankedCreatives) {
        await supabase.from('creatives').upsert({
          id: creative.id,
          user_id: user.id,
          campaign_id,
          platform: creative.platform,
          creative_data: creative.creative_data,
          performance_metrics: creative.performance_metrics,
          style_cluster: creative.style_cluster,
          utility_score: creative.utility_score,
          rank_position: creative.rank_position,
        });
      }
    }

    console.log(`[CRL] user=${user.id} ranked=${rankedCreatives.length} gated=${gatedCreatives.length} entropy=${normalizedEntropy.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        ranked: rankedCreatives,
        gated: gatedCreatives,
        provenance: provenanceLog,
        metadata: {
          total_input: inputCreatives.length,
          total_ranked: rankedCreatives.length,
          total_gated: gatedCreatives.length,
          normalized_entropy: normalizedEntropy,
          low_entropy_warning: isLowEntropy,
          genome_active: genome?.genome_confidence > 0.5,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('rank_creatives error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
