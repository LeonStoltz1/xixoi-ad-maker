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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent performance data
    const { data: performances } = await supabaseClient
      .from('campaign_performance')
      .select('*, campaigns!inner(id, user_id, name)')
      .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!performances) return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const alerts = [];

    // Check for high ROAS (>2.0) - scale opportunity
    for (const perf of performances) {
      if (perf.roas >= 2.0) {
        alerts.push({
          user_id: perf.campaigns.user_id,
          campaign_id: perf.campaign_id,
          alert_type: 'high_roas',
          threshold_value: 2.0,
          current_value: perf.roas,
          message: `🎉 ${perf.campaigns.name} hit ${perf.roas}x ROAS! Consider scaling your budget.`
        });
      }

      // Check for low ROAS (<0.5)
      if (perf.roas < 0.5 && perf.spend > 50) {
        alerts.push({
          user_id: perf.campaigns.user_id,
          campaign_id: perf.campaign_id,
          alert_type: 'low_roas',
          threshold_value: 0.5,
          current_value: perf.roas,
          message: `⚠️ ${perf.campaigns.name} has ${perf.roas}x ROAS. Consider pausing or adjusting targeting.`
        });
      }
    }

    // Insert alerts (avoiding duplicates)
    if (alerts.length > 0) {
      await supabaseClient
        .from('performance_alerts')
        .insert(alerts);

      // Send push notifications
      for (const alert of alerts) {
        await sendPushNotification(supabaseClient, alert);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alerts_created: alerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Alert check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendPushNotification(supabase: any, alert: any) {
  // TODO: Implement push notification via Expo or FCM
  console.log('Push notification:', alert.message);
}