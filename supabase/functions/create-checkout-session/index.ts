import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceType, campaignId, useEmbedded } = await req.json();
    console.log('Creating checkout session:', { priceType, campaignId, useEmbedded });

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Get or create Stripe customer
    let customer;
    if (profile.stripe_customer_id) {
      customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      // Update profile with Stripe customer ID
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);

      // Store in stripe_customers table
      await supabaseAdmin
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: profile.email,
        });
    }

    // Determine price and mode based on priceType
    let priceId: string;
    let mode: 'payment' | 'subscription';
    let successUrl: string;
    const origin = req.headers.get('origin') || 'http://localhost:8080';

    if (priceType === 'branding_removal') {
      priceId = Deno.env.get('STRIPE_PRICE_BRANDING_REMOVAL')!;
      mode = 'payment';
      successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (priceType === 'pro_subscription') {
      priceId = Deno.env.get('STRIPE_PRICE_PRO_SUBSCRIPTION')!;
      mode = 'subscription';
      successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (priceType === 'elite_subscription') {
      priceId = Deno.env.get('STRIPE_PRICE_ELITE')!;
      mode = 'subscription';
      successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (priceType === 'agency_subscription') {
      priceId = Deno.env.get('STRIPE_PRICE_AGENCY')!;
      mode = 'subscription';
      successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      throw new Error('Invalid priceType');
    }

    if (!priceId) {
      throw new Error(`Price ID not configured for ${priceType}`);
    }

    // Create payment intent for embedded checkout or session for hosted checkout
    if (useEmbedded) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: mode === 'payment' ? 500 : 9900, // $5 or $99 based on type
        currency: 'usd',
        customer: customer.id,
        metadata: {
          priceType,
          campaignId: campaignId || '',
          userId: user.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Payment intent created:', paymentIntent.id);

      return new Response(
        JSON.stringify({ 
          clientSecret: paymentIntent.client_secret,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Create checkout session for redirect flow
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        user_id: user.id,
        campaign_id: campaignId || '',
        price_type: priceType,
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-checkout-session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
