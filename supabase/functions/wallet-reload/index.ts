import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { amount } = await req.json();
    if (!amount || amount <= 0) throw new Error('Invalid amount');

    // Get user profile to check plan
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const amountNum = parseFloat(amount);

    // Check if user is admin (bypass limits for testing)
    const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });

    // Enforce Quick-Start weekly cap (skip for admins)
    if (userPlan === 'quickstart' && !isAdmin) {
      const { data: capResult, error: capError } = await supabaseClient
        .rpc('enforce_quickstart_cap', { requested: amountNum });

      if (capError) {
        console.error('Cap enforcement error:', capError);
        throw new Error('Failed to check spending cap');
      }

      if (!capResult?.allowed) {
        return new Response(
          JSON.stringify({ 
            error: capResult?.error || 'WEEKLY_CAP_EXCEEDED',
            message: capResult?.message || 'Quick-Start weekly $300 limit reached. Upgrade to Pro for unlimited spend.',
            current_spend: capResult?.current_spend,
            requested: capResult?.requested,
            cap: capResult?.cap
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('Processing wallet reload for user:', user.id, 'Plan:', userPlan, 'Amount:', amount);

    // Fraud check
    const fraudCheck = await runFraudChecks(supabaseClient, user.id, amountNum);
    if (fraudCheck.risk_level === 'blocked') {
      throw new Error('Transaction blocked due to fraud risk');
    }

    // Create Stripe payment
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: 'usd',
      customer: profile?.stripe_customer_id,
      metadata: {
        user_id: user.id,
        type: 'wallet_reload',
        plan: userPlan
      }
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Wallet reload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function runFraudChecks(supabase: any, userId: string, amount: number) {
  // Velocity check: max 5 reloads per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentReloads } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'deposit')
    .gte('created_at', oneHourAgo);

  const risk_level = (recentReloads?.length || 0) >= 5 ? 'blocked' : 'low';

  // Log fraud check
  await supabase
    .from('fraud_checks')
    .insert({
      user_id: userId,
      check_type: 'velocity',
      risk_level,
      details: { recent_count: recentReloads?.length, amount },
      action_taken: risk_level === 'blocked' ? 'block' : 'allow'
    });

  return { risk_level };
}