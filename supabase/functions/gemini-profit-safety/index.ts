import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAFETY_ACTION_SCHEMA = {
  name: "profit_safety_actions",
  description: "Evaluate campaigns for profit risks and recommend safety actions",
  parameters: {
    type: "object",
    properties: {
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { 
              type: "string", 
              enum: ["pause_campaign", "reduce_budget", "alert_user", "monitor"] 
            },
            campaign_id: { type: "string" },
            reason: { 
              type: "string", 
              enum: ["profit_risk", "margin_collapse", "high_spend_low_return", "negative_roas", "budget_drain"] 
            },
            confidence: { type: "number" },
            urgency: { type: "string", enum: ["immediate", "urgent", "moderate", "low"] },
            details: { type: "string" },
            recommended_budget: { type: "number" }
          },
          required: ["action", "campaign_id", "reason", "confidence"]
        }
      },
      overall_risk_level: { type: "string", enum: ["safe", "caution", "warning", "danger"] },
      summary: { type: "string" }
    },
    required: ["actions", "overall_risk_level", "summary"]
  }
};

interface SafetyAction {
  action: 'pause_campaign' | 'reduce_budget' | 'alert_user' | 'monitor';
  campaign_id: string;
  reason: string;
  confidence: number;
  urgency?: string;
  details?: string;
  recommended_budget?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, autoExecute = false } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's autopilot settings
    const { data: autopilotSettings } = await supabase
      .from('user_autopilot_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch active campaigns with performance data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        daily_budget,
        lifetime_budget,
        total_spent,
        is_active,
        campaign_performance (
          date,
          spend,
          revenue,
          conversions,
          impressions,
          clicks,
          roas
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    // Fetch product margins
    const { data: products } = await supabase
      .from('product_profitability')
      .select('*')
      .eq('user_id', userId);

    const avgMargin = products && products.length > 0
      ? products.reduce((sum, p) => sum + (Number(p.margin_percentage) || 0), 0) / products.length
      : 40;

    // Calculate risk metrics for each campaign
    const campaignRisks = (campaigns || []).map(c => {
      const perf = c.campaign_performance || [];
      const recent = perf.slice(-7); // Last 7 days
      
      const totals = recent.reduce((acc: any, p: any) => ({
        spend: acc.spend + (Number(p.spend) || 0),
        revenue: acc.revenue + (Number(p.revenue) || 0),
        conversions: acc.conversions + (Number(p.conversions) || 0),
      }), { spend: 0, revenue: 0, conversions: 0 });

      const grossProfit = totals.revenue * (avgMargin / 100);
      const netProfit = grossProfit - totals.spend;
      const marginAdjustedRoas = totals.spend > 0 ? grossProfit / totals.spend : 0;
      const breakEvenRoas = avgMargin > 0 ? 100 / avgMargin : 2.5;

      return {
        id: c.id,
        name: c.name,
        dailyBudget: c.daily_budget,
        totalSpent: c.total_spent,
        recentSpend: totals.spend,
        recentRevenue: totals.revenue,
        recentConversions: totals.conversions,
        grossProfit,
        netProfit,
        marginAdjustedRoas,
        breakEvenRoas,
        isProfitable: netProfit > 0,
        riskIndicators: {
          negativeProfit: netProfit < 0,
          belowBreakeven: marginAdjustedRoas < 1,
          highSpendLowReturn: totals.spend > 100 && marginAdjustedRoas < 0.5,
          zeroConversions: totals.spend > 50 && totals.conversions === 0,
        }
      };
    });

    const prompt = `
You are a profit safety AI agent. Analyze the following campaigns for financial risks.

## User Settings
- Auto-pause underperformers: ${autopilotSettings?.auto_pause_underperformers || false}
- Auto-budget adjustment: ${autopilotSettings?.auto_budget_adjustment || false}
- Confidence threshold: ${autopilotSettings?.confidence_threshold || 85}%

## Campaign Risk Analysis
${JSON.stringify(campaignRisks, null, 2)}

## Safety Rules
1. PAUSE IMMEDIATELY if: negative net profit > $100 AND margin-adjusted ROAS < 0.5
2. REDUCE BUDGET if: margin-adjusted ROAS between 0.5-1.0
3. ALERT USER if: approaching break-even threshold
4. MONITOR if: currently profitable but showing decline

## Critical Thresholds
- Break-even ROAS for ${avgMargin.toFixed(1)}% margin: ${(100/avgMargin).toFixed(2)}x
- Maximum acceptable loss per day: $50
- Minimum confidence for auto-pause: 85%

Evaluate each campaign and recommend appropriate safety actions.
`;

    const result = await geminiJson<{ 
      actions: SafetyAction[]; 
      overall_risk_level: string;
      summary: string;
    }>(
      prompt,
      SAFETY_ACTION_SCHEMA,
      'You are a profit safety agent. Protect the user from unprofitable ad spend.'
    );

    if (!result.success || !result.data) {
      console.error('Safety agent error:', result.error);
      return new Response(JSON.stringify({ 
        error: result.error,
        actions: [],
        summary: 'Safety check could not complete'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { actions, overall_risk_level, summary } = result.data;
    const executedActions: SafetyAction[] = [];
    const confidenceThreshold = autopilotSettings?.confidence_threshold || 85;

    // Execute high-confidence safety actions if enabled
    for (const action of actions) {
      const shouldExecute = autoExecute && 
        autopilotSettings?.auto_pause_underperformers &&
        action.confidence >= confidenceThreshold / 100 &&
        action.urgency === 'immediate';

      if (shouldExecute && action.action === 'pause_campaign') {
        // Pause the campaign
        const { error } = await supabase
          .from('campaigns')
          .update({ 
            is_active: false, 
            paused_at: new Date().toISOString(),
            paused_reason: `Auto-paused by profit safety: ${action.reason}`
          })
          .eq('id', action.campaign_id);

        if (!error) {
          executedActions.push(action);
        }
      }

      if (shouldExecute && action.action === 'reduce_budget' && action.recommended_budget) {
        const { error } = await supabase
          .from('campaigns')
          .update({ daily_budget: action.recommended_budget })
          .eq('id', action.campaign_id);

        if (!error) {
          executedActions.push(action);
        }
      }

      // Log all actions
      await supabase.from('profit_logs').insert({
        user_id: userId,
        campaign_id: action.campaign_id,
        event_type: `safety_${action.action}`,
        decision_rationale: action.details || action.reason,
        confidence: action.confidence,
        auto_executed: executedActions.includes(action),
        payload: {
          action: action.action,
          reason: action.reason,
          urgency: action.urgency,
          recommended_budget: action.recommended_budget,
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      actions,
      executedActions,
      overallRiskLevel: overall_risk_level,
      summary,
      usage: result.usage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Profit safety error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
