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
    console.log('Starting Stripe account verification check...');

    // Get all affiliates with Stripe accounts that are not verified
    const { data: affiliates, error } = await supabase
      .from('affiliates')
      .select('id, stripe_account_id, stripe_account_status')
      .not('stripe_account_id', 'is', null)
      .neq('stripe_account_status', 'verified');

    if (error) throw error;

    console.log(`Found ${affiliates?.length || 0} accounts to verify`);

    let updated = 0;
    let verified = 0;
    let restricted = 0;
    let rejected = 0;

    for (const affiliate of affiliates || []) {
      try {
        // Retrieve account status from Stripe
        const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
        
        // Determine account status
        let accountStatus = 'pending';
        
        if (account.charges_enabled && account.payouts_enabled) {
          accountStatus = 'verified';
          verified++;
        } else if (account.requirements?.disabled_reason) {
          // Account is restricted or rejected
          accountStatus = account.requirements.disabled_reason === 'rejected.fraud' 
            ? 'rejected' 
            : 'restricted';
          
          if (accountStatus === 'rejected') rejected++;
          else restricted++;
        } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
          accountStatus = 'pending';
        }

        // Update if status changed
        if (accountStatus !== affiliate.stripe_account_status) {
          await supabase
            .from('affiliates')
            .update({
              stripe_account_status: accountStatus,
              stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
            })
            .eq('id', affiliate.id);

          updated++;
          console.log(`Updated affiliate ${affiliate.id}: ${affiliate.stripe_account_status} → ${accountStatus}`);
        }
      } catch (error: any) {
        console.error(`Failed to verify account for affiliate ${affiliate.id}:`, error.message);
      }
    }

    const summary = {
      total_checked: affiliates?.length || 0,
      updated,
      verified,
      restricted,
      rejected,
    };

    console.log('Verification complete:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error verifying Stripe accounts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
