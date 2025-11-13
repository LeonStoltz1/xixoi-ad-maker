import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { campaign_id, platform, amount, currency = 'usd', spend_date } = await req.json();

    // Validate required fields
    if (!platform || !amount) {
      throw new Error('Missing required fields: platform and amount');
    }

    if (!['meta', 'tiktok', 'google', 'linkedin'].includes(platform)) {
      throw new Error('Invalid platform. Must be one of: meta, tiktok, google, linkedin');
    }

    // Determine billing period (current month)
    const spendDateObj = spend_date ? new Date(spend_date) : new Date();
    const billingPeriodStart = new Date(spendDateObj.getFullYear(), spendDateObj.getMonth(), 1);
    const billingPeriodEnd = new Date(spendDateObj.getFullYear(), spendDateObj.getMonth() + 1, 0);

    console.log('Recording ad spend:', {
      user_id: user.id,
      campaign_id,
      platform,
      amount,
      spend_date: spendDateObj.toISOString().split('T')[0],
      billing_period: `${billingPeriodStart.toISOString().split('T')[0]} to ${billingPeriodEnd.toISOString().split('T')[0]}`
    });

    // Insert ad spend record
    const { data, error } = await supabase
      .from('ad_spend_tracking')
      .insert({
        user_id: user.id,
        campaign_id: campaign_id || null,
        platform,
        amount,
        currency,
        spend_date: spendDateObj.toISOString().split('T')[0],
        billing_period_start: billingPeriodStart.toISOString().split('T')[0],
        billing_period_end: billingPeriodEnd.toISOString().split('T')[0],
        billed: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error recording ad spend: ${error.message}`);
    }

    console.log('Ad spend recorded successfully:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        record: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in record-ad-spend function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
