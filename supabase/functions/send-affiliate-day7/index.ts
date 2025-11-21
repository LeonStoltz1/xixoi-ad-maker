import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { supabaseClient } from '../_shared/supabase.ts';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { Day7ChallengeEmail } from './_templates/day7-challenge.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    const supabase = supabaseClient();

    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*, profiles(email, full_name)')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found');
    }

    const email = affiliate.profiles?.email;
    const name = affiliate.profiles?.full_name || 'there';

    if (!email) {
      throw new Error('No email found for affiliate');
    }

    const currentEarnings = affiliate.total_commission_amount || 0;

    const html = await renderAsync(
      React.createElement(Day7ChallengeEmail, {
        affiliateName: name,
        referralLink: `https://xixoi.com?ref=${affiliate.code}`,
        currentConversions: affiliate.total_paid_conversions || 0,
        currentEarnings,
      })
    );

    await resend.emails.send({
      from: 'xiXoi Affiliate Program <affiliates@xixoi.com>',
      to: [email],
      subject: '🏆 Day 7: The First $500 Challenge',
      html,
    });

    await supabase
      .from('affiliate_onboarding_progress')
      .upsert({
        affiliate_id: affiliateId,
        day_number: 7,
        email_sent_at: new Date().toISOString(),
        completed: true,
      });

    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending Day 7 email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
