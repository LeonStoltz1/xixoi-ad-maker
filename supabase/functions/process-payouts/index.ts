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
        .select('affiliate_id, total_revenue, affiliate_earnings, affiliates!inner(stripe_account_id)')
        .eq('referred_user_id', sub.user_id)
        .maybeSingle();

      const affiliatePayout = price * 0.20;
      const agencyBonus = price > 99 ? (price - 99) * 0.10 : 0;
      const total = affiliatePayout + agencyBonus;

      totalPayout += total;
      totalAffiliatePayout += affiliatePayout;
      totalAgencyBonus += agencyBonus;

      // Transfer to Affiliate if exists
      if (referral && Array.isArray(referral.affiliates) && referral.affiliates[0]?.stripe_account_id) {
        console.log(`Transferring $${affiliatePayout} to affiliate`);
        transfers.push(
          stripe.transfers.create({
            amount: Math.round(affiliatePayout * 100),
            currency: 'usd',
            destination: referral.affiliates[0].stripe_account_id,
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
        const currentTotalRevenue = referral.total_revenue || 0;
        const currentAffiliateEarnings = referral.affiliate_earnings || 0;
        
        await supabase
          .from('affiliate_referrals')
          .update({
            total_revenue: currentTotalRevenue + price,
            affiliate_earnings: currentAffiliateEarnings + affiliatePayout
          })
          .eq('referred_user_id', sub.user_id);

        // Update affiliate total_earned directly
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('total_earned, payout_email, code')
          .eq('id', referral.affiliate_id)
          .single();
        
        if (affiliate) {
          const newTotalEarned = (affiliate.total_earned || 0) + affiliatePayout;
          await supabase
            .from('affiliates')
            .update({
              total_earned: newTotalEarned
            })
            .eq('id', referral.affiliate_id);

          // Send email notification to affiliate
          if (affiliate.payout_email) {
            const { count: referralCount } = await supabase
              .from('affiliate_referrals')
              .select('*', { count: 'exact', head: true })
              .eq('affiliate_id', referral.affiliate_id);

            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payout-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({
                  email: affiliate.payout_email,
                  affiliateCode: affiliate.code,
                  amount: affiliatePayout,
                  month,
                  totalEarned: newTotalEarned,
                  referralCount: referralCount || 0
                })
              });
              console.log(`Payout email sent to ${affiliate.payout_email}`);
            } catch (emailError) {
              console.error('Failed to send email:', emailError);
              // Don't fail the whole process if email fails
            }
          }
        }
      }
    }

    await Promise.all(transfers);

    // Optional: Trigger Zapier webhook if configured
    const ZAPIER_WEBHOOK = Deno.env.get('ZAPIER_PAYOUT_WEBHOOK');
    if (ZAPIER_WEBHOOK) {
      try {
        await fetch(ZAPIER_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'monthly_payouts_completed',
            month,
            totalPayout,
            totalAffiliatePayout,
            totalAgencyBonus,
            affiliateCount: subscriptions?.length || 0,
            timestamp: new Date().toISOString()
          })
        });
        console.log('Zapier webhook triggered successfully');
      } catch (error) {
        console.error('Failed to trigger Zapier webhook:', error);
      }
    }

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
