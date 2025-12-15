import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMA_DECAY = 0.2;
const CONFIDENCE_INCREMENT = 0.02;
const MAX_CONFIDENCE = 0.95;
const SHOCK_WINDOW = 5;

// Wilson score for platform success smoothing (95% lower bound)
function wilsonScore(wins: number, total: number): number {
  if (total === 0) return 0.5;
  const z = 1.96;
  const p = wins / total;
  const denominator = 1 + z * z / total;
  const center = p + z * z / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total);
  return (center - spread) / denominator;
}

// Confidence shock decay: reduce confidence when recent performance drops
function calculateShockDecay(
  currentConfidence: number,
  recentOutcomes: Array<{ roas?: number; stability_score?: number }>
): { newConfidence: number; shockApplied: boolean; shockReason?: string } {
  if (recentOutcomes.length < SHOCK_WINDOW) {
    return { newConfidence: currentConfidence, shockApplied: false };
  }

  const recent = recentOutcomes.slice(-SHOCK_WINDOW);
  const avgRoas = recent.reduce((sum, o) => sum + (o.roas || 1), 0) / recent.length;
  const avgStability = recent.reduce((sum, o) => sum + (o.stability_score || 0.5), 0) / recent.length;

  // Shock: ROAS dropped below 0.7 for rolling window
  if (avgRoas < 0.7) {
    const decay = Math.min(0.2, currentConfidence * 0.3);
    return { 
      newConfidence: Math.max(0.1, currentConfidence - decay), 
      shockApplied: true,
      shockReason: `low_roas_avg=${avgRoas.toFixed(2)}`
    };
  }

  // Shock: Stability dropped below 0.3
  if (avgStability < 0.3) {
    const decay = Math.min(0.15, currentConfidence * 0.2);
    return { 
      newConfidence: Math.max(0.1, currentConfidence - decay), 
      shockApplied: true,
      shockReason: `low_stability_avg=${avgStability.toFixed(2)}`
    };
  }

  return { newConfidence: currentConfidence, shockApplied: false };
}

function emaUpdate(current: number[], newValue: number[], decay: number): number[] {
  if (!current?.length) return newValue;
  if (!newValue?.length) return current;
  const maxLen = Math.max(current.length, newValue.length);
  return Array.from({ length: maxLen }, (_, i) => 
    (current[i] || 0) * (1 - decay) + (newValue[i] || 0) * decay
  );
}

function calculateIntraGenomeEntropy(styleClusters: Record<string, number>): number {
  const values = Object.values(styleClusters);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of values) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Normalized entropy for consistent state tracking
function calculateNormalizedEntropy(styleClusters: Record<string, number>): number {
  const values = Object.values(styleClusters);
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

function getEntropyState(normalizedEntropy: number): 'healthy' | 'warning' | 'critical' {
  if (normalizedEntropy >= 0.6) return 'healthy';
  if (normalizedEntropy >= 0.4) return 'warning';
  return 'critical';
}

function createOutcomeEmbedding(metrics: Record<string, unknown>, isProfitable: boolean, isStable: boolean): number[] {
  return [
    (metrics.roas as number) || 0,
    (metrics.ctr as number) || 0,
    (metrics.conversion_rate as number) || 0,
    (metrics.stability_score as number) || 0.5,
    isProfitable ? 1 : 0,
    isStable ? 1 : 0,
  ];
}

function createStyleEmbedding(styleCluster: string): number[] {
  const hash = styleCluster.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(hash * (i + 1)) * 0.5 + 0.5);
}

interface UpdateLog {
  updated: boolean;
  reason: string;
  shock_applied: boolean;
  shock_reason?: string;
  confidence_before: number;
  confidence_after: number;
  mutations: string[];
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

    const { outcomes } = await req.json();
    if (!outcomes || !Array.isArray(outcomes)) {
      throw new Error('outcomes array required');
    }

    // Fetch or create genome
    let { data: genome } = await supabase
      .from('creator_genomes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!genome) {
      const { data: created, error: createError } = await supabase
        .from('creator_genomes')
        .insert({
          user_id: user.id,
          genome_confidence: 0.1,
          style_embedding: [],
          text_embedding: [],
          outcome_embedding: [],
          platform_success: {},
          style_clusters: {},
          baseline_risk_appetite: 0.5,
          decay_sensitivity: 0.5,
          regret_sensitivity: { positive: 0.5, negative: 0.5 },
          total_creatives: 0,
          profitable_creatives: 0,
          intra_genome_entropy: 0,
          vertical_preferences: [],
          mutation_history: [],
        })
        .select()
        .single();
      if (createError) throw createError;
      genome = created;
    }

    // Fetch recent outcomes for shock decay calculation
    const { data: recentCreatives } = await supabase
      .from('creatives')
      .select('performance_metrics')
      .eq('user_id', user.id)
      .not('performance_metrics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentOutcomes = (recentCreatives || []).map(c => c.performance_metrics as Record<string, unknown>);

    const updateLog: UpdateLog = {
      updated: false,
      reason: '',
      shock_applied: false,
      confidence_before: genome.genome_confidence || 0,
      confidence_after: genome.genome_confidence || 0,
      mutations: [],
    };

    let styleEmbedding = genome.style_embedding || [];
    let outcomeEmbedding = genome.outcome_embedding || [];
    const platformSuccess = { ...(genome.platform_success || {}) };
    const styleClusters = { ...(genome.style_clusters || {}) };
    let totalCreatives = genome.total_creatives || 0;
    let profitableCreatives = genome.profitable_creatives || 0;
    let genomeConfidence = genome.genome_confidence || 0.1;
    let mutationHistory = genome.mutation_history || [];

    for (const outcome of outcomes) {
      const metrics = outcome.performance_metrics || {};
      const isProfitable = (metrics.roas || 0) >= 1.0;
      const isStable = (metrics.stability_score || 0.5) >= 0.5;

      // Only update genome for profitable + stable outcomes (drift resistance)
      if (isProfitable && isStable) {
        styleEmbedding = emaUpdate(styleEmbedding, createStyleEmbedding(outcome.style_cluster || 'unknown'), EMA_DECAY);
        outcomeEmbedding = emaUpdate(outcomeEmbedding, createOutcomeEmbedding(metrics, isProfitable, isStable), EMA_DECAY);
        profitableCreatives++;
        genomeConfidence = Math.min(MAX_CONFIDENCE, genomeConfidence + CONFIDENCE_INCREMENT);
        updateLog.updated = true;
        updateLog.mutations.push(`ema_update_${outcome.creative_id}`);
      }

      // Always update platform success with Wilson smoothing
      const platform = (outcome.platform || 'unknown').toLowerCase();
      if (!platformSuccess[platform]) {
        platformSuccess[platform] = { wins: 0, total: 0, smoothed_rate: 0.5, avg_roas: null };
      }
      platformSuccess[platform].total++;
      if (isProfitable) platformSuccess[platform].wins++;
      platformSuccess[platform].smoothed_rate = wilsonScore(
        platformSuccess[platform].wins,
        platformSuccess[platform].total
      );
      if (metrics.roas !== null && metrics.roas !== undefined) {
        const ps = platformSuccess[platform];
        ps.avg_roas = ps.avg_roas !== null
          ? ps.avg_roas * (1 - EMA_DECAY) + metrics.roas * EMA_DECAY
          : metrics.roas;
      }

      // Update style clusters with Wilson smoothing
      const cluster = outcome.style_cluster || 'unknown';
      if (!styleClusters[cluster]) {
        styleClusters[cluster] = { count: 0, successes: 0, smoothed_rate: 0.5 };
      }
      styleClusters[cluster].count++;
      if (isProfitable) styleClusters[cluster].successes++;
      styleClusters[cluster].smoothed_rate = wilsonScore(
        styleClusters[cluster].successes,
        styleClusters[cluster].count
      );

      totalCreatives++;

      // Update regret memory for non-profitable outcomes
      if (!isProfitable || !isStable) {
        const tier = (metrics.roas || 0) < 0 ? 1 : (metrics.roas || 0) < 0.8 ? 2 : 3;
        const severity = Math.max(0, 1 - (metrics.roas || 0)) * (isStable ? 0.5 : 1);
        
        await supabase.from('regret_memory').insert({
          user_id: user.id,
          creative_id: outcome.creative_id,
          tier,
          context: {
            platform: outcome.platform,
            style_cluster: outcome.style_cluster,
            roas: metrics.roas,
            spend: metrics.spend,
          },
          regret_vector: { style_cluster: outcome.style_cluster, platform: outcome.platform },
          volatility_score: 1 - (metrics.stability_score || 0.5),
          severity,
        });
      }

      // Update creative record
      await supabase
        .from('creatives')
        .update({ performance_metrics: metrics, published_at: new Date().toISOString() })
        .eq('id', outcome.creative_id)
        .eq('user_id', user.id);
    }

    // === SHOCK DECAY (always check) ===
    const shockResult = calculateShockDecay(genomeConfidence, recentOutcomes);
    if (shockResult.shockApplied) {
      genomeConfidence = shockResult.newConfidence;
      updateLog.shock_applied = true;
      updateLog.shock_reason = shockResult.shockReason;
      mutationHistory.push({
        type: 'confidence_shock',
        reason: shockResult.shockReason,
        confidence_before: updateLog.confidence_before,
        confidence_after: genomeConfidence,
        timestamp: new Date().toISOString(),
      });
      // Keep mutation history bounded
      if (mutationHistory.length > 50) mutationHistory = mutationHistory.slice(-50);
    }

    updateLog.confidence_after = genomeConfidence;
    updateLog.reason = updateLog.updated 
      ? 'profitable_stable_outcomes_processed' 
      : 'no_profitable_stable_outcomes';

    const clusterCounts = Object.fromEntries(
      Object.entries(styleClusters).map(([k, v]) => [k, (v as { count: number }).count || 0])
    );
    const intraGenomeEntropy = calculateIntraGenomeEntropy(clusterCounts);
    const normalizedEntropy = calculateNormalizedEntropy(clusterCounts);
    const entropyState = getEntropyState(normalizedEntropy);

    // Save genome with entropy state for CRL transition tracking
    const { data: savedGenome, error: updateError } = await supabase
      .from('creator_genomes')
      .update({
        style_embedding: styleEmbedding,
        outcome_embedding: outcomeEmbedding,
        platform_success: platformSuccess,
        style_clusters: styleClusters,
        total_creatives: totalCreatives,
        profitable_creatives: profitableCreatives,
        genome_confidence: genomeConfidence,
        intra_genome_entropy: intraGenomeEntropy,
        mutation_history: mutationHistory,
        last_entropy_state: entropyState,
        last_entropy_value: normalizedEntropy,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`[Genome] user=${user.id} outcomes=${outcomes.length} confidence=${genomeConfidence.toFixed(2)} shock=${updateLog.shock_applied}`);

    return new Response(
      JSON.stringify({
        genome: savedGenome,
        update_log: updateLog,
        processed_outcomes: outcomes.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('update_genome error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
