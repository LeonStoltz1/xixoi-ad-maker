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

    const { userId, platform } = await req.json();

    // Get user info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    let adAccountId = '';

    // Create platform-specific ad account
    if (platform === 'meta') {
      // TODO: Implement Meta Business Manager API call
      // For now, generate a placeholder
      adAccountId = `act_${Date.now()}`;
    } else if (platform === 'tiktok') {
      // TODO: Implement TikTok for Business API call
      adAccountId = `tt_${Date.now()}`;
    } else if (platform === 'google') {
      // TODO: Implement Google Ads API call
      adAccountId = `ga_${Date.now()}`;
    }

    // Save to database
    await supabaseClient
      .from('platform_ad_accounts')
      .insert({
        user_id: userId,
        platform,
        platform_ad_account_id: adAccountId,
        parent_business_manager_id: Deno.env.get(`${platform.toUpperCase()}_BM_ID`),
        status: 'active'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ad_account_id: adAccountId,
        message: `${platform} ad account created successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create ad account error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});