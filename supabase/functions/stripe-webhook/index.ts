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
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey || !webhookSecret) {
      throw new Error('Stripe keys not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event received:', event.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get price IDs for plan detection
    const PRICE_ID_PRO = Deno.env.get('STRIPE_PRICE_PRO_SUBSCRIPTION');
    const PRICE_ID_ELITE = Deno.env.get('STRIPE_PRICE_ELITE');
    const PRICE_ID_AGENCY = Deno.env.get('STRIPE_PRICE_AGENCY');

    // Helper function to determine plan type from price ID
    const getPlanTypeFromPriceId = (priceId: string): string => {
      if (priceId === PRICE_ID_PRO) return 'pro';
      if (priceId === PRICE_ID_ELITE) return 'elite';
      if (priceId === PRICE_ID_AGENCY) return 'agency';
      return 'pro'; // default fallback
    };

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const campaignId = session.metadata?.campaign_id;
        const priceType = session.metadata?.price_type;

        console.log('Checkout completed:', { userId, campaignId, priceType });

        if (!userId) break;

        // Update stripe_customer_id if not set
        if (session.customer) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', userId);
        }

        if (priceType === 'branding_removal' && campaignId) {
          // Handle one-time branding removal payment
          await supabase
            .from('campaigns')
            .update({ 
              has_watermark: false,
              stripe_payment_id: session.payment_intent as string
            })
            .eq('id', campaignId);

          // Create payment transaction
          await supabase
            .from('payment_transactions')
            .insert({
              user_id: userId,
              campaign_id: campaignId,
              stripe_payment_intent_id: session.payment_intent as string,
              amount: session.amount_total || 2900,
              currency: session.currency || 'usd',
              status: 'succeeded',
              payment_type: 'branding_removal',
            });

          console.log('Branding watermark removed for campaign:', campaignId);
        }

        // Handle watermark tampering auto-charge
        if (session.metadata?.reason === 'watermark_tampered') {
          const variantId = session.metadata?.variant_id;
          
          if (variantId) {
            // Mark as charged and tampered in free_ads
            await supabase
              .from('free_ads')
              .update({ 
                charged: true,
                tampered: true
              })
              .eq('ad_variant_id', variantId);

            // Get campaign from variant
            const { data: variant } = await supabase
              .from('ad_variants')
              .select('campaign_id')
              .eq('id', variantId)
              .single();

            if (variant) {
              // Remove watermark since they paid the $29
              await supabase
                .from('campaigns')
                .update({ 
                  has_watermark: false,
                  stripe_payment_id: session.payment_intent as string
                })
                .eq('id', variant.campaign_id);
            }

            console.log('Watermark tampering charge processed for variant:', variantId);
          }
        }

        if (priceType === 'pro_subscription' && session.subscription) {
          // Handle Pro subscription
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Determine plan type from price ID
          const priceId = subscription.items.data[0]?.price.id;
          const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

          console.log('Creating subscription:', { planType, priceId });

          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              status: subscription.status,
              plan_type: planType,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            });

          // Update user's plan in profiles
          await supabase
            .from('profiles')
            .update({ plan: planType })
            .eq('id', userId);

          console.log('Updated user plan to:', planType);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription event:', event.type, subscription.id);

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle();

        if (!profile) {
          console.log('No profile found for customer:', subscription.customer);
          break;
        }

        // Determine plan type from price ID
        const priceId = subscription.items.data[0]?.price.id;
        const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

        console.log('Upserting subscription:', { planType, status: subscription.status });

        // Upsert subscription
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: profile.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            plan_type: planType,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, {
            onConflict: 'stripe_subscription_id'
          });

        // Update profile plan based on subscription status
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await supabase
            .from('profiles')
            .update({ plan: planType })
            .eq('id', profile.id);
          
          console.log('Updated profile plan to:', planType);
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          // Downgrade to free if subscription is canceled or unpaid
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', profile.id);
          
          console.log('Downgraded profile to free plan');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (!profile) break;

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            cancel_at_period_end: true
          })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade user to free plan
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', profile.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment succeeded:', invoice.id);

        if (invoice.subscription) {
          // Get subscription to determine plan type
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const priceId = subscription.items.data[0]?.price.id;
          const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

          // Update subscription as active
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription as string);

          // Find user and update their plan
          const { data: subscriptionRecord } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .maybeSingle();

          if (subscriptionRecord) {
            await supabase
              .from('profiles')
              .update({ plan: planType })
              .eq('id', subscriptionRecord.user_id);
            
            console.log('Updated user plan after payment:', planType);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment failed:', invoice.id);

        if (invoice.subscription) {
          // Update subscription as past_due
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);

          // Note: We don't immediately downgrade the user's plan
          // Stripe will handle retries and eventually cancel if needed
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update or create payment transaction
        await supabase
          .from('payment_transactions')
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            payment_type: 'branding_removal',
          }, {
            onConflict: 'stripe_payment_intent_id',
            ignoreDuplicates: false
          });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment transaction
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        
        if (userId) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', userId);

          // Upsert stripe_customers record
          await supabase
            .from('stripe_customers')
            .upsert({
              user_id: userId,
              stripe_customer_id: customer.id,
              email: customer.email || '',
            }, {
              onConflict: 'stripe_customer_id'
            });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
