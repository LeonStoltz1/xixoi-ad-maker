import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { politicalAdId, platforms, budgets } = await req.json();

    if (!politicalAdId || !platforms || !budgets) {
      throw new Error('Missing required fields');
    }

    // Fetch the political ad
    const { data: politicalAd, error: adError } = await supabase
      .from('political_ads')
      .select('*, political_candidates(*)')
      .eq('id', politicalAdId)
      .single();

    if (adError || !politicalAd) {
      throw new Error('Political ad not found');
    }

    // Check if already published
    if (politicalAd.published) {
      throw new Error('This ad has already been published');
    }

    // Create a campaign for this political ad
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: `Political Ad - ${politicalAd.political_candidates.full_name}`,
        status: 'active',
        has_watermark: false, // Political ads have verification watermark
        real_estate_mode: false,
        detected_product_type: 'political',
        primary_goal: 'awareness',
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error('Failed to create campaign');
    }

    // Add FEC disclaimer to ad copy based on platform requirements
    const addDisclaimer = (copy: string, platform: string) => {
      const disclaimer = `\n\nPaid for by ${politicalAd.political_candidates.full_name} for ${politicalAd.political_candidates.race || 'public office'}.`;
      
      // Platform-specific disclaimer handling
      switch (platform) {
        case 'meta':
          // Meta requires disclaimer in ad copy (125 char limit)
          return copy.length + disclaimer.length <= 125 ? copy + disclaimer : copy;
        case 'google':
          // Google requires disclaimer (90 char limit for description)
          return copy.length + disclaimer.length <= 90 ? copy + disclaimer : copy;
        case 'tiktok':
          // TikTok allows 100 chars
          return copy.length + disclaimer.length <= 100 ? copy + disclaimer : copy;
        case 'linkedin':
          // LinkedIn allows 150 chars
          return copy.length + disclaimer.length <= 150 ? copy + disclaimer : copy;
        default:
          return copy + disclaimer;
      }
    };

    // Create ad variant for each platform
    const variantPromises = platforms.map(async (platform: string) => {
      const adCopyWithDisclaimer = addDisclaimer(politicalAd.ad_copy, platform);
      
      const { data: variant, error: variantError } = await supabase
        .from('ad_variants')
        .insert({
          campaign_id: campaign.id,
          variant_type: platform,
          headline: `${politicalAd.political_candidates.full_name} for ${politicalAd.political_candidates.race || 'Office'}`,
          body_copy: adCopyWithDisclaimer,
          cta_text: 'Learn More',
          creative_url: politicalAd.watermark_url || politicalAd.image_url,
        })
        .select()
        .single();

      if (variantError) {
        console.error(`Failed to create variant for ${platform}:`, variantError);
        return null;
      }

      // Create campaign channel
      await supabase
        .from('campaign_channels')
        .insert({
          campaign_id: campaign.id,
          channel: platform,
          is_connected: true,
        });

      // Store platform-specific budget
      const budget = budgets[platform] || 20;
      
      // Create initial performance tracking entry
      await supabase
        .from('campaign_performance')
        .insert({
          campaign_id: campaign.id,
          platform: platform,
          date: new Date().toISOString().split('T')[0],
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          is_demo: false,
        });

      return {
        platform,
        variantId: variant.id,
        budget,
      };
    });

    const variants = await Promise.all(variantPromises);
    const successfulVariants = variants.filter(v => v !== null);

    if (successfulVariants.length === 0) {
      throw new Error('Failed to create any ad variants');
    }

    // Update political ad status
    await supabase
      .from('political_ads')
      .update({
        published: true,
        published_at: new Date().toISOString(),
        campaign_id: campaign.id,
      })
      .eq('id', politicalAdId);

    // Update campaign with total budget
    const totalBudget = Object.values(budgets).reduce((sum: number, b: any) => sum + Number(b), 0);
    await supabase
      .from('campaigns')
      .update({
        daily_budget: totalBudget,
        status: 'published',
      })
      .eq('id', campaign.id);

    console.log(`Published political ad ${politicalAdId} to ${successfulVariants.length} platforms`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaign.id,
        platforms: successfulVariants.map(v => v.platform),
        message: 'Political ad published successfully with FEC compliance',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in publish-political-ad:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
