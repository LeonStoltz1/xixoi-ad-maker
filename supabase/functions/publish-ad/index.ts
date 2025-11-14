import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { extractWatermark } from "../_shared/steganography.ts";

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

    if (hasWatermark) {
      // This is a free ad - check for watermark tampering
      const { data: freeAd, error: freeAdError } = await supabase
        .from('free_ads')
        .select('*')
        .eq('ad_variant_id', variantId)
        .eq('user_id', user.id)
        .single();

      if (freeAdError || !freeAd) {
        console.log('No free_ads record found, assuming legitimate free publish');
      } else if (freeAd.image_url) {
        // Download image and check watermark
        try {
          const { data: imageData, error: downloadError } = await supabase.storage
            .from('campaign-assets')
            .download(freeAd.image_url);

          if (!downloadError && imageData) {
            const imageBuffer = new Uint8Array(await imageData.arrayBuffer());
            const extractedFingerprint = await extractWatermark(imageBuffer);

            console.log('Original fingerprint:', freeAd.fingerprint);
            console.log('Extracted fingerprint:', extractedFingerprint);

            if (!extractedFingerprint || extractedFingerprint !== freeAd.fingerprint) {
              // WATERMARK TAMPERED - Auto-charge $29
              console.log('Watermark tampered! Auto-charging $29...');

              // Initialize Stripe
              const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
              if (!stripeKey) {
                throw new Error('STRIPE_SECRET_KEY not configured');
              }
              const stripe = new Stripe(stripeKey, {
                apiVersion: '2023-10-16',
              });

              // Get user profile for Stripe customer
              const { data: profile } = await supabase
                .from('profiles')
                .select('stripe_customer_id, email')
                .eq('id', user.id)
                .single();

              // Get or create Stripe customer
              let customerId = profile?.stripe_customer_id;
              if (!customerId) {
                const customer = await stripe.customers.create({
                  email: profile?.email || user.email,
                  metadata: {
                    supabase_user_id: user.id,
                  },
                });
                customerId = customer.id;

                await supabase
                  .from('profiles')
                  .update({ stripe_customer_id: customerId })
                  .eq('id', user.id);
              }

              // Create checkout session for $29 watermark removal
              const origin = req.headers.get('origin') || 'http://localhost:8080';
              const session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'payment',
                line_items: [
                  {
                    price: Deno.env.get('STRIPE_PRICE_BRANDING_REMOVAL')!,
                    quantity: 1,
                  },
                ],
                success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&variant_id=${variantId}`,
                cancel_url: `${origin}/ad-published?campaign_id=${variant.campaign_id}&variant_id=${variantId}`,
                metadata: {
                  user_id: user.id,
                  variant_id: variantId,
                  reason: 'watermark_tampered',
                },
              });

              // Mark as tampered
              await supabase
                .from('free_ads')
                .update({ tampered: true })
                .eq('id', freeAd.id);

              return new Response(
                JSON.stringify({ 
                  requiresPayment: true, 
                  checkoutUrl: session.url,
                  message: 'Watermark removed. Please complete payment to publish.'
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 402, // Payment Required
                }
              );
            }
          }
        } catch (watermarkError) {
          console.error('Error checking watermark:', watermarkError);
          // Continue with publishing if watermark check fails
        }
      }
    }

    // Watermark intact or paid ad - publish it
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
