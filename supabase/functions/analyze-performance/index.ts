import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Analyzing performance for user:', user.id);

    // Fetch all campaigns for the user
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, status')
      .eq('user_id', user.id);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ 
          analysis: "You don't have any campaigns yet. Create your first campaign to start tracking performance across platforms!" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignIds = campaigns.map(c => c.id);

    // Fetch performance data grouped by platform
    const { data: performanceData, error: perfError } = await supabase
      .from('campaign_performance')
      .select('platform, spend, impressions, clicks, conversions, revenue, roas, cpc, ctr')
      .in('campaign_id', campaignIds)
      .order('date', { ascending: false });

    if (perfError) {
      console.error('Error fetching performance data:', perfError);
      throw perfError;
    }

    // Aggregate data by platform
    const platformMetrics: Record<string, any> = {};
    
    if (performanceData && performanceData.length > 0) {
      performanceData.forEach(row => {
        const platform = row.platform || 'unknown';
        if (!platformMetrics[platform]) {
          platformMetrics[platform] = {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            count: 0
          };
        }
        
        platformMetrics[platform].totalSpend += Number(row.spend || 0);
        platformMetrics[platform].totalImpressions += Number(row.impressions || 0);
        platformMetrics[platform].totalClicks += Number(row.clicks || 0);
        platformMetrics[platform].totalConversions += Number(row.conversions || 0);
        platformMetrics[platform].totalRevenue += Number(row.revenue || 0);
        platformMetrics[platform].count += 1;
      });

      // Calculate averages and derived metrics
      Object.keys(platformMetrics).forEach(platform => {
        const metrics = platformMetrics[platform];
        metrics.avgCTR = metrics.totalImpressions > 0 
          ? (metrics.totalClicks / metrics.totalImpressions * 100).toFixed(2)
          : 0;
        metrics.avgCPC = metrics.totalClicks > 0 
          ? (metrics.totalSpend / metrics.totalClicks).toFixed(2)
          : 0;
        metrics.roas = metrics.totalSpend > 0 
          ? (metrics.totalRevenue / metrics.totalSpend).toFixed(2)
          : 0;
        metrics.conversionRate = metrics.totalClicks > 0
          ? (metrics.totalConversions / metrics.totalClicks * 100).toFixed(2)
          : 0;
      });
    }

    console.log('Platform metrics:', platformMetrics);

    // Prepare data summary for AI
    const dataSummary = Object.keys(platformMetrics).length > 0
      ? Object.keys(platformMetrics).map(platform => {
          const m = platformMetrics[platform];
          return `
Platform: ${platform.toUpperCase()}
- Total Spend: $${m.totalSpend.toFixed(2)}
- Impressions: ${m.totalImpressions.toLocaleString()}
- Clicks: ${m.totalClicks.toLocaleString()}
- Conversions: ${m.totalConversions}
- Revenue: $${m.totalRevenue.toFixed(2)}
- ROAS: ${m.roas}x
- CTR: ${m.avgCTR}%
- CPC: $${m.avgCPC}
- Conversion Rate: ${m.conversionRate}%
          `.trim();
        }).join('\n\n')
      : 'No performance data available yet. Campaigns may still be in draft or just started.';

    // Call Lovable AI for analysis
    const systemPrompt = `You are an expert digital marketing analyst for xiXoi, a managed advertising platform. 

IMPORTANT CONTEXT:
- Users viewing this analysis do NOT directly control technical campaign implementation
- xiXoi handles all technical aspects: tracking setup, pixel installation, platform APIs, creative deployment, etc.
- Users make HIGH-LEVEL strategic decisions: budget allocation, platform selection, campaign goals

YOUR ROLE:
Provide strategic, actionable insights that help users make informed decisions about:
1. Which platforms are delivering the best ROI/ROAS for THEIR budget
2. Where to allocate or reallocate ad spend
3. Which platforms to scale up or pause
4. Overall campaign performance relative to their investment

TONE & FORMAT:
- Speak directly to the user about "your campaigns" and "your ad spend"
- Focus on strategic decisions users can make, not technical implementation
- Be concise and use bullet points
- Avoid technical jargon about pixels, UTMs, APIs, or implementation details

If there's no data yet, acknowledge that campaigns are just starting and provide brief guidance on what to monitor once data becomes available (CTR, ROAS, conversion rates) without technical implementation advice.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Analyze this advertising performance data across platforms:\n\n${dataSummary}\n\nProvide insights on where ad spend was most effective and recommendations for optimization.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit reached. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || 'Unable to generate analysis at this time.';

    console.log('Analysis generated successfully');

    return new Response(
      JSON.stringify({ 
        analysis,
        platformMetrics,
        campaignCount: campaigns.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze-performance function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        analysis: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
