import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Creative {
  id: string;
  user_id: string;
  platform: string;
  creative_data: Record<string, unknown>;
  performance_metrics: {
    ctr: number | null;
    cpa: number | null;
    roas: number | null;
    conversion_rate: number | null;
    spend: number;
    decay_curve: number[];
    engagement_decay: number | null;
    policy_flags: string[];
    stability_score: number | null;
  };
  style_cluster: string | null;
  utility_score: number | null;
}

interface RegretMemory {
  tier: number;
  context: Record<string, unknown>;
  regret_vector: Record<string, unknown>;
  volatility_score: number;
  severity: number;
}

interface CreatorGenome {
  genome_confidence: number;
  style_clusters: Record<string, number>;
  platform_success: Record<string, { wins: number; total: number; avg_roas: number | null }>;
  baseline_risk_appetite: number;
}

// Utility function weights
const WEIGHTS = {
  expected_roi: 0.4,
  conversion_stability: 0.25,
  retention_impact: 0.2,
  novelty_bonus: 0.15,
};

// Calculate Bayesian expected ROI with uncertainty
function calculateExpectedROI(creative: Creative, priorMean = 1.0, priorVariance = 0.5): number {
  const metrics = creative.performance_metrics;
  if (!metrics.roas) return priorMean;
  
  const n = metrics.spend > 0 ? Math.min(metrics.spend / 100, 10) : 0; // Sample size proxy
  const posteriorMean = (priorVariance * metrics.roas + (1/n) * priorMean) / (priorVariance + 1/n);
  
  return posteriorMean;
}

// Calculate conversion stability from decay curve
function calculateConversionStability(creative: Creative): number {
  const metrics = creative.performance_metrics;
  if (!metrics.stability_score) {
    // Estimate from decay curve if available
    if (metrics.decay_curve && metrics.decay_curve.length > 1) {
      const variance = calculateVariance(metrics.decay_curve);
      return Math.max(0, 1 - variance);
    }
    return 0.5; // Default moderate stability
  }
  return metrics.stability_score;
}

function calculateVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
}

// Calculate retention impact based on engagement decay
function calculateRetentionImpact(creative: Creative): number {
  const metrics = creative.performance_metrics;
  if (metrics.engagement_decay !== null) {
    // Lower decay = better retention
    return Math.max(0, 1 - metrics.engagement_decay);
  }
  // Estimate from CTR trend
  if (metrics.ctr !== null) {
    return Math.min(1, metrics.ctr * 10); // Normalize CTR
  }
  return 0.5;
}

// Calculate novelty bonus based on style cluster distribution
function calculateNoveltyBonus(
  creative: Creative, 
  clusterDistribution: Record<string, number>,
  totalCreatives: number
): number {
  const cluster = creative.style_cluster || 'unknown';
  const clusterCount = clusterDistribution[cluster] || 0;
  const clusterRatio = totalCreatives > 0 ? clusterCount / totalCreatives : 0;
  
  // Higher novelty for underrepresented clusters
  return Math.max(0, 1 - clusterRatio);
}

// Calculate utility score
function calculateUtility(
  creative: Creative,
  clusterDistribution: Record<string, number>,
  totalCreatives: number,
  genome: CreatorGenome | null
): number {
  const expectedROI = calculateExpectedROI(creative);
  const stability = calculateConversionStability(creative);
  const retention = calculateRetentionImpact(creative);
  const novelty = calculateNoveltyBonus(creative, clusterDistribution, totalCreatives);
  
  let utility = 
    WEIGHTS.expected_roi * expectedROI +
    WEIGHTS.conversion_stability * stability +
    WEIGHTS.retention_impact * retention +
    WEIGHTS.novelty_bonus * novelty;
  
  // Apply genome bonus (max 25% boost) if confidence > 0.5
  if (genome && genome.genome_confidence > 0.5) {
    const platformSuccess = genome.platform_success[creative.platform];
    if (platformSuccess && platformSuccess.total > 0) {
      const winRate = platformSuccess.wins / platformSuccess.total;
      const genomeBonus = Math.min(0.25, winRate * 0.3); // Cap at 25%
      utility *= (1 + genomeBonus);
    }
    
    // Style cluster affinity bonus
    const clusterAffinity = genome.style_clusters[creative.style_cluster || 'unknown'] || 0;
    if (clusterAffinity > 0.5) {
      utility *= (1 + Math.min(0.1, clusterAffinity * 0.15)); // Small additional boost
    }
  }
  
  return utility;
}

// Check hard constraints
function passesHardConstraints(
  creative: Creative,
  clusterDistribution: Record<string, number>,
  totalCreatives: number,
  regretMemory: RegretMemory[]
): { passes: boolean; reason?: string } {
  const metrics = creative.performance_metrics;
  
  // Gate 1: Negative ROI drift
  if (metrics.roas !== null && metrics.roas < 0) {
    return { passes: false, reason: 'negative_roi' };
  }
  
  // Gate 2: Policy flags
  if (metrics.policy_flags && metrics.policy_flags.length > 0) {
    return { passes: false, reason: 'policy_violation' };
  }
  
  // Gate 3: Max 30% same style cluster
  const cluster = creative.style_cluster || 'unknown';
  const clusterCount = clusterDistribution[cluster] || 0;
  if (totalCreatives > 3 && clusterCount / totalCreatives > 0.3) {
    // Check if this cluster has high regret
    const clusterRegrets = regretMemory.filter(
      r => r.context.style_cluster === cluster && r.tier === 1
    );
    if (clusterRegrets.length > 2) {
      return { passes: false, reason: 'cluster_saturation_with_regret' };
    }
  }
  
  // Gate 4: High severity regret patterns
  const highSeverityRegrets = regretMemory.filter(r => r.severity > 0.8 && r.tier === 1);
  for (const regret of highSeverityRegrets) {
    if (regret.context.platform === creative.platform) {
      // Check if creative matches regret pattern
      const regretVector = regret.regret_vector as Record<string, unknown>;
      if (regretVector.style_cluster === creative.style_cluster) {
        return { passes: false, reason: 'matches_high_regret_pattern' };
      }
    }
  }
  
  return { passes: true };
}

// Near-miss promotion from regret memory
function applyNearMissPromotion(
  creative: Creative,
  regretMemory: RegretMemory[]
): number {
  // Find tier 2 (near-miss) regrets that might indicate potential
  const nearMisses = regretMemory.filter(r => r.tier === 2);
  let promotionBonus = 0;
  
  for (const nearMiss of nearMisses) {
    const context = nearMiss.context as Record<string, unknown>;
    // If creative is similar to a near-miss but has improvements
    if (context.platform === creative.platform && 
        context.style_cluster === creative.style_cluster &&
        nearMiss.volatility_score < 0.3) { // Low volatility = more reliable signal
      promotionBonus += 0.05 * (1 - nearMiss.severity);
    }
  }
  
  return Math.min(0.15, promotionBonus); // Cap promotion bonus
}

// Monitor cluster entropy for drift detection
function calculateClusterEntropy(clusterDistribution: Record<string, number>, total: number): number {
  if (total === 0) return 0;
  
  let entropy = 0;
  for (const count of Object.values(clusterDistribution)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
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
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { creatives: inputCreatives, campaign_id } = await req.json();

    if (!inputCreatives || !Array.isArray(inputCreatives)) {
      throw new Error('creatives array required');
    }

    // Fetch user's genome
    const { data: genome } = await supabase
      .from('creator_genomes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch regret memory
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

    // Calculate cluster distribution
    const clusterDistribution: Record<string, number> = {};
    const totalCreatives = recentCreatives?.length || 0;
    for (const c of recentCreatives || []) {
      const cluster = c.style_cluster || 'unknown';
      clusterDistribution[cluster] = (clusterDistribution[cluster] || 0) + 1;
    }

    // Calculate cluster entropy for drift monitoring
    const clusterEntropy = calculateClusterEntropy(clusterDistribution, totalCreatives);
    const isLowEntropy = clusterEntropy < 1.5 && totalCreatives > 10; // Potential convergence

    // Rank creatives
    const rankedCreatives = [];
    const gatedCreatives = [];

    for (const creative of inputCreatives as Creative[]) {
      // Check hard constraints
      const constraintCheck = passesHardConstraints(
        creative,
        clusterDistribution,
        totalCreatives,
        regretMemory || []
      );

      if (!constraintCheck.passes) {
        gatedCreatives.push({
          ...creative,
          gated: true,
          gate_reason: constraintCheck.reason,
        });
        continue;
      }

      // Calculate utility
      let utility = calculateUtility(
        creative,
        clusterDistribution,
        totalCreatives,
        genome as CreatorGenome | null
      );

      // Apply near-miss promotion
      const promotionBonus = applyNearMissPromotion(creative, regretMemory || []);
      utility += promotionBonus;

      // Apply low entropy penalty for convergent clusters
      if (isLowEntropy && clusterDistribution[creative.style_cluster || 'unknown'] > 5) {
        utility *= 0.85; // Penalize dominant clusters during low entropy
      }

      rankedCreatives.push({
        ...creative,
        utility_score: utility,
        genome_boosted: genome?.genome_confidence > 0.5,
        promotion_bonus: promotionBonus,
        rank_position: 0,
      });
    }

    // Sort by utility score
    rankedCreatives.sort((a, b) => (b.utility_score || 0) - (a.utility_score || 0));

    // Assign rank positions
    for (let idx = 0; idx < rankedCreatives.length; idx++) {
      rankedCreatives[idx].rank_position = idx + 1;
    }

    // Store ranked creatives in database
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

    // Log ranking event for audit
    console.log(`[rank_creatives] user=${user.id} ranked=${rankedCreatives.length} gated=${gatedCreatives.length} entropy=${clusterEntropy.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        ranked: rankedCreatives,
        gated: gatedCreatives,
        metadata: {
          total_input: inputCreatives.length,
          total_ranked: rankedCreatives.length,
          total_gated: gatedCreatives.length,
          cluster_entropy: clusterEntropy,
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
