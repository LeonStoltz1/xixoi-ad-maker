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

    // Fraud check
    const fraudCheck = await runFraudChecks(supabaseClient, user.id, amount);
    if (fraudCheck.risk_level === 'blocked') {
      throw new Error('Transaction blocked due to fraud risk');
    }

    // Create Stripe payment
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: profile?.stripe_customer_id,
      metadata: {
        user_id: user.id,
        type: 'wallet_reload'
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