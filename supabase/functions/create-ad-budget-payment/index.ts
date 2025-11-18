import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { amount, platforms } = await req.json();

    if (!amount || !platforms || platforms.length === 0) {
      throw new Error('Amount and platforms are required');
    }

    // Get user profile to check plan
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const amountNum = parseFloat(amount);

    // Enforce Quick-Start weekly cap
    if (userPlan === 'quickstart') {
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

    // Calculate service fee (5% for Quick-Start, $5 flat for others)
    const serviceFee = userPlan === 'quickstart' ? amountNum * 0.05 : 5.00;
    const totalAmount = amountNum + serviceFee;

    console.log('Creating ad budget reload:', { 
      user: user.id, 
      plan: userPlan,
      amount, 
      platforms, 
      serviceFee, 
      totalAmount 
    });

    // Create the ad budget reload record
    const { data: reloadRecord, error: reloadError } = await supabaseClient
      .from('ad_budget_reloads')
      .insert({
        user_id: user.id,
        amount: amountNum,
        service_fee: serviceFee,
        total_amount: totalAmount,
        platforms: platforms,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (reloadError) {
      console.error('Error creating reload record:', reloadError);
      throw reloadError;
    }

    console.log('Created reload record:', reloadRecord.id);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        user_id: user.id,
        reload_id: reloadRecord.id,
        platforms: platforms.join(','),
        ad_budget: amount.toString(),
        service_fee: serviceFee.toString(),
      },
    });

    console.log('Created payment intent:', paymentIntent.id);

    // Update reload record with payment intent ID
    const { error: updateError } = await supabaseClient
      .from('ad_budget_reloads')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', reloadRecord.id);

    if (updateError) {
      console.error('Error updating reload record:', updateError);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        reloadId: reloadRecord.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating ad budget payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});