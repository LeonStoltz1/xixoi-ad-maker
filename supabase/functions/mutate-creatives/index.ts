import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mutation types
type MutationType = 'platform_expansion' | 'style_shift' | 'cta_variant' | 'hook_variant' | 'length_variant' | 'regret_avoidance';

interface Mutation {
  type: MutationType;
  param: string;
  delta: string | number;
  reason: string;
}

interface MutationProvenance {
  creative_id: string;
  mutation_key: string;
  base_style_cluster: string;
  platform: string;
  mutations: Mutation[];
  mutation_score: number;
  source: 'exploit' | 'explore' | 'regret_avoidance';
  rank_before: number;
}

interface MutationEventInsert {
  user_id: string;
  creative_id: string;
  mutation_key: string;
  campaign_id?: string | null;
  platform?: string;
  base_style_cluster?: string;
  mutations: Mutation[];
  mutation_score?: number;
  rank_before: number;
  applied: boolean;
}

// Constants
const MAX_NEW_VARIANTS = 12;
const MAX_MUTATIONS_PER_CREATIVE = 3;

// Deterministic seeded pick to replace Math.random()
function seededPick(seedStr: string, options: string[]): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

// Wilson score for Bayesian smoothing
function wilsonScore(wins: number, total: number): number {
  if (total === 0) return 0.5;
  const z = 1.96;
  const p = wins / total;
  const denominator = 1 + z * z / total;
  const center = p + z * z / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total);
  return (center - spread) / denominator;
}

// Time-decayed severity
function getDecayedSeverity(severity: number, createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const lambda = 0.05;
  return severity * Math.exp(-lambda * ageDays);
}

// Generate exploit mutations (genome-driven)
function generateExploitMutations(
  creative: Record<string, unknown>,
  genome: Record<string, unknown>,
  rankPosition: number
): { mutated: Record<string, unknown>; provenance: MutationProvenance }[] {
  const results: { mutated: Record<string, unknown>; provenance: MutationProvenance }[] = [];
  const platformSuccess = genome.platform_success as Record<string, { wins?: number; successes?: number; total?: number; count?: number; avg_roas?: number; smoothed_rate?: number }> || {};
  const styleClusters = genome.style_clusters as Record<string, { count?: number; successes?: number; smoothed_rate?: number; success_rate?: number; avg_roas?: number } | number> || {};
  const creativeData = (creative.creative_data as Record<string, unknown>) || {};
  const baseCluster = (creative.style_cluster || creativeData.style_cluster || 'unknown') as string;
  const basePlatform = creative.platform as string;

  // Find top platforms by composite score (Wilson + ROAS)
  const platformScores = Object.entries(platformSuccess)
    .map(([platform, stats]) => {
      const wins = stats.wins ?? stats.successes ?? 0;
      const total = stats.total ?? stats.count ?? 0;
      const avgRoas = stats.avg_roas ?? 1.0;
      const wilsonPart = wilsonScore(wins, total) * 0.7;
      const roasPart = Math.min(avgRoas / 2.0, 1.0) * 0.3;
      return {
        platform,
        score: wilsonPart + roasPart,
        total,
      };
    })
    .filter(p => p.total >= 3)
    .sort((a, b) => b.score - a.score);

  // Generate platform expansion variant if top platform differs
  if (platformScores.length > 0 && platformScores[0].platform !== basePlatform) {
    const topPlatform = platformScores[0];
    const mutationKey = `platform:${topPlatform.platform}`;
    results.push({
      mutated: {
        ...creative,
        id: creative.id, // Keep original ID unchanged
        is_mutation: true,
        mutation_parent_id: creative.id,
        mutation_key: mutationKey,
        platform: topPlatform.platform,
        mutation_source: 'exploit',
      },
      provenance: {
        creative_id: creative.id as string,
        mutation_key: mutationKey,
        base_style_cluster: baseCluster,
        platform: topPlatform.platform,
        mutations: [{
          type: 'platform_expansion',
          param: 'platform',
          delta: topPlatform.platform,
          reason: `Top platform by composite score (${topPlatform.score.toFixed(3)})`,
        }],
        mutation_score: topPlatform.score,
        source: 'exploit',
        rank_before: rankPosition,
      },
    });
  }

  // Find top style clusters - handle both schema formats
  const topClusters = Object.entries(styleClusters)
    .filter(([cluster]) => cluster !== baseCluster)
    .map(([cluster, data]) => {
      // Handle both formats: number (affinity) or object (with smoothed_rate/count)
      if (typeof data === 'number') {
        return { cluster, rate: data, total: 1 };
      }
      return {
        cluster,
        rate: data.smoothed_rate ?? data.success_rate ?? 0.5,
        total: data.count ?? 0,
      };
    })
    .filter(x => typeof x.total === 'number' ? x.total >= 3 || x.rate > 0.6 : true)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 2);

  for (const { cluster, rate } of topClusters) {
    if (rate > 0.6 && results.length < MAX_MUTATIONS_PER_CREATIVE) {
      const mutationKey = `style:${cluster}`;
      results.push({
        mutated: {
          ...creative,
          id: creative.id, // Keep original ID unchanged
          is_mutation: true,
          mutation_parent_id: creative.id,
          mutation_key: mutationKey,
          style_cluster: cluster,
          creative_data: { ...(creative.creative_data as Record<string, unknown> || {}), style_cluster: cluster },
          mutation_source: 'exploit',
        },
        provenance: {
          creative_id: creative.id as string,
          mutation_key: mutationKey,
          base_style_cluster: baseCluster,
          platform: basePlatform,
          mutations: [{
            type: 'style_shift',
            param: 'style_cluster',
            delta: cluster,
            reason: `High smoothed_rate (${rate.toFixed(3)})`,
          }],
          mutation_score: rate,
          source: 'exploit',
          rank_before: rankPosition,
        },
      });
    }
  }

  return results;
}

// Generate explore mutations (gap-driven)
function generateExploreMutations(
  creative: Record<string, unknown>,
  genome: Record<string, unknown>,
  normalizedEntropy: number,
  rankPosition: number
): { mutated: Record<string, unknown>; provenance: MutationProvenance }[] {
  const results: { mutated: Record<string, unknown>; provenance: MutationProvenance }[] = [];
  const platformSuccess = genome.platform_success as Record<string, { wins?: number; successes?: number; total?: number; count?: number; avg_roas?: number }> || {};
  const creativeData = (creative.creative_data as Record<string, unknown>) || {};
  const baseCluster = (creative.style_cluster || creativeData.style_cluster || 'unknown') as string;
  const basePlatform = creative.platform as string;
  const riskAppetite = (genome.baseline_risk_appetite as number || 0.5) + (genome.contextual_risk_modifier as number || 0);

  // Low entropy = need exploration
  const explorationBoost = normalizedEntropy < 0.4 ? (0.4 - normalizedEntropy) * 2 : 0;

  // Find under-explored platforms with decent avg_roas
  const underExploredPlatforms = Object.entries(platformSuccess)
    .filter(([platform, stats]) => {
      const total = stats.total ?? stats.count ?? 0;
      return platform !== basePlatform && 
             total < 5 && 
             total >= 1 && 
             (stats.avg_roas || 0) > 0.8;
    })
    .map(([platform, stats]) => {
      const total = stats.total ?? stats.count ?? 0;
      return {
        platform,
        potential: (stats.avg_roas || 1) * (1 + explorationBoost) * riskAppetite,
        total,
      };
    })
    .sort((a, b) => b.potential - a.potential);

  for (const candidate of underExploredPlatforms.slice(0, 2)) {
    if (results.length < MAX_MUTATIONS_PER_CREATIVE) {
      const mutationKey = `explore:${candidate.platform}`;
      results.push({
        mutated: {
          ...creative,
          id: creative.id, // Keep original ID unchanged
          is_mutation: true,
          mutation_parent_id: creative.id,
          mutation_key: mutationKey,
          platform: candidate.platform,
          mutation_source: 'explore',
        },
        provenance: {
          creative_id: creative.id as string,
          mutation_key: mutationKey,
          base_style_cluster: baseCluster,
          platform: candidate.platform,
          mutations: [{
            type: 'platform_expansion',
            param: 'platform',
            delta: candidate.platform,
            reason: `Under-explored with decent ROAS (${candidate.total} tries, potential=${candidate.potential.toFixed(3)})`,
          }],
          mutation_score: candidate.potential,
          source: 'explore',
          rank_before: rankPosition,
        },
      });
    }
  }

  // CTA variant for exploration - use deterministic selection
  if (normalizedEntropy < 0.4 && results.length < MAX_MUTATIONS_PER_CREATIVE) {
    const ctaVariants = ['Shop Now', 'Learn More', 'Get Started', 'Try Free', 'Sign Up'];
    const currentCta = (creative.creative_data as Record<string, unknown>)?.cta_text || 'Learn More';
    const availableCtas = ctaVariants.filter(c => c !== currentCta);
    const newCta = seededPick(`${creative.id}:cta`, availableCtas);
    const mutationKey = `cta:${newCta.toLowerCase().replace(/\s+/g, '_')}`;
    
    results.push({
      mutated: {
        ...creative,
        id: creative.id, // Keep original ID unchanged
        is_mutation: true,
        mutation_parent_id: creative.id,
        mutation_key: mutationKey,
        creative_data: { ...(creative.creative_data as Record<string, unknown> || {}), cta_text: newCta },
        mutation_source: 'explore',
      },
      provenance: {
        creative_id: creative.id as string,
        mutation_key: mutationKey,
        base_style_cluster: baseCluster,
        platform: basePlatform,
        mutations: [{
          type: 'cta_variant',
          param: 'cta_text',
          delta: newCta,
          reason: `Low entropy exploration (${normalizedEntropy.toFixed(3)})`,
        }],
        mutation_score: explorationBoost * riskAppetite,
        source: 'explore',
        rank_before: rankPosition,
      },
    });
  }

  return results;
}

// Generate regret-avoidance mutations
function generateRegretAvoidanceMutations(
  creative: Record<string, unknown>,
  regretMemory: Record<string, unknown>[],
  rankPosition: number
): { mutated: Record<string, unknown>; provenance: MutationProvenance }[] {
  const results: { mutated: Record<string, unknown>; provenance: MutationProvenance }[] = [];
  const creativeData = (creative.creative_data as Record<string, unknown>) || {};
  const baseCluster = (creative.style_cluster || creativeData.style_cluster || 'unknown') as string;
  const basePlatform = creative.platform as string;

  // Find relevant high-severity regrets
  const relevantRegrets = regretMemory
    .filter(r => {
      const ctx = r.context as Record<string, unknown> || {};
      const decayed = getDecayedSeverity(r.severity as number || 0.5, r.created_at as string);
      return decayed > 0.3 && r.tier === 1 && (ctx.style_cluster === baseCluster || ctx.platform === basePlatform);
    })
    .slice(0, 3);

  for (const regret of relevantRegrets) {
    const ctx = regret.context as Record<string, unknown> || {};
    
    // Mutate away from regret pattern
    if (ctx.style_cluster === baseCluster && results.length < MAX_MUTATIONS_PER_CREATIVE) {
      // Shift to different style using deterministic selection
      const alternativeStyles = ['minimalist', 'bold', 'professional', 'playful', 'elegant']
        .filter(s => s !== baseCluster);
      const newStyle = seededPick(`${creative.id}:${regret.id}`, alternativeStyles);
      const mutationKey = `avoid:${regret.id}:${newStyle}`;
      
      results.push({
        mutated: {
          ...creative,
          id: creative.id, // Keep original ID unchanged
          is_mutation: true,
          mutation_parent_id: creative.id,
          mutation_key: mutationKey,
          style_cluster: newStyle,
          creative_data: { ...(creative.creative_data as Record<string, unknown> || {}), style_cluster: newStyle },
          mutation_source: 'regret_avoidance',
        },
        provenance: {
          creative_id: creative.id as string,
          mutation_key: mutationKey,
          base_style_cluster: baseCluster,
          platform: basePlatform,
          mutations: [{
            type: 'regret_avoidance',
            param: 'style_cluster',
            delta: newStyle,
            reason: `Avoid tier-1 regret pattern (severity=${(regret.severity as number).toFixed(3)})`,
          }],
          mutation_score: -(regret.severity as number) * 0.5, // Negative score = avoidance
          source: 'regret_avoidance',
          rank_before: rankPosition,
        },
      });
    }
  }

  return results;
}

// Calculate normalized entropy
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

    const { ranked_creatives, campaign_id, goal = 'balanced' } = await req.json();
    if (!ranked_creatives || !Array.isArray(ranked_creatives)) {
      throw new Error('ranked_creatives array required');
    }

    // Fetch genome
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

    // Fetch recent creatives for entropy calculation
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
    const normalizedEntropy = calculateNormalizedEntropy(clusterDistribution);

    const allMutations: { mutated: Record<string, unknown>; provenance: MutationProvenance }[] = [];
    const mutationEvents: MutationEventInsert[] = [];

    // Only mutate top-ranked creatives (first 4)
    const topCreatives = ranked_creatives
      .filter((c: Record<string, unknown>) => !c.gated)
      .slice(0, 4);

    for (const creative of topCreatives) {
      const rankPosition = creative.rank_position as number;

      // 1. Exploit mutations (genome-driven)
      if (genome?.genome_confidence > 0.5 && (goal === 'balanced' || goal === 'roi')) {
        const exploitMutations = generateExploitMutations(creative, genome, rankPosition);
        allMutations.push(...exploitMutations);
      }

      // 2. Explore mutations (gap-driven)
      if (normalizedEntropy < 0.6 || goal === 'exploration') {
        const exploreMutations = generateExploreMutations(creative, genome || {}, normalizedEntropy, rankPosition);
        allMutations.push(...exploreMutations);
      }

      // 3. Regret-avoidance mutations
      if (regretMemory && regretMemory.length > 0) {
        const avoidanceMutations = generateRegretAvoidanceMutations(creative, regretMemory, rankPosition);
        allMutations.push(...avoidanceMutations);
      }

      // Cap mutations per request
      if (allMutations.length >= MAX_NEW_VARIANTS) break;
    }

    // Deduplicate and cap
    const uniqueMutations = allMutations
      .slice(0, MAX_NEW_VARIANTS)
      .filter((m, i, arr) => arr.findIndex(x => x.provenance.mutation_key === m.provenance.mutation_key) === i);

    // Store mutation events with mutation_key for reliable outcome matching
    for (const { mutated, provenance } of uniqueMutations) {
      const event: MutationEventInsert = {
        user_id: user.id,
        creative_id: provenance.creative_id,
        mutation_key: provenance.mutation_key,
        campaign_id: campaign_id || null,
        platform: provenance.platform,
        base_style_cluster: provenance.base_style_cluster,
        mutations: provenance.mutations,
        mutation_score: provenance.mutation_score,
        rank_before: provenance.rank_before,
        applied: true,
      };
      mutationEvents.push(event);
    }

    if (mutationEvents.length > 0) {
      await supabase.from('mutation_events').insert(mutationEvents);
    }

    console.log(`[Mutate] user=${user.id} input=${ranked_creatives.length} mutations=${uniqueMutations.length} entropy=${normalizedEntropy.toFixed(3)} goal=${goal}`);

    return new Response(
      JSON.stringify({
        original_creatives: ranked_creatives,
        mutated_creatives: uniqueMutations.map(m => m.mutated),
        mutation_provenance: uniqueMutations.map(m => m.provenance),
        metadata: {
          total_input: ranked_creatives.length,
          total_mutations: uniqueMutations.length,
          normalized_entropy: normalizedEntropy,
          genome_confidence: genome?.genome_confidence || 0,
          goal,
          exploit_count: uniqueMutations.filter(m => m.provenance.source === 'exploit').length,
          explore_count: uniqueMutations.filter(m => m.provenance.source === 'explore').length,
          avoidance_count: uniqueMutations.filter(m => m.provenance.source === 'regret_avoidance').length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('mutate_creatives error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
