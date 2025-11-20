import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import React from "https://esm.sh/react@18.3.1";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { AffiliateWelcomeEmail } from "./_templates/affiliate-welcome.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliateId } = await req.json();

    if (!affiliateId) {
      return new Response(
        JSON.stringify({ error: 'Affiliate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email to affiliate: ${affiliateId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('id, code, payout_email, user_id')
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

    // Construct affiliate link
    const baseUrl = 'https://xixoi.com';
    const affiliateLink = `${baseUrl}?ref=${affiliate.code}`;

    console.log(`Rendering email for ${affiliate.code} at ${affiliate.payout_email}`);

    // Render React Email template
    const html = await renderAsync(
      React.createElement(AffiliateWelcomeEmail, {
        affiliateCode: affiliate.code,
        affiliateLink: affiliateLink,
        email: affiliate.payout_email,
      })
    );

    // Send welcome email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'xiXoi Affiliates <affiliates@xixoi.com>',
      to: [affiliate.payout_email],
      subject: 'Welcome to xiXoi™ Affiliates - Start Earning 20% Today! 🎉',
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('✓ Welcome email sent successfully:', emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        emailId: emailData?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-affiliate-welcome function:', error);
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
