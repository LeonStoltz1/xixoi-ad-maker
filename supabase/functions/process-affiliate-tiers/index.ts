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
    console.log('Starting affiliate tier classification...');
    const supabase = supabaseClient();

    // Get all affiliates with their current stats
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select(`
        id,
        current_tier,
        total_paid_conversions,
        total_commission_amount
      `);

    if (affiliatesError) {
      throw affiliatesError;
    }

    console.log(`Processing ${affiliates?.length || 0} affiliates`);

    let tierChanges = 0;
    let superAffiliatesDetected = 0;

    for (const affiliate of affiliates || []) {
      // Calculate monthly revenue (approximate from total)
      const monthlyRevenue = affiliate.total_commission_amount / 12 || 0;
      
      // Determine new tier
      let newTier = 'inactive';
      const conversions = affiliate.total_paid_conversions || 0;
      
      if (conversions >= 100 || monthlyRevenue >= 3000) {
        newTier = 'super';
      } else if (conversions >= 26) {
        newTier = 'power';
      } else if (conversions >= 6) {
        newTier = 'active';
      } else if (conversions >= 1) {
        newTier = 'light';
      }

      // Update if tier changed
      if (newTier !== affiliate.current_tier) {
        console.log(`Tier change for ${affiliate.id}: ${affiliate.current_tier} → ${newTier}`);
        
        // Update affiliate tier
        await supabase
          .from('affiliates')
          .update({
            current_tier: newTier,
            last_tier_check: new Date().toISOString(),
            super_affiliate_eligible: newTier === 'super',
          })
          .eq('id', affiliate.id);

        // Log tier change
        await supabase
          .from('affiliate_tiers')
          .insert({
            affiliate_id: affiliate.id,
            tier: newTier,
            previous_tier: affiliate.current_tier,
          });

        tierChanges++;

        // Trigger super affiliate setup if newly super
        if (newTier === 'super' && affiliate.current_tier !== 'super') {
          superAffiliatesDetected++;
          
          // Call super affiliate setup function
          await supabase.functions.invoke('setup-super-affiliate', {
            body: { affiliateId: affiliate.id },
          });
        }
      }
    }

    console.log(`Tier classification complete. ${tierChanges} tier changes, ${superAffiliatesDetected} new super affiliates`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed: affiliates?.length || 0,
        tierChanges,
        superAffiliatesDetected,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing affiliate tiers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
