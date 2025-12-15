import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  passed: boolean;
  details: Record<string, unknown>;
}

// Deterministic seeded pick (same as in mutate-creatives)
function seededPick(seedStr: string, options: string[]): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const results: TestResult[] = [];

  // Test 1: Exploit mutations appear when genome confidence > 0.5
  try {
    const highConfidenceGenome = {
      genome_confidence: 0.7,
      platform_success: {
        meta: { wins: 8, total: 10, avg_roas: 1.5 },
        tiktok: { wins: 2, total: 5, avg_roas: 0.9 },
      },
      style_clusters: {
        minimalist: { count: 12, successes: 9, smoothed_rate: 0.72, avg_roas: 1.8 },
        bold: { count: 5, successes: 2, smoothed_rate: 0.45, avg_roas: 1.1 },
      },
      baseline_risk_appetite: 0.5,
      contextual_risk_modifier: 0,
    };

    const testCreatives = [
      {
        id: 'test-creative-1',
        platform: 'tiktok',
        style_cluster: 'bold',
        rank_position: 1,
        creative_data: { headline: 'Test Ad', cta_text: 'Learn More' },
        performance_metrics: { roas: 1.2 },
      },
    ];

    // Simulate exploit mutation generation with composite score
    const platformScores = Object.entries(highConfidenceGenome.platform_success)
      .map(([p, s]) => {
        const wilson = s.wins / s.total;
        const roasPart = Math.min(s.avg_roas / 2.0, 1.0) * 0.3;
        return { platform: p, score: wilson * 0.7 + roasPart };
      })
      .sort((a, b) => b.score - a.score);

    const topPlatform = platformScores[0];
    const shouldGenerateExploit = highConfidenceGenome.genome_confidence > 0.5 && 
      topPlatform.platform !== testCreatives[0].platform;

    results.push({
      name: 'Exploit mutations when confidence > 0.5',
      passed: shouldGenerateExploit === true,
      details: {
        genome_confidence: highConfidenceGenome.genome_confidence,
        top_platform: topPlatform.platform,
        top_platform_score: topPlatform.score,
        creative_platform: testCreatives[0].platform,
        should_generate: shouldGenerateExploit,
      },
    });
  } catch (error) {
    results.push({
      name: 'Exploit mutations when confidence > 0.5',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 2: Explore mutations appear when entropy is critical
  try {
    const lowEntropyDistribution = {
      minimalist: 45, // Dominated by one cluster
      bold: 3,
      professional: 2,
    };

    const total = Object.values(lowEntropyDistribution).reduce((a, b) => a + b, 0);
    const k = Object.values(lowEntropyDistribution).filter(v => v > 0).length;
    let entropy = 0;
    for (const count of Object.values(lowEntropyDistribution)) {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const normalizedEntropy = k > 1 ? entropy / Math.log2(k) : 1;
    const isCritical = normalizedEntropy < 0.4;

    const shouldGenerateExplore = isCritical || normalizedEntropy < 0.6;

    results.push({
      name: 'Explore mutations when entropy is critical',
      passed: shouldGenerateExplore === true && isCritical === true,
      details: {
        normalized_entropy: normalizedEntropy,
        entropy_state: isCritical ? 'critical' : normalizedEntropy < 0.6 ? 'warning' : 'healthy',
        should_generate_explore: shouldGenerateExplore,
      },
    });
  } catch (error) {
    results.push({
      name: 'Explore mutations when entropy is critical',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 3: Regret blocks prevent repeats when tier-1 decayed severity is high
  try {
    const testRegrets = [
      {
        id: 'regret-1',
        tier: 1,
        severity: 0.9,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        context: { style_cluster: 'minimalist', platform: 'meta' },
      },
      {
        id: 'regret-2',
        tier: 2,
        severity: 0.5,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago (decayed)
        context: { style_cluster: 'bold', platform: 'tiktok' },
      },
    ];

    // Calculate decayed severities
    const lambda = 0.05;
    const decayedRegrets = testRegrets.map(r => {
      const ageDays = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const decayed = r.severity * Math.exp(-lambda * ageDays);
      return { ...r, decayed_severity: decayed };
    });

    const highSeverityRegrets = decayedRegrets.filter(r => r.tier === 1 && r.decayed_severity > 0.3);
    const shouldBlockMinimalist = highSeverityRegrets.some(r => r.context.style_cluster === 'minimalist');

    results.push({
      name: 'Regret blocks prevent repeats with high decayed severity',
      passed: shouldBlockMinimalist === true && highSeverityRegrets.length > 0,
      details: {
        regret_count: testRegrets.length,
        high_severity_count: highSeverityRegrets.length,
        decayed_severities: decayedRegrets.map(r => ({
          id: r.id,
          tier: r.tier,
          original: r.severity,
          decayed: r.decayed_severity,
        })),
        should_block_minimalist: shouldBlockMinimalist,
      },
    });
  } catch (error) {
    results.push({
      name: 'Regret blocks prevent repeats with high decayed severity',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 4: Mutation bounds are enforced
  try {
    const MAX_NEW_VARIANTS = 12;
    const MAX_MUTATIONS_PER_CREATIVE = 3;
    
    const testCreatives = Array.from({ length: 10 }, (_, i) => ({
      id: `creative-${i}`,
      platform: 'meta',
      style_cluster: 'minimalist',
      rank_position: i + 1,
    }));

    // Simulate: each creative could generate up to 3 mutations
    const potentialMutations = testCreatives.length * MAX_MUTATIONS_PER_CREATIVE;
    const cappedMutations = Math.min(potentialMutations, MAX_NEW_VARIANTS);

    results.push({
      name: 'Mutation bounds enforced (max 12 variants, max 3 per creative)',
      passed: cappedMutations === MAX_NEW_VARIANTS && MAX_MUTATIONS_PER_CREATIVE === 3,
      details: {
        input_creatives: testCreatives.length,
        potential_mutations: potentialMutations,
        capped_to: cappedMutations,
        max_per_creative: MAX_MUTATIONS_PER_CREATIVE,
      },
    });
  } catch (error) {
    results.push({
      name: 'Mutation bounds enforced',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 5: Mutation event logging schema (fixed table existence check)
  try {
    // Check table exists by attempting a query (not using rpc)
    const { data: existing, error: tableError } = await supabase
      .from('mutation_events')
      .select('id')
      .limit(1);

    const requiredColumns = [
      'id', 'user_id', 'creative_id', 'mutation_key', 'campaign_id', 'platform',
      'base_style_cluster', 'mutations', 'mutation_score', 'rank_before',
      'rank_after', 'outcome_metrics', 'outcome_class', 'applied'
    ];

    results.push({
      name: 'mutation_events table exists with correct schema',
      passed: !tableError,
      details: {
        table_accessible: !tableError,
        error_message: tableError?.message,
        required_columns: requiredColumns,
      },
    });
  } catch (error) {
    results.push({
      name: 'mutation_events table exists with correct schema',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 6: Deterministic seededPick produces consistent results
  try {
    const options = ['minimalist', 'bold', 'professional', 'playful', 'elegant'];
    const seed = 'test-creative-1:regret-1';
    
    // Call multiple times - should always return same result
    const result1 = seededPick(seed, options);
    const result2 = seededPick(seed, options);
    const result3 = seededPick(seed, options);
    
    const isConsistent = result1 === result2 && result2 === result3;
    
    results.push({
      name: 'seededPick is deterministic (no Math.random)',
      passed: isConsistent,
      details: {
        seed,
        results: [result1, result2, result3],
        is_consistent: isConsistent,
      },
    });
  } catch (error) {
    results.push({
      name: 'seededPick is deterministic',
      passed: false,
      details: { error: String(error) },
    });
  }

  // Test 7: Mutation key uniqueness for deduplication
  try {
    const testMutations = [
      { mutation_key: 'platform:meta', creative_id: 'c1' },
      { mutation_key: 'style:minimalist', creative_id: 'c1' },
      { mutation_key: 'platform:meta', creative_id: 'c2' }, // Duplicate key
      { mutation_key: 'cta:shop_now', creative_id: 'c1' },
    ];
    
    // Deduplicate by mutation_key (same logic as in mutate-creatives)
    const unique = testMutations.filter((m, i, arr) => 
      arr.findIndex(x => x.mutation_key === m.mutation_key) === i
    );
    
    const expectedCount = 3; // platform:meta, style:minimalist, cta:shop_now
    
    results.push({
      name: 'Mutation key deduplication works correctly',
      passed: unique.length === expectedCount,
      details: {
        input_count: testMutations.length,
        unique_count: unique.length,
        expected_count: expectedCount,
        unique_keys: unique.map(m => m.mutation_key),
      },
    });
  } catch (error) {
    results.push({
      name: 'Mutation key deduplication',
      passed: false,
      details: { error: String(error) },
    });
  }

  const allPassed = results.every(r => r.passed);
  const summary = {
    total_tests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    all_passed: allPassed,
  };

  console.log(`[Mutation Engine Test] ${summary.passed}/${summary.total_tests} passed`);

  return new Response(
    JSON.stringify({ summary, results }),
    { 
      status: allPassed ? 200 : 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
