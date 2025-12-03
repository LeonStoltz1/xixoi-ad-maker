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
    const { priceType, campaignId, useEmbedded, affiliateRef, adBudgetAmount } = await req.json();
    
    if (!priceType) {
      return new Response(
        JSON.stringify({ error: 'Price type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Creating checkout session:', { priceType, campaignId, useEmbedded, affiliateRef, adBudgetAmount });

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
      .select('email, stripe_customer_id, plan')
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
    // Extract project ref from Supabase URL to construct the app URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const origin = projectRef 
      ? `https://${projectRef}.lovableproject.com`
      : (req.headers.get('origin') || 'http://localhost:8080');

    if (priceType === 'branding_removal') {
      priceId = Deno.env.get('STRIPE_PRICE_BRANDING_REMOVAL')!;
      mode = 'payment';
      successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (priceType === 'quickstart_subscription') {
      // CRITICAL: Use actual Quick-Start price ID from Stripe
      priceId = 'price_1SZmlERfAZMMsSx86Qej'; // Quick-Start $49/mo
      mode = 'subscription';
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
        affiliateRef: affiliateRef || '',
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

    // Build line items array
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ];

    // If ad budget is included, add it as an additional line item
    // For combined checkout with subscription, we need to use subscription mode
    // and add the ad budget as a one-time invoice item after checkout
    const hasAdBudget = adBudgetAmount && adBudgetAmount > 0;
    
    // Calculate service fee for quickstart tier (5%)
    const serviceFee = priceType === 'quickstart_subscription' && hasAdBudget 
      ? Math.round(adBudgetAmount * 0.05 * 100) // Convert to cents
      : 0;

    // If including ad budget, create a separate price for it
    if (hasAdBudget) {
      // Create a one-time price for the ad budget
      const adBudgetPrice = await stripe.prices.create({
        unit_amount: Math.round(adBudgetAmount * 100), // Convert to cents
        currency: 'usd',
        product_data: {
          name: 'Weekly Ad Budget Pre-payment',
        },
      });

      lineItems.push({
        price: adBudgetPrice.id,
        quantity: 1,
      });

      // Add service fee if quickstart
      if (serviceFee > 0) {
        const serviceFeePrice = await stripe.prices.create({
          unit_amount: serviceFee,
          currency: 'usd',
          product_data: {
            name: 'Service Fee (5%)',
          },
        });

        lineItems.push({
          price: serviceFeePrice.id,
          quantity: 1,
        });
      }
    }

    // For combined subscription + one-time payments, we need to use subscription mode
    // with invoice items for one-time charges
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: mode,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        user_id: user.id,
        campaign_id: campaignId || '',
        price_type: priceType,
        affiliate_ref: affiliateRef || '',
        ad_budget_amount: hasAdBudget ? adBudgetAmount.toString() : '',
        service_fee: serviceFee > 0 ? (serviceFee / 100).toString() : '',
      },
      // For subscriptions with one-time items, we need this
      ...(mode === 'subscription' && hasAdBudget ? {
        payment_intent_data: undefined, // Not applicable for subscription mode
      } : {}),
    });

    console.log('Checkout session created:', session.id, 'with ad budget:', hasAdBudget ? adBudgetAmount : 'none');

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