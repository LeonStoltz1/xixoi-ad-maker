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
    console.log('Starting ad spend billing process...');

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate billing period (previous month)
    const now = new Date();
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // First day of previous month

    console.log('Billing period:', {
      start: billingPeriodStart.toISOString(),
      end: billingPeriodEnd.toISOString()
    });

    // Find all elite plan users
    const { data: eliteUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('plan', 'elite');

    if (usersError) {
      throw new Error(`Error fetching elite users: ${usersError.message}`);
    }

    if (!eliteUsers || eliteUsers.length === 0) {
      console.log('No elite users found');
      return new Response(
        JSON.stringify({ message: 'No elite users to bill' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${eliteUsers.length} elite users`);

    const billingResults = [];

    // Process each elite user
    for (const user of eliteUsers) {
      console.log(`Processing user: ${user.email}`);

      if (!user.stripe_customer_id) {
        console.log(`Skipping user ${user.email} - no Stripe customer ID`);
        continue;
      }

      // Get unbilled ad spend for this user in the billing period
      const { data: adSpendRecords, error: spendError } = await supabase
        .from('ad_spend_tracking')
        .select('id, amount, currency, platform, campaign_id')
        .eq('user_id', user.id)
        .eq('billed', false)
        .gte('spend_date', billingPeriodStart.toISOString().split('T')[0])
        .lte('spend_date', billingPeriodEnd.toISOString().split('T')[0]);

      if (spendError) {
        console.error(`Error fetching ad spend for user ${user.email}:`, spendError);
        continue;
      }

      if (!adSpendRecords || adSpendRecords.length === 0) {
        console.log(`No unbilled ad spend for user ${user.email}`);
        continue;
      }

      // Calculate total ad spend
      const totalAdSpend = adSpendRecords.reduce((sum, record) => sum + Number(record.amount), 0);
      
      // Calculate 5% fee
      const feeAmount = Math.round(totalAdSpend * 0.05 * 100); // Convert to cents

      if (feeAmount < 50) {
        // Minimum charge of $0.50
        console.log(`Ad spend fee too small for user ${user.email}: $${feeAmount / 100}`);
        continue;
      }

      console.log(`User ${user.email}: Total ad spend = $${totalAdSpend}, Fee (5%) = $${feeAmount / 100}`);

      try {
        // Create invoice item in Stripe
        await stripe.invoiceItems.create({
          customer: user.stripe_customer_id,
          amount: feeAmount,
          currency: 'usd',
          description: `Ad Spend Fee (5% of $${totalAdSpend.toFixed(2)}) - ${billingPeriodStart.toLocaleDateString()} to ${billingPeriodEnd.toLocaleDateString()}`,
          metadata: {
            user_id: user.id,
            billing_period_start: billingPeriodStart.toISOString(),
            billing_period_end: billingPeriodEnd.toISOString(),
            total_ad_spend: totalAdSpend.toString(),
          }
        });

        // Create and finalize invoice
        const invoice = await stripe.invoices.create({
          customer: user.stripe_customer_id,
          auto_advance: true, // Automatically finalize and attempt payment
          description: `Scale Elite - Ad Spend Fee for ${billingPeriodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          metadata: {
            user_id: user.id,
            billing_type: 'ad_spend_percentage',
          }
        });

        // Finalize the invoice (this will attempt to charge the customer)
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        console.log(`Invoice created for user ${user.email}: ${finalizedInvoice.id}`);

        // Mark ad spend records as billed
        const recordIds = adSpendRecords.map(r => r.id);
        const { error: updateError } = await supabase
          .from('ad_spend_tracking')
          .update({ 
            billed: true,
            stripe_invoice_id: finalizedInvoice.id
          })
          .in('id', recordIds);

        if (updateError) {
          console.error(`Error marking records as billed for user ${user.email}:`, updateError);
        }

        billingResults.push({
          user_email: user.email,
          total_ad_spend: totalAdSpend,
          fee_amount: feeAmount / 100,
          invoice_id: finalizedInvoice.id,
          status: 'success'
        });

      } catch (stripeError: any) {
        console.error(`Stripe error for user ${user.email}:`, stripeError.message);
        billingResults.push({
          user_email: user.email,
          total_ad_spend: totalAdSpend,
          fee_amount: feeAmount / 100,
          status: 'error',
          error: stripeError.message
        });
      }
    }

    console.log('Billing process completed');

    return new Response(
      JSON.stringify({
        success: true,
        billing_period: {
          start: billingPeriodStart.toISOString(),
          end: billingPeriodEnd.toISOString()
        },
        processed_users: eliteUsers.length,
        billing_results: billingResults
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in bill-ad-spend-percentage function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
