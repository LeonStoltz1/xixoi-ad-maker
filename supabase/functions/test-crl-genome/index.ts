import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test data generators
function generateMockCreative(
  userId: string, 
  platform: string, 
  styleCluster: string, 
  metrics: Record<string, unknown>
) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    platform,
    creative_data: { headline: `Test ad for ${platform}`, body: 'Test body copy' },
    performance_metrics: {
      ctr: metrics.ctr ?? Math.random() * 0.1,
      cpa: metrics.cpa ?? Math.random() * 50,
      roas: metrics.roas ?? Math.random() * 5 - 1, // -1 to 4
      conversion_rate: metrics.conversion_rate ?? Math.random() * 0.05,
      spend: metrics.spend ?? Math.random() * 1000,
      decay_curve: metrics.decay_curve ?? [1, 0.95, 0.9, 0.85, 0.8],
      engagement_decay: metrics.engagement_decay ?? Math.random() * 0.3,
      policy_flags: metrics.policy_flags ?? [],
      stability_score: metrics.stability_score ?? Math.random(),
    },
    style_cluster: styleCluster,
  };
}

// Test scenarios
const TEST_SCENARIOS = [
  // Profitable + Stable campaigns (should boost genome)
  { platform: 'meta', style: 'minimal', roas: 3.5, stability: 0.9, profitable: true, stable: true },
  { platform: 'meta', style: 'minimal', roas: 2.8, stability: 0.85, profitable: true, stable: true },
  { platform: 'google', style: 'bold', roas: 4.2, stability: 0.88, profitable: true, stable: true },
  { platform: 'tiktok', style: 'ugc', roas: 2.1, stability: 0.92, profitable: true, stable: true },
  { platform: 'meta', style: 'minimal', roas: 3.0, stability: 0.87, profitable: true, stable: true },
  
  // Profitable but Unstable (tier 3 regret)
  { platform: 'google', style: 'corporate', roas: 1.5, stability: 0.3, profitable: true, stable: false },
  { platform: 'meta', style: 'bold', roas: 2.0, stability: 0.25, profitable: true, stable: false },
  
  // Near-miss (tier 2 regret)
  { platform: 'tiktok', style: 'ugc', roas: 0.8, stability: 0.7, profitable: false, stable: true },
  { platform: 'linkedin', style: 'corporate', roas: 0.6, stability: 0.75, profitable: false, stable: true },
  { platform: 'meta', style: 'bold', roas: 0.9, stability: 0.65, profitable: false, stable: true },
  
  // Negative ROI (tier 1 regret - should be gated)
  { platform: 'google', style: 'minimal', roas: -0.5, stability: 0.4, profitable: false, stable: false },
  { platform: 'tiktok', style: 'corporate', roas: -0.8, stability: 0.3, profitable: false, stable: false },
  
  // Policy violations (should be gated)
  { platform: 'meta', style: 'ugc', roas: 2.0, stability: 0.8, policy: ['restricted_content'], profitable: true, stable: true },
  
  // More profitable campaigns to build confidence
  { platform: 'meta', style: 'minimal', roas: 3.2, stability: 0.91, profitable: true, stable: true },
  { platform: 'google', style: 'bold', roas: 2.9, stability: 0.86, profitable: true, stable: true },
  { platform: 'meta', style: 'minimal', roas: 4.1, stability: 0.93, profitable: true, stable: true },
  { platform: 'tiktok', style: 'ugc', roas: 2.5, stability: 0.88, profitable: true, stable: true },
  { platform: 'meta', style: 'minimal', roas: 3.8, stability: 0.9, profitable: true, stable: true },
  { platform: 'google', style: 'minimal', roas: 3.3, stability: 0.89, profitable: true, stable: true },
  { platform: 'meta', style: 'bold', roas: 2.7, stability: 0.84, profitable: true, stable: true },
];

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

    const results = {
      phase: 'test_simulation',
      scenarios_tested: TEST_SCENARIOS.length,
      ranking_tests: [] as Record<string, unknown>[],
      genome_updates: [] as Record<string, unknown>[],
      gate_tests: {
        negative_roi_gated: 0,
        policy_violation_gated: 0,
        cluster_saturation_checked: false,
      },
      final_genome: null as Record<string, unknown> | null,
      ema_drift_test: {
        initial_confidence: 0,
        final_confidence: 0,
        drift_resistance_verified: false,
      },
      personalization_test: {
        confidence_threshold: 0.5,
        personalization_activated: false,
      },
    };

    // Clear previous test data
    await supabase.from('creatives').delete().eq('user_id', user.id);
    await supabase.from('regret_memory').delete().eq('user_id', user.id);
    await supabase.from('creator_genomes').delete().eq('user_id', user.id);

    // Get initial genome state
    const { data: initialGenome } = await supabase
      .from('creator_genomes')
      .select('genome_confidence')
      .eq('user_id', user.id)
      .single();
    
    results.ema_drift_test.initial_confidence = initialGenome?.genome_confidence || 0;

    // Process scenarios in batches
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      
      // Generate creative
      const creative = generateMockCreative(
        user.id,
        scenario.platform,
        scenario.style,
        {
          roas: scenario.roas,
          stability_score: scenario.stability,
          policy_flags: scenario.policy || [],
        }
      );

      // Test ranking
      const rankResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/rank-creatives`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatives: [creative],
            campaign_id: null,
          }),
        }
      );

      const rankResult = await rankResponse.json();
      
      // Track gating results
      if (rankResult.gated?.length > 0) {
        const gateReason = rankResult.gated[0].gate_reason;
        if (gateReason === 'negative_roi') {
          results.gate_tests.negative_roi_gated++;
        } else if (gateReason === 'policy_violation') {
          results.gate_tests.policy_violation_gated++;
        }
      }

      results.ranking_tests.push({
        scenario: i + 1,
        platform: scenario.platform,
        style: scenario.style,
        roas: scenario.roas,
        ranked: rankResult.ranked?.length || 0,
        gated: rankResult.gated?.length || 0,
        gate_reason: rankResult.gated?.[0]?.gate_reason || null,
        genome_active: rankResult.metadata?.genome_active || false,
        cluster_entropy: rankResult.metadata?.cluster_entropy,
      });

      // If not gated, simulate outcome and update genome
      if (rankResult.ranked?.length > 0) {
        const outcome = {
          creative_id: creative.id,
          platform: scenario.platform,
          style_cluster: scenario.style,
          performance_metrics: creative.performance_metrics,
          is_profitable: scenario.profitable,
          is_stable: scenario.stable,
        };

        const genomeResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-genome`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ outcomes: [outcome] }),
          }
        );

        const genomeResult = await genomeResponse.json();
        
        results.genome_updates.push({
          scenario: i + 1,
          new_confidence: genomeResult.new_confidence,
          entropy: genomeResult.entropy,
          profitable: scenario.profitable,
          stable: scenario.stable,
        });

        // Check if personalization activated
        if (genomeResult.new_confidence > 0.5) {
          results.personalization_test.personalization_activated = true;
        }
      }
    }

    // Get final genome state
    const { data: finalGenome } = await supabase
      .from('creator_genomes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    results.final_genome = finalGenome;
    results.ema_drift_test.final_confidence = finalGenome?.genome_confidence || 0;
    
    // Verify drift resistance: confidence should increase with profitable campaigns
    // but not explode due to EMA smoothing
    const confidenceGrowth = results.ema_drift_test.final_confidence - results.ema_drift_test.initial_confidence;
    results.ema_drift_test.drift_resistance_verified = confidenceGrowth > 0 && confidenceGrowth < 1;

    // Verify cluster saturation check occurred
    results.gate_tests.cluster_saturation_checked = 
      results.ranking_tests.some(t => t.cluster_entropy !== undefined);

    // Summary
    const rankedCount = results.ranking_tests.filter((t: Record<string, unknown>) => (t.ranked as number) > 0).length;
    const summary = {
      total_scenarios: TEST_SCENARIOS.length,
      successfully_ranked: rankedCount,
      gated_negative_roi: results.gate_tests.negative_roi_gated,
      gated_policy: results.gate_tests.policy_violation_gated,
      final_genome_confidence: finalGenome?.genome_confidence,
      final_entropy: finalGenome?.intra_genome_entropy,
      personalization_active: results.personalization_test.personalization_activated,
      drift_resistance_passed: results.ema_drift_test.drift_resistance_verified,
      top_platform: Object.entries(finalGenome?.platform_success || {})
        .sort((a, b) => {
          const aSuccess = a[1] as { wins: number; total: number };
          const bSuccess = b[1] as { wins: number; total: number };
          return (bSuccess.wins / Math.max(1, bSuccess.total)) - (aSuccess.wins / Math.max(1, aSuccess.total));
        })[0]?.[0] || 'none',
      dominant_style: Object.entries(finalGenome?.style_clusters || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'none',
    };

    console.log('[test-crl-genome] Test completed:', JSON.stringify(summary));

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('test-crl-genome error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
