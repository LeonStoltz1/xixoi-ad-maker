import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier-based LLM cost limits (USD per month)
const TIER_LLM_COST_LIMITS: Record<string, number> = {
  free: 0.16,
  quickstart: 0.99,
  pro: 6.00,
  proUnlimited: 12.00,
  elite: 29.00,
  agency: 199.00,
  autopilotProfitLite: 40.00,
  autopilotProfitPro: 80.00,
  autopilotProfitUltra: 160.00,
  autopilotProfitEnterprise: 500.00,
};

type CostStatus = 'healthy' | 'warning' | 'critical' | 'blocked' | 'exceeded';

interface UserCostProfile {
  userId: string;
  llmCost: number;
  infraCost: number;
  totalCost: number;
  tierLimit: number;
  marginRemaining: number;
  marginPercentage: number;
  status: CostStatus;
  tier: string;
  autopilotLoops: number;
  conductorExecutions: number;
  creativeGenerations: number;
  priceTests: number;
  safetyChecks: number;
  apiCalls: number;
}

function calculateCostStatus(marginPercentage: number): CostStatus {
  if (marginPercentage < 0) return 'exceeded';
  if (marginPercentage < 0.05) return 'blocked';
  if (marginPercentage < 0.10) return 'critical';
  if (marginPercentage < 0.20) return 'warning';
  return 'healthy';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile and plan
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('plan, stripe_price_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    const userPlan = profile?.plan || 'free';
    const tierLimit = TIER_LLM_COST_LIMITS[userPlan] || TIER_LLM_COST_LIMITS.free;

    // Get current month's usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: usage, error: usageError } = await supabaseClient
      .from('user_llm_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('month_start', monthStart.toISOString().split('T')[0])
      .single();

    // Get system costs for reference
    const { data: systemCosts } = await supabaseClient
      .from('config_system_costs')
      .select('key, value');

    const costs = systemCosts?.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {}) || {};

    // Calculate totals
    const llmCost = usage?.llm_cost_usd || 0;
    const infraCost = usage?.total_infra_cost || 0;
    const totalCost = llmCost + infraCost;
    const marginRemaining = tierLimit - totalCost;
    const marginPercentage = tierLimit > 0 ? marginRemaining / tierLimit : 0;
    const status = calculateCostStatus(marginPercentage);

    const costProfile: UserCostProfile = {
      userId,
      llmCost,
      infraCost,
      totalCost,
      tierLimit,
      marginRemaining,
      marginPercentage,
      status,
      tier: userPlan,
      autopilotLoops: usage?.autopilot_loops || 0,
      conductorExecutions: usage?.conductor_executions || 0,
      creativeGenerations: usage?.creative_generations || 0,
      priceTests: usage?.price_tests || 0,
      safetyChecks: usage?.safety_checks || 0,
      apiCalls: usage?.api_calls || 0,
    };

    // Log if user is approaching or exceeding limit
    if (status !== 'healthy') {
      await supabaseClient
        .from('profit_logs')
        .insert([{
          user_id: userId,
          event_type: status === 'exceeded' ? 'platform_limit_reached' : 'platform_limit_warning',
          decision_rationale: `User cost status: ${status}, margin: ${(marginPercentage * 100).toFixed(1)}%`,
          confidence: 1.0,
          payload: {
            totalCost,
            tierLimit,
            marginRemaining,
            marginPercentage,
            status,
          }
        }]);
    }

    console.log(`User ${userId} cost profile:`, costProfile);

    return new Response(
      JSON.stringify(costProfile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating user costs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
