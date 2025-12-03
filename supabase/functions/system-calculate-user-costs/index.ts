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
  stripeFees: number;
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
  // Revenue metrics
  grossRevenue: number;
  netRevenue: number;
  trueProfitMargin: number;
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

    // Get current month's start date
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Get current month's LLM usage
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

    // =========================================================================
    // PHASE 10C: Get REAL Stripe fees from payment_economics
    // =========================================================================
    const { data: paymentEconomics, error: peError } = await supabaseClient
      .from('payment_economics')
      .select('gross_amount_usd, stripe_fees_usd, net_revenue_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    if (peError) {
      console.error('Error fetching payment_economics:', peError);
    }

    // Aggregate Stripe fees and revenue
    const totalStripeFees = paymentEconomics?.reduce(
      (sum, p) => sum + (p.stripe_fees_usd || 0), 
      0
    ) || 0;

    const totalGrossRevenue = paymentEconomics?.reduce(
      (sum, p) => sum + Math.max(0, p.gross_amount_usd || 0), // Only count positive (payments, not refunds)
      0
    ) || 0;

    const totalNetRevenue = paymentEconomics?.reduce(
      (sum, p) => sum + (p.net_revenue_usd || 0),
      0
    ) || 0;

    // Calculate totals including Stripe fees
    const llmCost = usage?.llm_cost_usd || 0;
    const infraCost = usage?.total_infra_cost || 0;
    const platformCosts = llmCost + infraCost;
    const totalCost = platformCosts + totalStripeFees;
    
    // Margin calculations
    // 1. Tier-based margin (for AI guardrails)
    const marginRemaining = tierLimit - platformCosts;
    const marginPercentage = tierLimit > 0 ? marginRemaining / tierLimit : 0;
    
    // 2. True profit margin (net revenue minus all costs)
    const trueProfitMargin = totalNetRevenue - platformCosts;
    
    const status = calculateCostStatus(marginPercentage);

    const costProfile: UserCostProfile = {
      userId,
      llmCost,
      infraCost,
      stripeFees: totalStripeFees,
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
      // Revenue metrics
      grossRevenue: totalGrossRevenue,
      netRevenue: totalNetRevenue,
      trueProfitMargin,
    };

    // Log if user is approaching or exceeding limit
    if (status !== 'healthy') {
      await supabaseClient
        .from('profit_logs')
        .insert([{
          user_id: userId,
          event_type: status === 'exceeded' ? 'platform_limit_reached' : 'platform_limit_warning',
          decision_rationale: `User cost status: ${status}, margin: ${(marginPercentage * 100).toFixed(1)}%, true profit: $${trueProfitMargin.toFixed(2)}`,
          confidence: 1.0,
          payload: {
            totalCost,
            tierLimit,
            marginRemaining,
            marginPercentage,
            status,
            stripeFees: totalStripeFees,
            grossRevenue: totalGrossRevenue,
            netRevenue: totalNetRevenue,
            trueProfitMargin,
          }
        }]);
    }

    console.log(`User ${userId} cost profile:`, {
      ...costProfile,
      summary: `LLM: $${llmCost.toFixed(2)}, Infra: $${infraCost.toFixed(2)}, Stripe: $${totalStripeFees.toFixed(2)}, Net: $${totalNetRevenue.toFixed(2)}, Profit: $${trueProfitMargin.toFixed(2)}`
    });

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
