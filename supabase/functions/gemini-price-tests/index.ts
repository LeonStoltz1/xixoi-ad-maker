import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICE_TEST_SCHEMA = {
  name: "propose_price_tests",
  description: "Propose price tests for products to determine optimal pricing",
  parameters: {
    type: "object",
    properties: {
      tests: {
        type: "array",
        items: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            current_price: { type: "number" },
            proposed_price: { type: "number" },
            test_duration_hours: { type: "number" },
            confidence: { type: "number" },
            rationale: { type: "string" },
            expected_elasticity: { type: "number" },
            risk_level: { type: "string", enum: ["low", "medium", "high"] }
          },
          required: ["product_id", "current_price", "proposed_price", "confidence", "rationale"]
        }
      },
      summary: { type: "string" }
    },
    required: ["tests", "summary"]
  }
};

interface PriceTestProposal {
  product_id: string;
  current_price: number;
  proposed_price: number;
  test_duration_hours?: number;
  confidence: number;
  rationale: string;
  expected_elasticity?: number;
  risk_level?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, productIds } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch products and their history
    const { data: products } = await supabase
      .from('product_profitability')
      .select('*')
      .eq('user_id', userId);

    const { data: elasticityTests } = await supabase
      .from('elasticity_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        campaign_performance (spend, revenue, conversions)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    // Build context for Gemini
    const productContext = (products || []).map(p => ({
      id: p.product_id,
      name: p.product_name,
      currentPrice: p.base_price,
      cost: p.cost_of_goods,
      margin: p.margin,
      marginPct: p.margin_percentage,
      elasticity: p.elasticity_coefficient,
      optimalPrice: p.optimal_price,
      lastTested: p.last_tested_at,
    }));

    const elasticityHistory = (elasticityTests || []).map(t => ({
      productId: t.product_id,
      testPrice: t.test_price,
      baseline: t.baseline_price,
      elasticity: t.calculated_elasticity,
      conversionRate: t.test_conversion_rate,
      status: t.status,
    }));

    const campaignPerf = (campaigns || []).map(c => {
      const perf = c.campaign_performance || [];
      const totals = perf.reduce((acc: any, p: any) => ({
        spend: acc.spend + (p.spend || 0),
        revenue: acc.revenue + (p.revenue || 0),
        conversions: acc.conversions + (p.conversions || 0),
      }), { spend: 0, revenue: 0, conversions: 0 });
      return { name: c.name, ...totals };
    });

    const prompt = `
You are a pricing optimization AI. Analyze the following product and campaign data to propose price tests.

## Products
${JSON.stringify(productContext, null, 2)}

## Historical Elasticity Tests
${JSON.stringify(elasticityHistory, null, 2)}

## Campaign Performance
${JSON.stringify(campaignPerf, null, 2)}

## Guidelines
1. Propose tests for products that haven't been tested recently (>30 days)
2. Start with small price changes (5-15%) for first tests
3. Consider margin impact - never test prices below cost + 10%
4. Higher confidence for products with stable historical data
5. Flag high-risk tests (large price increases on price-sensitive products)

Propose 1-3 price tests that would help optimize profitability.
`;

    const result = await geminiJson<{ tests: PriceTestProposal[]; summary: string }>(
      prompt,
      PRICE_TEST_SCHEMA,
      'You are a pricing optimization expert. Propose data-driven price tests.'
    );

    if (!result.success || !result.data) {
      console.error('Gemini error:', result.error);
      return new Response(JSON.stringify({ 
        error: result.error || 'Failed to generate price tests',
        tests: [],
        summary: 'Unable to generate tests at this time'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { tests, summary } = result.data;

    // Log proposed tests
    for (const test of tests) {
      await supabase.from('profit_logs').insert({
        user_id: userId,
        product_id: test.product_id,
        event_type: 'price_test_proposed',
        old_price: test.current_price,
        new_price: test.proposed_price,
        decision_rationale: test.rationale,
        confidence: test.confidence,
        auto_executed: false,
        payload: {
          expected_elasticity: test.expected_elasticity,
          risk_level: test.risk_level,
          test_duration_hours: test.test_duration_hours,
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tests,
      summary,
      usage: result.usage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Price test error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
