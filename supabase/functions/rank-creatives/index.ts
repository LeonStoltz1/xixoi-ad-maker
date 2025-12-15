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
  penalties: Array<{ reason: string; amount: number; match_type?: string }>;
  boosts: Array<{ reason: string; amount: number }>;
  regret_matches: string[];
  total_regret_penalty: number;
  regret_penalty_capped: boolean;
}

// Entropy state transition tracking
interface EntropyTransition {
  from_state: 'healthy' | 'warning' | 'critical';
  to_state: 'healthy' | 'warning' | 'critical';
  normalized_entropy: number;
  timestamp: string;
}

function getEntropyState(normalizedEntropy: number): 'healthy' | 'warning' | 'critical' {
  if (normalizedEntropy >= 0.6) return 'healthy';
  if (normalizedEntropy >= 0.4) return 'warning';
  return 'critical';
}

// Simple hash for provenance (store full logs only on anomalies)
function hashProvenance(provenance: DecisionProvenance): string {
  const str = JSON.stringify({
    id: provenance.creative_id,
    base: provenance.base_utility.toFixed(4),
    final: provenance.final_utility.toFixed(4),
    gates: provenance.gates_applied.length,
    penalties: provenance.penalties.length,
    boosts: provenance.boosts.length,
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

// Determine if provenance is anomalous (should store full log)
function isAnomalousProvenance(provenance: DecisionProvenance): boolean {
  return (
    provenance.gates_applied.length > 0 ||
    provenance.regret_penalty_capped ||
    provenance.total_regret_penalty > provenance.base_utility * 0.2 ||
    Math.abs(provenance.final_utility - provenance.base_utility) > provenance.base_utility * 0.3
  );
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
    const currentEntropyState = getEntropyState(normalizedEntropy);
    
    // Track entropy state transitions (read previous from genome)
    const previousEntropyState = genome?.last_entropy_state as 'healthy' | 'warning' | 'critical' | undefined;
    let entropyTransition: EntropyTransition | null = null;
    if (previousEntropyState && previousEntropyState !== currentEntropyState) {
      entropyTransition = {
        from_state: previousEntropyState,
        to_state: currentEntropyState,
        normalized_entropy: normalizedEntropy,
        timestamp: new Date().toISOString(),
      };
      console.log(`[CRL Entropy Transition] user=${user.id} ${previousEntropyState} → ${currentEntropyState} (${normalizedEntropy.toFixed(3)})`);
    }
    const isLowEntropy = currentEntropyState === 'critical' && totalCreatives > 10;

    const rankedCreatives = [];
    const gatedCreatives = [];
    const provenanceLog: DecisionProvenance[] = [];
    const provenanceHashes: string[] = [];
    const anomalousProvenance: DecisionProvenance[] = [];

    // Regret penalty cap constant (40% of base utility max)
    const REGRET_PENALTY_CAP_RATIO = 0.4;

    for (const creative of inputCreatives) {
      const metrics = (creative.performance_metrics || {}) as Record<string, unknown>;
      const styleCluster = (creative.style_cluster || creative.creative_data?.style_cluster || 'unknown') as string;
      const platform = (creative.platform || 'unknown') as string;

      const provenance: DecisionProvenance = {
        creative_id: creative.id,
        base_utility: 0,
        final_utility: 0,
        genome_bonus: 0,
        total_regret_penalty: 0,
        regret_penalty_capped: false,
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

      // === REGRET PENALTIES (time-decayed, differentiated by match type, capped) ===
      let totalRegretPenalty = 0;
      for (const regret of regretMemory || []) {
        const decayedSeverity = getDecayedSeverity(regret.severity || 0.5, regret.created_at);
        if (decayedSeverity < 0.1) continue; // Skip stale regrets

        const ctx = regret.context || {};
        const styleMatch = ctx.style_cluster === styleCluster;
        const platformMatch = ctx.platform === platform;
        
        if (styleMatch || platformMatch) {
          // Differentiated weighting: style match (1.0) > platform match (0.6)
          const matchWeight = styleMatch ? 1.0 : 0.6;
          const matchType = styleMatch ? 'style' : 'platform';
          const basePenalty = decayedSeverity * 0.1 * regret.tier;
          const penalty = basePenalty * matchWeight;
          
          totalRegretPenalty += penalty;
          provenance.penalties.push({ 
            reason: `regret_${matchType}_match_tier${regret.tier}`, 
            amount: penalty,
            match_type: matchType
          });
          provenance.regret_matches.push(regret.id);
        }

        // Near-miss promotion (tier 2-3, low volatility, decayed severity > 0.3)
        if (regret.tier >= 2 && regret.volatility_score < 0.3 && decayedSeverity > 0.3) {
          const boost = 0.05 * (1 - regret.volatility_score);
          utility += boost;
          provenance.boosts.push({ reason: 'near_miss_promotion', amount: boost });
        }
      }

      // Apply capped regret penalty (max 40% of base utility, with floor to prevent instability)
      const baseForCap = Math.max(provenance.base_utility, 0.05);
      const maxRegretPenalty = baseForCap * REGRET_PENALTY_CAP_RATIO;
      const appliedRegretPenalty = Math.min(totalRegretPenalty, maxRegretPenalty);
      provenance.total_regret_penalty = totalRegretPenalty;
      provenance.regret_penalty_capped = totalRegretPenalty > maxRegretPenalty;
      utility -= appliedRegretPenalty;
      
      if (provenance.regret_penalty_capped) {
        provenance.penalties.push({ 
          reason: `regret_penalty_capped_from_${totalRegretPenalty.toFixed(3)}_to_${appliedRegretPenalty.toFixed(3)}`, 
          amount: totalRegretPenalty - appliedRegretPenalty 
        });
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
      
      // Store provenance hash, full log only for anomalies
      const provenanceHash = hashProvenance(provenance);
      provenanceHashes.push(provenanceHash);
      if (isAnomalousProvenance(provenance)) {
        anomalousProvenance.push(provenance);
      }
      provenanceLog.push(provenance);

      rankedCreatives.push({
        ...creative,
        utility_score: utility,
        genome_boosted: genome?.genome_confidence > 0.5,
        regret_penalty_capped: provenance.regret_penalty_capped, // Cheap boolean for metadata
        gated: false,
        provenance_hash: provenanceHash,
        provenance: isAnomalousProvenance(provenance) ? provenance : undefined,
        rank_position: 0,
      });
    }

    // Sort and assign ranks
    rankedCreatives.sort((a, b) => (b.utility_score || 0) - (a.utility_score || 0));
    rankedCreatives.forEach((c, i) => { c.rank_position = i + 1; });

    // Log entropy state transition if changed
    if (currentEntropyState !== 'healthy' || totalCreatives > 10) {
      console.log(`[CRL Entropy] user=${user.id} state=${currentEntropyState} normalized=${normalizedEntropy.toFixed(3)} clusters=${Object.keys(clusterDistribution).length}`);
    }

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

    console.log(`[CRL] user=${user.id} ranked=${rankedCreatives.length} gated=${gatedCreatives.length} entropy=${normalizedEntropy.toFixed(2)} anomalies=${anomalousProvenance.length}`);

    return new Response(
      JSON.stringify({
        ranked: rankedCreatives,
        gated: gatedCreatives,
        provenance_hashes: provenanceHashes,
        anomalous_provenance: anomalousProvenance, // Full logs only for anomalies
        metadata: {
          total_input: inputCreatives.length,
          total_ranked: rankedCreatives.length,
          total_gated: gatedCreatives.length,
          normalized_entropy: normalizedEntropy,
          entropy_state: currentEntropyState,
          entropy_transition: entropyTransition,
          low_entropy_warning: isLowEntropy,
          genome_active: genome?.genome_confidence > 0.5,
          regret_penalties_capped: rankedCreatives.filter(c => c.regret_penalty_capped).length,
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
