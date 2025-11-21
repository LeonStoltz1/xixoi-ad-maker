import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { supabaseClient } from '../_shared/supabase.ts';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { MonthlySummaryEmail } from './_templates/monthly-summary.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getTierProgress = (currentTier: string, conversions: number) => {
  const tierMap: Record<string, { next: string | null; needed: number }> = {
    inactive: { next: 'light', needed: 1 - conversions },
    light: { next: 'active', needed: 6 - conversions },
    active: { next: 'power', needed: 26 - conversions },
    power: { next: 'super', needed: 100 - conversions },
    super: { next: null, needed: 0 },
  };
  return tierMap[currentTier] || tierMap.inactive;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient();

    // Calculate last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Fetch all active affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('*, profiles(email, full_name)')
      .not('affiliate_tier', 'eq', 'inactive');

    if (affiliatesError) {
      console.error('Error fetching affiliates:', affiliatesError);
      throw affiliatesError;
    }

    // Send summary to each affiliate
    const emailPromises = (affiliates || []).map(async (affiliate: any) => {
      const email = affiliate.profiles?.email;
      const name = affiliate.profiles?.full_name || 'there';

      if (!email) return null;

      // Get monthly stats
      const { data: monthlyStats } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .gte('referred_at', lastMonth.toISOString())
        .lte('referred_at', lastMonthEnd.toISOString());

      const conversions = monthlyStats?.length || 0;
      const earnings = monthlyStats?.reduce((sum, ref) => sum + (ref.affiliate_earnings || 0), 0) || 0;

      // Get clicks
      const { data: clicks } = await supabase
        .from('affiliate_clicks')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      // Get leaderboard rank
      const { data: leaderboard } = await supabase
        .from('affiliate_leaderboard')
        .select('rank')
        .eq('affiliate_id', affiliate.id)
        .eq('month_start', lastMonth.toISOString().split('T')[0])
        .single();

      const tierProgress = getTierProgress(affiliate.affiliate_tier, affiliate.total_paid_conversions);

      const html = await renderAsync(
        React.createElement(MonthlySummaryEmail, {
          affiliateName: name,
          month: monthName,
          conversions,
          clicks: clicks?.length || 0,
          earnings,
          tier: affiliate.affiliate_tier,
          leaderboardRank: leaderboard?.rank || null,
          nextTier: tierProgress.next,
          conversionsToNextTier: tierProgress.needed > 0 ? tierProgress.needed : null,
        })
      );

      return resend.emails.send({
        from: 'xiXoi Affiliate Program <affiliates@xixoi.com>',
        to: [email],
        subject: `📊 Your ${monthName} Summary`,
        html,
      });
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailPromises.length,
        month: monthName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending monthly summaries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
