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
    console.log('Starting payout processing...');

    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        profiles!inner(id, stripe_customer_id)
      `)
      .eq('status', 'active');

    if (subError) throw subError;

    let totalPayout = 0;
    let totalAffiliatePayout = 0;
    let totalAgencyBonus = 0;
    const transfers: Promise<any>[] = [];
    const month = new Date().toISOString().slice(0, 7);

    console.log(`Processing ${subscriptions?.length || 0} subscriptions`);

    for (const sub of subscriptions || []) {
      // Get subscription price from Stripe
      const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const price = subscription.items.data[0].price.unit_amount! / 100; // Convert cents to dollars

      // Check if user has affiliate referral
      const { data: referral } = await supabase
        .from('affiliate_referrals')
        .select('affiliate_id, affiliates!inner(stripe_account_id)')
        .eq('referred_user_id', sub.user_id)
        .maybeSingle();

      const affiliatePayout = price * 0.30;
      const agencyBonus = price > 99 ? (price - 99) * 0.10 : 0;
      const total = affiliatePayout + agencyBonus;

      totalPayout += total;
      totalAffiliatePayout += affiliatePayout;
      totalAgencyBonus += agencyBonus;

      // Transfer to Affiliate if exists
      if (referral?.affiliates?.stripe_account_id) {
        console.log(`Transferring $${affiliatePayout} to affiliate`);
        transfers.push(
          stripe.transfers.create({
            amount: Math.round(affiliatePayout * 100),
            currency: 'usd',
            destination: referral.affiliates.stripe_account_id,
            metadata: { 
              type: 'affiliate', 
              subscription_id: sub.id,
              month 
            }
          })
        );
      }

      // Log payout
      await supabase.from('payouts').insert({
        month,
        affiliate: affiliatePayout,
        agency: agencyBonus,
        total,
        net: price - total,
        subscription_id: sub.id
      });

      // Update affiliate earnings
      if (referral) {
        await supabase
          .from('affiliate_referrals')
          .update({
            total_revenue: referral.total_revenue + price,
            affiliate_earnings: referral.affiliate_earnings + affiliatePayout
          })
          .eq('referred_user_id', sub.user_id);

        await supabase.rpc('increment', {
          table_name: 'affiliates',
          row_id: referral.affiliate_id,
          column_name: 'total_earned',
          increment_by: affiliatePayout
        });
      }
    }

    await Promise.all(transfers);

    console.log(`Processed ${subscriptions?.length || 0} payouts. Total: $${totalPayout}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalPayout, 
        totalAffiliatePayout,
        totalAgencyBonus,
        count: subscriptions?.length || 0,
        month
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Payout processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
