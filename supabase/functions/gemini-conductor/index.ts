import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced decision schema with profit awareness
const CONDUCTOR_DECISION_SCHEMA = {
  name: 'conductor_decisions',
  description: 'Generate optimization decisions for ad campaigns with profit awareness',
  parameters: {
    type: 'object',
    properties: {
      decisions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            decision_type: {
              type: 'string',
              enum: ['budget_increase', 'budget_decrease', 'pause_campaign', 'resume_campaign', 'creative_rotation', 'price_test', 'profit_alert', 'no_action']
            },
            campaign_id: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            auto_execute: { type: 'boolean' },
            reason: { type: 'string' },
            recommended_value: { type: 'number' },
            expected_margin_gain: { type: 'number' },
            profit_impact: { type: 'string' }
          },
          required: ['decision_type', 'campaign_id', 'confidence', 'auto_execute', 'reason']
        }
      },
      summary: { type: 'string' },
      profit_summary: { type: 'string' }
    },
    required: ['decisions', 'summary']
  }
};

interface ConductorDecision {
  decision_type: string;
  campaign_id: string;
  confidence: number;
  auto_execute: boolean;
  reason: string;
  recommended_value?: number;
  expected_margin_gain?: number;
  profit_impact?: string;
}

interface ConductorResponse {
  decisions: ConductorDecision[];
  summary: string;
  profit_summary?: string;
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

    console.log('Gemini Conductor starting with profit awareness...');

    // 1. Get pending agent tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('agent_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('next_run', new Date().toISOString())
      .lt('attempts', 3)
      .order('priority', { ascending: true })
      .limit(10);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${tasks?.length || 0} pending tasks`);

    // 2. Get active campaigns that need optimization
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('campaigns')
      .select(`
        id, name, status, daily_budget, total_spent, user_id,
        target_location, target_audience, created_at
      `)
      .eq('status', 'active')
      .limit(20);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns to optimize');
      return new Response(
        JSON.stringify({ success: true, message: 'No active campaigns', decisions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get performance data for these campaigns
    const campaignIds = campaigns.map(c => c.id);
    const { data: performance } = await supabaseClient
      .from('campaign_performance')
      .select('*')
      .in('campaign_id', campaignIds)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    // 4. Get user autopilot settings
    const userIds = [...new Set(campaigns.map(c => c.user_id))];
    const { data: autopilotSettings } = await supabaseClient
      .from('user_autopilot_settings')
      .select('*')
      .in('user_id', userIds);

    const settingsMap = new Map(autopilotSettings?.map(s => [s.user_id, s]) || []);

    // 5. Get product profitability data
    const { data: products } = await supabaseClient
      .from('product_profitability')
      .select('*')
      .in('user_id', userIds);

    const productsByUser = new Map<string, any[]>();
    for (const p of (products || [])) {
      const existing = productsByUser.get(p.user_id) || [];
      existing.push(p);
      productsByUser.set(p.user_id, existing);
    }

    // 6. Get recent profit logs
    const { data: profitLogs } = await supabaseClient
      .from('profit_logs')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(50);

    // 7. Build context for Gemini with profitability data
    const contextParts: string[] = [
      'You are xiXoi\'s AI Optimization Conductor with PROFIT AWARENESS.',
      'Your PRIMARY GOAL is to maximize profit, not just ROAS or revenue.',
      '',
      '=== CRITICAL PROFIT RULES ===',
      '- NEVER increase spend on campaigns with negative net profit',
      '- Margin-adjusted ROAS > 1.0 means profitable, < 1.0 means losing money',
      '- Break-even ROAS = 100 / margin_percentage',
      '- Prioritize high-margin campaigns over high-volume campaigns',
      '',
      '=== ACTIVE CAMPAIGNS ==='
    ];

    for (const campaign of campaigns) {
      const perf = performance?.filter(p => p.campaign_id === campaign.id) || [];
      const totalSpend = perf.reduce((sum, p) => sum + (p.spend || 0), 0);
      const totalRevenue = perf.reduce((sum, p) => sum + (p.revenue || 0), 0);
      const totalImpressions = perf.reduce((sum, p) => sum + (p.impressions || 0), 0);
      const totalClicks = perf.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
      const avgRoas = perf.length > 0 ? perf.reduce((sum, p) => sum + (p.roas || 0), 0) / perf.length : 0;

      const settings = settingsMap.get(campaign.user_id);
      const autopilotMode = settings?.autopilot_mode || 'off';
      
      // Get user's product margins
      const userProducts = productsByUser.get(campaign.user_id) || [];
      const avgMargin = userProducts.length > 0
        ? userProducts.reduce((sum, p) => sum + (Number(p.margin_percentage) || 0), 0) / userProducts.length
        : 40; // Default assumption
      
      const grossProfit = totalRevenue * (avgMargin / 100);
      const netProfit = grossProfit - totalSpend;
      const marginAdjustedRoas = totalSpend > 0 ? grossProfit / totalSpend : 0;
      const breakEvenRoas = avgMargin > 0 ? 100 / avgMargin : 2.5;

      contextParts.push(
        `\nCampaign: ${campaign.name}`,
        `ID: ${campaign.id}`,
        `Status: ${campaign.status}`,
        `Daily Budget: $${campaign.daily_budget || 0}`,
        `--- Performance (7d) ---`,
        `Total Spent: $${totalSpend.toFixed(2)}`,
        `Revenue: $${totalRevenue.toFixed(2)}`,
        `Impressions: ${totalImpressions}`,
        `Clicks: ${totalClicks}`,
        `CTR: ${avgCtr.toFixed(2)}%`,
        `Standard ROAS: ${avgRoas.toFixed(2)}`,
        `--- PROFIT METRICS ---`,
        `Average Margin: ${avgMargin.toFixed(1)}%`,
        `Gross Profit: $${grossProfit.toFixed(2)}`,
        `Net Profit (after ad spend): $${netProfit.toFixed(2)}`,
        `Margin-Adjusted ROAS: ${marginAdjustedRoas.toFixed(2)}x`,
        `Break-Even ROAS: ${breakEvenRoas.toFixed(2)}x`,
        `PROFITABLE: ${netProfit > 0 ? 'YES' : 'NO'}`,
        `--- Settings ---`,
        `Autopilot Mode: ${autopilotMode}`,
        `Target: ${campaign.target_location || 'Not set'} | ${campaign.target_audience || 'Not set'}`,
        ''
      );
    }

    // Add recent profit actions for context
    if (profitLogs && profitLogs.length > 0) {
      contextParts.push('=== RECENT PROFIT ACTIONS ===');
      for (const log of profitLogs.slice(0, 10)) {
        contextParts.push(`- ${log.event_type}: ${log.decision_rationale || 'N/A'} (conf: ${log.confidence || 0})`);
      }
      contextParts.push('');
    }

    contextParts.push(
      '',
      '=== OPTIMIZATION RULES ===',
      '- Only set auto_execute=true if confidence >= 85 AND user has autopilot enabled',
      '- NEVER increase budget on campaigns with margin-adjusted ROAS < 1.0',
      '- Budget increases should be gradual (max 20% at a time)',
      '- Pause campaigns with negative net profit after $100+ spend',
      '- Recommend creative rotation if CTR declining for 3+ days',
      '- Include expected_margin_gain for budget changes',
      '- Flag any campaign that is losing money in profit_impact',
      '',
      'Analyze each campaign and provide optimization decisions WITH PROFIT AWARENESS.'
    );

    const contextPrompt = contextParts.join('\n');

    // 8. Call Gemini for decisions
    console.log('Calling Gemini for profit-aware optimization decisions...');
    const geminiResponse = await geminiJson<ConductorResponse>(
      contextPrompt,
      CONDUCTOR_DECISION_SCHEMA,
      'You are an expert digital marketing AI focused on PROFIT OPTIMIZATION. Be conservative with auto_execute. Never recommend scaling unprofitable campaigns. Always explain profit impact.'
    );

    if (!geminiResponse.success || !geminiResponse.data) {
      console.error('Gemini call failed:', geminiResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: geminiResponse.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { decisions, summary, profit_summary } = geminiResponse.data;
    console.log(`Gemini returned ${decisions.length} decisions: ${summary}`);

    // 9. Log all decisions to optimization_logs
    const logsToInsert = decisions.map(d => ({
      user_id: campaigns.find(c => c.id === d.campaign_id)?.user_id,
      campaign_id: d.campaign_id,
      action: d.decision_type,
      decision_type: d.decision_type,
      reason: d.reason,
      confidence: d.confidence,
      auto_executed: false,
      payload: { 
        recommended_value: d.recommended_value,
        expected_margin_gain: d.expected_margin_gain,
        profit_impact: d.profit_impact
      }
    })).filter(log => log.user_id);

    if (logsToInsert.length > 0) {
      const { error: logError } = await supabaseClient
        .from('optimization_logs')
        .insert(logsToInsert);

      if (logError) {
        console.error('Error logging decisions:', logError);
      }
    }

    // 10. Log profit-specific decisions to profit_logs
    const profitLogsToInsert = decisions
      .filter(d => d.expected_margin_gain !== undefined || d.profit_impact)
      .map(d => ({
        user_id: campaigns.find(c => c.id === d.campaign_id)?.user_id,
        campaign_id: d.campaign_id,
        event_type: `conductor_${d.decision_type}`,
        decision_rationale: d.reason,
        confidence: d.confidence / 100,
        auto_executed: false,
        payload: {
          expected_margin_gain: d.expected_margin_gain,
          profit_impact: d.profit_impact,
          recommended_value: d.recommended_value
        }
      }))
      .filter(log => log.user_id);

    if (profitLogsToInsert.length > 0) {
      await supabaseClient.from('profit_logs').insert(profitLogsToInsert);
    }

    // 11. Execute high-confidence decisions for users with autopilot enabled
    const executedDecisions: string[] = [];

    for (const decision of decisions) {
      if (!decision.auto_execute || decision.confidence < 85) continue;

      const campaign = campaigns.find(c => c.id === decision.campaign_id);
      if (!campaign) continue;

      const settings = settingsMap.get(campaign.user_id);
      if (!settings || settings.autopilot_mode === 'off') continue;

      const threshold = settings.autopilot_mode === 'aggressive' ? 70 :
                       settings.autopilot_mode === 'standard' ? 85 : 95;

      if (decision.confidence < threshold) continue;

      // PROFIT SAFETY: Check if action would increase spend on unprofitable campaign
      if (decision.decision_type === 'budget_increase') {
        const perf = performance?.filter(p => p.campaign_id === decision.campaign_id) || [];
        const totalSpend = perf.reduce((sum, p) => sum + (p.spend || 0), 0);
        const totalRevenue = perf.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const userProducts = productsByUser.get(campaign.user_id) || [];
        const avgMargin = userProducts.length > 0
          ? userProducts.reduce((sum, p) => sum + (Number(p.margin_percentage) || 0), 0) / userProducts.length
          : 40;
        const grossProfit = totalRevenue * (avgMargin / 100);
        const netProfit = grossProfit - totalSpend;
        
        // BLOCK: Never auto-execute budget increase on unprofitable campaigns
        if (netProfit < 0) {
          console.log(`BLOCKED: Budget increase for ${campaign.name} - campaign is unprofitable`);
          continue;
        }
      }

      // Execute the decision
      try {
        if (decision.decision_type === 'pause_campaign' && settings.auto_pause_underperformers) {
          await supabaseClient
            .from('campaigns')
            .update({ status: 'paused', paused_at: new Date().toISOString(), paused_reason: decision.reason })
            .eq('id', decision.campaign_id);
          executedDecisions.push(`Paused campaign ${campaign.name}`);
        } else if (decision.decision_type === 'budget_increase' && settings.auto_budget_adjustment && decision.recommended_value) {
          const newBudget = Math.min((campaign.daily_budget || 0) * 1.2, decision.recommended_value);
          await supabaseClient
            .from('campaigns')
            .update({ daily_budget: newBudget })
            .eq('id', decision.campaign_id);
          executedDecisions.push(`Increased budget for ${campaign.name} to $${newBudget}`);
        } else if (decision.decision_type === 'budget_decrease' && settings.auto_budget_adjustment && decision.recommended_value) {
          const newBudget = Math.max((campaign.daily_budget || 0) * 0.8, decision.recommended_value, 10);
          await supabaseClient
            .from('campaigns')
            .update({ daily_budget: newBudget })
            .eq('id', decision.campaign_id);
          executedDecisions.push(`Decreased budget for ${campaign.name} to $${newBudget}`);
        }

        // Update log as executed
        await supabaseClient
          .from('optimization_logs')
          .update({ auto_executed: true })
          .eq('campaign_id', decision.campaign_id)
          .eq('action', decision.decision_type)
          .order('created_at', { ascending: false })
          .limit(1);

      } catch (execError) {
        console.error(`Error executing decision for ${decision.campaign_id}:`, execError);
      }
    }

    // 12. Mark processed tasks as completed
    if (tasks && tasks.length > 0) {
      const taskIds = tasks.map(t => t.id);
      await supabaseClient
        .from('agent_tasks')
        .update({ status: 'completed', last_run: new Date().toISOString() })
        .in('id', taskIds);
    }

    console.log(`Conductor complete. Executed ${executedDecisions.length} auto-decisions.`);

    return new Response(
      JSON.stringify({
        success: true,
        decisions: decisions.length,
        executed: executedDecisions,
        summary,
        profitSummary: profit_summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Gemini Conductor error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
