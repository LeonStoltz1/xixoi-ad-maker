import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EMA decay factor
const EMA_DECAY = 0.2;

interface CreativeOutcome {
  creative_id: string;
  platform: string;
  style_cluster: string;
  performance_metrics: {
    roas: number | null;
    ctr: number | null;
    conversion_rate: number | null;
    stability_score: number | null;
    spend: number;
  };
  is_profitable: boolean;
  is_stable: boolean;
}

interface PlatformSuccess {
  wins: number;
  total: number;
  avg_roas: number | null;
}

interface GenomeData {
  user_id: string;
  genome_confidence: number;
  style_embedding: number[];
  text_embedding: number[];
  outcome_embedding: number[];
  platform_success: Record<string, PlatformSuccess>;
  style_clusters: Record<string, number>;
  baseline_risk_appetite: number;
  decay_sensitivity: number;
  regret_sensitivity: { positive: number; negative: number };
  total_creatives: number;
  profitable_creatives: number;
  intra_genome_entropy: number;
  vertical_preferences: string[];
}

// EMA update for embeddings
function emaUpdate(current: number[], newValue: number[], decay: number): number[] {
  if (current.length === 0) return newValue;
  if (newValue.length === 0) return current;
  
  const maxLen = Math.max(current.length, newValue.length);
  const result: number[] = [];
  
  for (let i = 0; i < maxLen; i++) {
    const c = current[i] || 0;
    const n = newValue[i] || 0;
    result.push(c * (1 - decay) + n * decay);
  }
  
  return result;
}

// Calculate genome confidence based on data quality
function calculateGenomeConfidence(genome: GenomeData): number {
  const dataPoints = genome.total_creatives;
  const profitRatio = dataPoints > 0 ? genome.profitable_creatives / dataPoints : 0;
  const entropy = genome.intra_genome_entropy;
  
  // Confidence grows with more data, higher profit ratio, and moderate entropy
  let confidence = 0;
  
  // Data quantity factor (0-0.4)
  confidence += Math.min(0.4, dataPoints / 50);
  
  // Profit ratio factor (0-0.3)
  confidence += profitRatio * 0.3;
  
  // Entropy factor - prefer moderate entropy (0-0.3)
  // Very low entropy = overfit, very high = random
  const entropyScore = entropy > 0.5 && entropy < 2.5 ? 0.3 : 0.15;
  confidence += entropyScore;
  
  return Math.min(1, confidence);
}

// Calculate intra-genome entropy
function calculateIntraGenomeEntropy(styleClusters: Record<string, number>): number {
  const total = Object.values(styleClusters).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  let entropy = 0;
  for (const count of Object.values(styleClusters)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

// Create outcome embedding from metrics
function createOutcomeEmbedding(outcome: CreativeOutcome): number[] {
  const metrics = outcome.performance_metrics;
  return [
    metrics.roas || 0,
    metrics.ctr || 0,
    metrics.conversion_rate || 0,
    metrics.stability_score || 0.5,
    outcome.is_profitable ? 1 : 0,
    outcome.is_stable ? 1 : 0,
  ];
}

// Create style embedding placeholder (in production, use actual embeddings)
function createStyleEmbedding(styleCluster: string): number[] {
  // Simple hash-based embedding for demo
  const hash = styleCluster.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  const embedding: number[] = [];
  for (let i = 0; i < 8; i++) {
    embedding.push(Math.sin(hash * (i + 1)) * 0.5 + 0.5);
  }
  return embedding;
}

// Update regret memory based on outcome
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateRegretMemory(
  supabase: any,
  userId: string,
  outcome: CreativeOutcome
): Promise<void> {
  const metrics = outcome.performance_metrics;
  
  // Determine tier based on outcome quality
  let tier: number;
  let severity: number;
  
  if (!outcome.is_profitable && metrics.roas !== null && metrics.roas < 0) {
    tier = 1; // Critical regret - negative ROI
    severity = Math.min(1, Math.abs(metrics.roas));
  } else if (!outcome.is_profitable) {
    tier = 2; // Near-miss - not profitable but not negative
    severity = 0.5;
  } else if (!outcome.is_stable) {
    tier = 3; // Learning signal - profitable but unstable
    severity = 0.3;
  } else {
    return; // No regret for profitable + stable outcomes
  }
  
  // Calculate volatility from performance variance
  const volatility = metrics.stability_score !== null ? 1 - metrics.stability_score : 0.5;
  
  await supabase.from('regret_memory').insert({
    user_id: userId,
    creative_id: outcome.creative_id,
    tier,
    context: {
      platform: outcome.platform,
      style_cluster: outcome.style_cluster,
      roas: metrics.roas,
      spend: metrics.spend,
    },
    regret_vector: {
      style_cluster: outcome.style_cluster,
      platform: outcome.platform,
      outcome_type: tier === 1 ? 'negative_roi' : tier === 2 ? 'near_miss' : 'unstable',
    },
    volatility_score: volatility,
    severity,
    outcome_type: tier === 1 ? 'negative_roi' : tier === 2 ? 'near_miss' : 'unstable',
  });
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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { outcomes } = await req.json() as { outcomes: CreativeOutcome[] };

    if (!outcomes || !Array.isArray(outcomes)) {
      throw new Error('outcomes array required');
    }

    // Fetch or create genome
    let { data: genome, error: genomeError } = await supabase
      .from('creator_genomes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (genomeError || !genome) {
      // Create new genome
      const newGenome: Partial<GenomeData> = {
        user_id: user.id,
        genome_confidence: 0,
        style_embedding: [],
        text_embedding: [],
        outcome_embedding: [],
        platform_success: {
          meta: { wins: 0, total: 0, avg_roas: null },
          google: { wins: 0, total: 0, avg_roas: null },
          tiktok: { wins: 0, total: 0, avg_roas: null },
          linkedin: { wins: 0, total: 0, avg_roas: null },
          x: { wins: 0, total: 0, avg_roas: null },
        },
        style_clusters: {},
        baseline_risk_appetite: 0.5,
        decay_sensitivity: 0.5,
        regret_sensitivity: { positive: 0.5, negative: 0.5 },
        total_creatives: 0,
        profitable_creatives: 0,
        intra_genome_entropy: 0,
        vertical_preferences: [],
      };

      const { data: created, error: createError } = await supabase
        .from('creator_genomes')
        .insert(newGenome)
        .select()
        .single();

      if (createError) throw createError;
      genome = created;
    }

    // Process each outcome
    let updatedStyleEmbedding = genome.style_embedding || [];
    let updatedOutcomeEmbedding = genome.outcome_embedding || [];
    const platformSuccess = { ...genome.platform_success } as Record<string, PlatformSuccess>;
    const styleClusters = { ...genome.style_clusters } as Record<string, number>;
    let totalCreatives = genome.total_creatives || 0;
    let profitableCreatives = genome.profitable_creatives || 0;

    for (const outcome of outcomes) {
      // Only update genome for profitable + stable outcomes (drift resistance)
      if (outcome.is_profitable && outcome.is_stable) {
        // EMA update for style embedding
        const newStyleEmb = createStyleEmbedding(outcome.style_cluster);
        updatedStyleEmbedding = emaUpdate(updatedStyleEmbedding, newStyleEmb, EMA_DECAY);

        // EMA update for outcome embedding
        const newOutcomeEmb = createOutcomeEmbedding(outcome);
        updatedOutcomeEmbedding = emaUpdate(updatedOutcomeEmbedding, newOutcomeEmb, EMA_DECAY);

        profitableCreatives++;
      }

      // Always update platform success stats
      const platform = outcome.platform.toLowerCase();
      if (platformSuccess[platform]) {
        platformSuccess[platform].total++;
        if (outcome.is_profitable) {
          platformSuccess[platform].wins++;
        }
        // Update avg ROAS
        const ps = platformSuccess[platform];
        if (outcome.performance_metrics.roas !== null) {
          ps.avg_roas = ps.avg_roas !== null
            ? ps.avg_roas * (1 - EMA_DECAY) + outcome.performance_metrics.roas * EMA_DECAY
            : outcome.performance_metrics.roas;
        }
      }

      // Update style cluster counts
      const cluster = outcome.style_cluster || 'unknown';
      styleClusters[cluster] = (styleClusters[cluster] || 0) + 1;

      totalCreatives++;

      // Update regret memory
      await updateRegretMemory(supabase, user.id, outcome);

      // Update creative record with final metrics
      await supabase
        .from('creatives')
        .update({
          performance_metrics: outcome.performance_metrics,
          published_at: new Date().toISOString(),
        })
        .eq('id', outcome.creative_id)
        .eq('user_id', user.id);
    }

    // Calculate updated entropy
    const intraGenomeEntropy = calculateIntraGenomeEntropy(styleClusters);

    // Build updated genome
    const updatedGenome: Partial<GenomeData> = {
      style_embedding: updatedStyleEmbedding,
      outcome_embedding: updatedOutcomeEmbedding,
      platform_success: platformSuccess,
      style_clusters: styleClusters,
      total_creatives: totalCreatives,
      profitable_creatives: profitableCreatives,
      intra_genome_entropy: intraGenomeEntropy,
    };

    // Calculate new confidence
    updatedGenome.genome_confidence = calculateGenomeConfidence({
      ...genome,
      ...updatedGenome,
    } as GenomeData);

    // Save updated genome
    const { data: savedGenome, error: updateError } = await supabase
      .from('creator_genomes')
      .update(updatedGenome)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`[update_genome] user=${user.id} outcomes=${outcomes.length} confidence=${savedGenome.genome_confidence.toFixed(2)} entropy=${intraGenomeEntropy.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        genome: savedGenome,
        processed_outcomes: outcomes.length,
        new_confidence: savedGenome.genome_confidence,
        entropy: intraGenomeEntropy,
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
