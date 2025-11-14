import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    // Get variant and check if it belongs to user
    const { data: variant, error: variantError } = await supabase
      .from('ad_variants')
      .select('*, campaigns(user_id, has_watermark)')
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      throw new Error('Variant not found');
    }

    if (variant.campaigns.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Check if ad has watermark (free user)
    const hasWatermark = variant.campaigns.has_watermark;

    // For free users, ensure there's a free_ads record
    if (hasWatermark) {
      const { data: freeAd } = await supabase
        .from('free_ads')
        .select('*')
        .eq('ad_variant_id', variantId)
        .eq('user_id', user.id)
        .single();

      // If no free_ad record exists, create one
      if (!freeAd) {
        const fingerprint = `${user.id}_${variantId}_${Date.now()}`;
        await supabase
          .from('free_ads')
          .insert({
            user_id: user.id,
            ad_variant_id: variantId,
            fingerprint: fingerprint,
            image_url: variant.creative_url
          });
      }
    }

    // Mark as published
    await supabase
      .from('free_ads')
      .update({ published_at: new Date().toISOString() })
      .eq('ad_variant_id', variantId);

    console.log('Ad published successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Ad published successfully!'
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
