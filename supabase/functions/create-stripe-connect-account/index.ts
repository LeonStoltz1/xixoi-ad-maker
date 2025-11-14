import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Stripe } from 'https://esm.sh/stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { 
  apiVersion: '2023-10-16' as any
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Creating Stripe Connect account for user:', user.id);

    // Get or create affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (affiliateError) {
      throw affiliateError;
    }

    if (!affiliate) {
      throw new Error('No affiliate account found. Please create an affiliate account first.');
    }

    // Check if already has Stripe account
    if (affiliate.stripe_account_id && affiliate.stripe_onboarding_complete) {
      return new Response(
        JSON.stringify({ 
          message: 'Stripe Connect account already set up',
          accountId: affiliate.stripe_account_id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let accountId = affiliate.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: affiliate.payout_email || user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      accountId = account.id;

      // Save account ID to database
      await supabase
        .from('affiliates')
        .update({ stripe_account_id: accountId })
        .eq('id', affiliate.id);

      console.log('Created Stripe Connect account:', accountId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin')}/affiliates?setup=failed`,
      return_url: `${req.headers.get('origin')}/affiliates?setup=success`,
      type: 'account_onboarding',
    });

    console.log('Created account link:', accountLink.url);

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
