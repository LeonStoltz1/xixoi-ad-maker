import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { variantId } = await req.json();
    console.log('Publishing ad variant:', variantId);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get variant, campaign, and user plan
    const { data: variant, error: variantError } = await supabase
      .from('ad_variants')
      .select('*, campaigns(user_id, has_watermark, name)')
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      throw new Error('Variant not found');
    }

    if (variant.campaigns.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const hasWatermark = variant.campaigns.has_watermark;

    // IMPORTANT: For production, watermark should be server-side embedded in image
    // Current implementation: Watermark displayed on frontend only
    // TODO: Add server-side image processing to embed "Powered by xiXoi™" watermark
    // into the actual creative_url image file before publishing to ad platforms
    
    // For free users with watermark, create/update free_ads record
    if (userPlan === 'free' && hasWatermark) {
      const fingerprint = `${user.id}_${variantId}_${Date.now()}`;
      
      // Check if free_ad record already exists
      const { data: existingFreeAd } = await supabase
        .from('free_ads')
        .select('*')
        .eq('ad_variant_id', variantId)
        .eq('user_id', user.id)
        .single();

      if (existingFreeAd) {
        // Update existing record
        await supabase
          .from('free_ads')
          .update({ 
            published_at: new Date().toISOString(),
            image_url: variant.creative_url 
          })
          .eq('id', existingFreeAd.id);
      } else {
        // Create new record
        await supabase
          .from('free_ads')
          .insert({
            user_id: user.id,
            ad_variant_id: variantId,
            fingerprint: fingerprint,
            image_url: variant.creative_url,
            published_at: new Date().toISOString()
          });
      }

      console.log('Free ad with watermark tracked:', variantId);
    }

    // Update campaign status to published if not already
    await supabase
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', variant.campaigns.id);

    console.log('Ad published successfully with watermark tracking');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: hasWatermark 
          ? 'Ad published with xiXoi™ watermark (free version)'
          : 'Ad published successfully!',
        hasWatermark: hasWatermark,
        campaignName: variant.campaigns.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in publish-ad:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
