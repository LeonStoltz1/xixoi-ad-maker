import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { free_ad_id } = await req.json();

    if (!free_ad_id) {
      throw new Error('Missing free_ad_id');
    }

    // Get free ad details
    const { data: freeAd, error: freeAdError } = await supabaseAdmin
      .from('free_ads')
      .select(`
        *,
        user_id,
        ad_variant_id
      `)
      .eq('id', free_ad_id)
      .single();

    if (freeAdError || !freeAd) {
      throw new Error('Free ad not found');
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', freeAd.user_id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      throw new Error('User Stripe customer not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Create checkout session for $29
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      line_items: [
        {
          price: Deno.env.get('STRIPE_PRICE_BRANDING_REMOVAL'),
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        free_ad_id: free_ad_id,
        reason: 'admin_charge',
        user_id: freeAd.user_id,
      },
      success_url: `${req.headers.get('origin')}/admin?charged=success`,
      cancel_url: `${req.headers.get('origin')}/admin?charged=cancel`,
    });

    // Mark as tampered (will be marked as charged when webhook processes payment)
    await supabaseAdmin
      .from('free_ads')
      .update({ tampered: true })
      .eq('id', free_ad_id);

    console.log(`Admin charge initiated for free_ad ${free_ad_id}, session: ${session.id}`);

    return new Response(
      JSON.stringify({ success: true, session_url: session.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Admin charge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
