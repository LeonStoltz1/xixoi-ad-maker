import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decision schema for structured output
const CONDUCTOR_DECISION_SCHEMA = {
  name: 'conductor_decisions',
  description: 'Generate optimization decisions for ad campaigns',
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
              enum: ['budget_increase', 'budget_decrease', 'pause_campaign', 'resume_campaign', 'creative_rotation', 'no_action']
            },
            campaign_id: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            auto_execute: { type: 'boolean' },
            reason: { type: 'string' },
            recommended_value: { type: 'number' }
          },
          required: ['decision_type', 'campaign_id', 'confidence', 'auto_execute', 'reason']
        }
      },
      summary: { type: 'string' }
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
}

interface ConductorResponse {
  decisions: ConductorDecision[];
  summary: string;
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

    console.log('Gemini Conductor starting...');

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

    // 5. Build context for Gemini
    const contextParts: string[] = [
      'You are xiXoi\'s AI Optimization Conductor. Analyze campaign performance and recommend optimizations.',
      '',
      '=== ACTIVE CAMPAIGNS ==='
    ];

    for (const campaign of campaigns) {
      const perf = performance?.filter(p => p.campaign_id === campaign.id) || [];
      const totalSpend = perf.reduce((sum, p) => sum + (p.spend || 0), 0);
      const totalImpressions = perf.reduce((sum, p) => sum + (p.impressions || 0), 0);
      const totalClicks = perf.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
      const avgRoas = perf.length > 0 ? perf.reduce((sum, p) => sum + (p.roas || 0), 0) / perf.length : 0;

      const settings = settingsMap.get(campaign.user_id);
      const autopilotMode = settings?.autopilot_mode || 'off';

      contextParts.push(
        `\nCampaign: ${campaign.name}`,
        `ID: ${campaign.id}`,
        `Status: ${campaign.status}`,
        `Daily Budget: $${campaign.daily_budget || 0}`,
        `Total Spent (7d): $${totalSpend.toFixed(2)}`,
        `Impressions (7d): ${totalImpressions}`,
        `Clicks (7d): ${totalClicks}`,
        `CTR: ${avgCtr.toFixed(2)}%`,
        `Avg ROAS: ${avgRoas.toFixed(2)}`,
        `Autopilot Mode: ${autopilotMode}`,
        `Target: ${campaign.target_location || 'Not set'} | ${campaign.target_audience || 'Not set'}`,
        ''
      );
    }

    contextParts.push(
      '',
      '=== OPTIMIZATION RULES ===',
      '- Only set auto_execute=true if confidence >= 85 AND user has autopilot enabled',
      '- Budget increases should be gradual (max 20% at a time)',
      '- Pause campaigns with CTR < 0.5% after 1000+ impressions',
      '- Recommend creative rotation if CTR declining for 3+ days',
      '- Consider ROAS when making budget decisions',
      '',
      'Analyze each campaign and provide optimization decisions.'
    );

    const contextPrompt = contextParts.join('\n');

    // 6. Call Gemini for decisions
    console.log('Calling Gemini for optimization decisions...');
    const geminiResponse = await geminiJson<ConductorResponse>(
      contextPrompt,
      CONDUCTOR_DECISION_SCHEMA,
      'You are an expert digital marketing AI. Be conservative with auto_execute recommendations. Always explain your reasoning clearly.'
    );

    if (!geminiResponse.success || !geminiResponse.data) {
      console.error('Gemini call failed:', geminiResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: geminiResponse.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { decisions, summary } = geminiResponse.data;
    console.log(`Gemini returned ${decisions.length} decisions: ${summary}`);

    // 7. Log all decisions
    const logsToInsert = decisions.map(d => ({
      user_id: campaigns.find(c => c.id === d.campaign_id)?.user_id,
      campaign_id: d.campaign_id,
      action: d.decision_type,
      decision_type: d.decision_type,
      reason: d.reason,
      confidence: d.confidence,
      auto_executed: false,
      payload: { recommended_value: d.recommended_value }
    })).filter(log => log.user_id);

    if (logsToInsert.length > 0) {
      const { error: logError } = await supabaseClient
        .from('optimization_logs')
        .insert(logsToInsert);

      if (logError) {
        console.error('Error logging decisions:', logError);
      }
    }

    // 8. Execute high-confidence decisions for users with autopilot enabled
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

    // 9. Mark processed tasks as completed
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
        summary
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
