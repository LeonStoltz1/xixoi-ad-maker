import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import React from "https://esm.sh/react@18.3.1";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { MilestoneCelebrationEmail } from "./_templates/milestone-celebration.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliateId, milestoneType } = await req.json();

    if (!affiliateId || !milestoneType) {
      return new Response(
        JSON.stringify({ error: 'Affiliate ID and milestone type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending milestone email to affiliate: ${affiliateId}, milestone: ${milestoneType}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('id, code, payout_email, total_earned')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      console.error('Error fetching affiliate:', affiliateError);
      throw new Error('Affiliate not found');
    }

    if (!affiliate.payout_email) {
      console.error('Affiliate has no payout email');
      throw new Error('Affiliate email not configured');
    }

    // Get referral count
    const { count: referralCount } = await supabaseClient
      .from('affiliate_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId);

    // Determine milestone value based on type
    let milestoneValue = 0;
    if (milestoneType.startsWith('referrals_')) {
      milestoneValue = parseInt(milestoneType.split('_')[1]);
    } else if (milestoneType.startsWith('earnings_')) {
      milestoneValue = parseInt(milestoneType.split('_')[1]);
    } else if (milestoneType === 'first_referral') {
      milestoneValue = 1;
    } else if (milestoneType === 'first_payout') {
      milestoneValue = 1;
    }

    console.log(`Rendering milestone email for ${affiliate.code}: ${milestoneType}`);

    // Render React Email template
    const html = await renderAsync(
      React.createElement(MilestoneCelebrationEmail, {
        affiliateCode: affiliate.code,
        milestoneType: milestoneType,
        milestoneValue: milestoneValue,
        totalEarnings: affiliate.total_earned || 0,
        totalReferrals: referralCount || 0,
      })
    );

    // Send milestone celebration email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'xiXoi Affiliates <affiliates@xixoi.com>',
      to: [affiliate.payout_email],
      subject: `🎉 Milestone Unlocked: ${milestoneType.replace(/_/g, ' ').toUpperCase()}!`,
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('✓ Milestone email sent successfully:', emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Milestone email sent successfully',
        emailId: emailData?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-affiliate-milestone function:', error);
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
