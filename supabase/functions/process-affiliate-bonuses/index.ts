import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { supabaseClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MILESTONES = [
  { level: 20, amount: 200 },
  { level: 50, amount: 500 },
  { level: 100, amount: 1000 },
  { level: 500, amount: 5000 },
  { level: 1000, amount: 10000 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking affiliate milestone bonuses...');
    const supabase = supabaseClient();

    // Get all affiliates with sufficient conversions
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('id, total_paid_conversions')
      .gte('total_paid_conversions', 20); // Minimum for first milestone

    if (affiliatesError) {
      throw affiliatesError;
    }

    console.log(`Checking ${affiliates?.length || 0} affiliates for milestone bonuses`);

    let bonusesAwarded = 0;

    for (const affiliate of affiliates || []) {
      const conversions = affiliate.total_paid_conversions;

      // Find highest eligible milestone they haven't received yet
      for (const milestone of MILESTONES) {
        if (conversions >= milestone.level) {
          // Check if bonus already exists
          const { data: existingBonus } = await supabase
            .from('affiliate_bonus_rewards')
            .select('id')
            .eq('affiliate_id', affiliate.id)
            .eq('milestone_level', milestone.level)
            .eq('reward_type', 'milestone')
            .maybeSingle();

          if (!existingBonus) {
            console.log(`Awarding $${milestone.amount} bonus to ${affiliate.id} for ${milestone.level} conversions`);
            
            // Create bonus reward
            await supabase
              .from('affiliate_bonus_rewards')
              .insert({
                affiliate_id: affiliate.id,
                reward_type: 'milestone',
                milestone_level: milestone.level,
                amount: milestone.amount,
                status: 'pending',
              });

            bonusesAwarded++;

            // Send celebration email
            await supabase.functions.invoke('send-milestone-celebration', {
              body: {
                affiliateId: affiliate.id,
                milestoneLevel: milestone.level,
                amount: milestone.amount,
              },
            });
          }
        }
      }
    }

    console.log(`Milestone check complete. ${bonusesAwarded} new bonuses awarded`);

    return new Response(
      JSON.stringify({
        success: true,
        affiliatesChecked: affiliates?.length || 0,
        bonusesAwarded,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing affiliate bonuses:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
