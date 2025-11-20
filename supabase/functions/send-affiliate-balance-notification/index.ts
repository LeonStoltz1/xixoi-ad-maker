import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import React from "https://esm.sh/react@18.3.1";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { BalanceNotificationEmail } from "./_templates/balance-notification.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting affiliate balance notification emails...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const dashboardBaseUrl = 'https://xixoi.com/affiliates';

    // Query all active affiliates with payout emails
    const { data: affiliates, error: queryError } = await supabaseClient
      .from('affiliates')
      .select(`
        id,
        code,
        total_earned,
        total_paid,
        payout_email,
        is_blocked
      `)
      .eq('is_blocked', false)
      .not('payout_email', 'is', null);

    if (queryError) {
      console.error('Error querying affiliates:', queryError);
      throw queryError;
    }

    console.log(`Found ${affiliates?.length || 0} active affiliates`);

    // Filter for those below $100 unpaid balance
    const affiliatesToNotify = affiliates?.filter(affiliate => {
      const unpaid = (affiliate.total_earned || 0) - (affiliate.total_paid || 0);
      return unpaid > 0 && unpaid < 100;
    }) || [];

    console.log(`Sending notifications to ${affiliatesToNotify.length} affiliates below $100 threshold`);

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Send email to each eligible affiliate
    for (const affiliate of affiliatesToNotify) {
      try {
        const currentBalance = (affiliate.total_earned || 0) - (affiliate.total_paid || 0);
        const amountNeeded = 100 - currentBalance;

        // Get referral count
        const { count: referralCount } = await supabaseClient
          .from('affiliate_referrals')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id);

        console.log(`Processing notification for ${affiliate.code}: $${currentBalance.toFixed(2)} balance`);

        // Render React Email template
        const html = await renderAsync(
          React.createElement(BalanceNotificationEmail, {
            affiliateCode: affiliate.code,
            currentBalance: currentBalance,
            amountNeeded: amountNeeded,
            totalEarned: affiliate.total_earned || 0,
            totalPaid: affiliate.total_paid || 0,
            referralCount: referralCount || 0,
            dashboardUrl: dashboardBaseUrl,
          })
        );

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: 'xiXoi Affiliates <affiliates@xixoi.com>',
          to: [affiliate.payout_email],
          subject: `Your Affiliate Balance: $${currentBalance.toFixed(2)} — Keep Going!`,
          html,
        });

        if (emailError) {
          console.error(`Email error for ${affiliate.code}:`, emailError);
          throw emailError;
        }

        console.log(`✓ Email sent to ${affiliate.payout_email}`);
        results.successful++;

      } catch (error) {
        console.error(`✗ Failed to send email to ${affiliate.code}:`, error);
        results.failed++;
        results.errors.push({
          affiliate_code: affiliate.code,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Balance notification emails complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${results.successful} balance notification emails`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-affiliate-balance-notification function:', error);
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
