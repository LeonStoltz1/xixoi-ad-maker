import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { supabaseClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Updating affiliate leaderboard...');
    const supabase = supabaseClient();

    // Get current month period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all affiliates with their monthly stats
    const { data: affiliateStats, error: statsError } = await supabase
      .from('affiliate_referrals')
      .select(`
        affiliate_id,
        total_paid,
        total_commissions,
        created_at
      `);

    if (statsError) {
      throw statsError;
    }

    // Aggregate by affiliate
    const monthlyStats = new Map();

    for (const ref of affiliateStats || []) {
      const refDate = new Date(ref.created_at);
      
      // Only count referrals from current month
      if (refDate >= periodStart && refDate <= periodEnd) {
        const existing = monthlyStats.get(ref.affiliate_id) || {
          total_conversions: 0,
          total_revenue: 0,
          total_commissions: 0,
        };

        existing.total_conversions++;
        existing.total_revenue += ref.total_paid || 0;
        existing.total_commissions += ref.total_commissions || 0;

        monthlyStats.set(ref.affiliate_id, existing);
      }
    }

    // Sort by total commissions descending
    const sorted = Array.from(monthlyStats.entries())
      .sort((a, b) => b[1].total_commissions - a[1].total_commissions);

    console.log(`Updating leaderboard with ${sorted.length} affiliates`);

    // Update leaderboard table
    let rank = 1;
    for (const [affiliateId, stats] of sorted) {
      await supabase
        .from('affiliate_leaderboard')
        .upsert({
          affiliate_id: affiliateId,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          rank,
          total_conversions: stats.total_conversions,
          total_revenue: stats.total_revenue,
          total_commissions: stats.total_commissions,
          updated_at: new Date().toISOString(),
        });

      rank++;
    }

    console.log(`Leaderboard updated with ${sorted.length} ranked affiliates`);

    return new Response(
      JSON.stringify({
        success: true,
        affiliatesRanked: sorted.length,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating leaderboard:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
