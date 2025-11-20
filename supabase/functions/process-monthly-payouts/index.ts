import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting monthly affiliate payout processing...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Query affiliates with $100+ unpaid earnings
    const { data: eligibleAffiliates, error: queryError } = await supabaseClient
      .from('affiliates')
      .select(`
        id,
        user_id,
        code,
        total_earned,
        total_paid,
        stripe_account_id,
        stripe_account_status,
        payout_email,
        is_blocked
      `)
      .eq('is_blocked', false)
      .eq('stripe_account_status', 'verified')
      .not('stripe_account_id', 'is', null);

    if (queryError) {
      console.error('Error querying affiliates:', queryError);
      throw queryError;
    }

    console.log(`Found ${eligibleAffiliates?.length || 0} potential affiliates`);

    // Filter for those with $100+ unpaid
    const affiliatesToPay = eligibleAffiliates?.filter(affiliate => {
      const unpaid = (affiliate.total_earned || 0) - (affiliate.total_paid || 0);
      return unpaid >= 100;
    }) || [];

    console.log(`Processing payouts for ${affiliatesToPay.length} affiliates with $100+ earnings`);

    const results = {
      successful: 0,
      failed: 0,
      totalAmount: 0,
      errors: [] as any[],
    };

    // Process each eligible affiliate
    for (const affiliate of affiliatesToPay) {
      try {
        const unpaidAmount = (affiliate.total_earned || 0) - (affiliate.total_paid || 0);
        const payoutAmount = Math.floor(unpaidAmount * 100); // Convert to cents

        console.log(`Processing payout for affiliate ${affiliate.code}: $${unpaidAmount}`);

        // Create Stripe transfer to affiliate's connected account
        const transfer = await stripe.transfers.create({
          amount: payoutAmount,
          currency: 'usd',
          destination: affiliate.stripe_account_id,
          description: `Monthly affiliate payout for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          metadata: {
            affiliate_id: affiliate.id,
            affiliate_code: affiliate.code,
            payout_type: 'automatic_monthly',
          },
        });

        console.log(`Stripe transfer created: ${transfer.id}`);

        // Record payout in database
        const { error: payoutError } = await supabaseClient
          .from('affiliate_payouts')
          .insert({
            affiliate_id: affiliate.id,
            amount: unpaidAmount,
            status: 'completed',
            method: 'stripe',
            transaction_id: transfer.id,
            processed_at: new Date().toISOString(),
            admin_note: 'Automatic monthly payout',
          });

        if (payoutError) {
          console.error('Error recording payout:', payoutError);
          throw payoutError;
        }

        // Update total_paid in affiliates table
        const { error: updateError } = await supabaseClient
          .from('affiliates')
          .update({
            total_paid: (affiliate.total_paid || 0) + unpaidAmount,
          })
          .eq('id', affiliate.id);

        if (updateError) {
          console.error('Error updating affiliate total_paid:', updateError);
          throw updateError;
        }

        // Send confirmation email
        if (affiliate.payout_email) {
          try {
            await resend.emails.send({
              from: 'xiXoi Affiliates <payouts@xixoi.com>',
              to: [affiliate.payout_email],
              subject: `Your Monthly Affiliate Payout of $${unpaidAmount.toFixed(2)} Has Been Processed`,
              html: `
                <h1>Monthly Payout Processed Successfully</h1>
                <p>Hi there,</p>
                <p>Great news! Your automatic monthly affiliate payout has been processed.</p>
                <h2>Payout Details</h2>
                <ul>
                  <li><strong>Amount:</strong> $${unpaidAmount.toFixed(2)}</li>
                  <li><strong>Period:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</li>
                  <li><strong>Method:</strong> Stripe Connect</li>
                  <li><strong>Transaction ID:</strong> ${transfer.id}</li>
                  <li><strong>Processed:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</li>
                </ul>
                <p>The funds should appear in your connected bank account within 3-5 business days.</p>
                <h3>Your Earnings Summary</h3>
                <ul>
                  <li><strong>Total Lifetime Earnings:</strong> $${affiliate.total_earned.toFixed(2)}</li>
                  <li><strong>Total Paid Out:</strong> $${((affiliate.total_paid || 0) + unpaidAmount).toFixed(2)}</li>
                  <li><strong>Current Balance:</strong> $0.00</li>
                </ul>
                <p>Keep up the great work promoting xiXoi™!</p>
                <p>Best regards,<br>The xiXoi™ Affiliate Team</p>
                <hr>
                <p style="font-size: 12px; color: #666;">Questions? Contact us at support@xixoi.com</p>
              `,
            });
            console.log(`Email sent to ${affiliate.payout_email}`);
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the payout if email fails
          }
        }

        results.successful++;
        results.totalAmount += unpaidAmount;
        console.log(`✓ Successfully processed payout for ${affiliate.code}`);

      } catch (error) {
        console.error(`✗ Failed to process payout for affiliate ${affiliate.code}:`, error);
        results.failed++;
        results.errors.push({
          affiliate_code: affiliate.code,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Monthly payout processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.successful} payouts totaling $${results.totalAmount.toFixed(2)}`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in process-monthly-payouts function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
