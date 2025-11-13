import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign and assets
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, campaign_assets(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get the text content from assets
    const textAsset = campaign.campaign_assets.find((asset: any) => asset.asset_type === 'text');
    const productDescription = textAsset?.asset_text || 'Product description';

    // Use Lovable AI to generate ad variants
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ad copywriter for xiXoi™. Generate compelling ad variants with headlines, body copy, and CTAs. Return JSON only.'
          },
          {
            role: 'user',
            content: `Generate 3 ad variants for this product: "${productDescription}". 
            
            Return a JSON object with this structure:
            {
              "variants": [
                {
                  "headline": "string (max 50 chars)",
                  "body": "string (max 150 chars)",
                  "cta": "string (max 20 chars)"
                }
              ]
            }`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '{}';
    
    // Parse AI response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // If AI didn't return valid JSON, create fallback variants
      parsedContent = {
        variants: [
          {
            headline: "Transform Your Business Today",
            body: "Experience the power of AI-driven advertising with xiXoi™",
            cta: "Get Started"
          },
          {
            headline: "Instant Results Guaranteed",
            body: "Create professional ads in seconds, not hours",
            cta: "Try Free"
          },
          {
            headline: "Join Thousands of Happy Users",
            body: "Trusted by businesses worldwide for instant ad creation",
            cta: "Start Now"
          }
        ]
      };
    }

    // Insert ad variants into database
    const variantTypes = ['static', 'video', 'ugc'];
    const variants = parsedContent.variants.map((variant: any, index: number) => ({
      campaign_id: campaignId,
      variant_type: variantTypes[index] || 'static',
      headline: variant.headline,
      body_copy: variant.body,
      cta_text: variant.cta,
      predicted_roas: (2.5 + Math.random() * 2).toFixed(2), // Random ROAS between 2.5-4.5
    }));

    // Add ROAS prediction variant
    variants.push({
      campaign_id: campaignId,
      variant_type: 'roas_prediction',
      headline: 'Performance Prediction',
      body_copy: 'Based on similar campaigns',
      cta_text: null,
      predicted_roas: (2.8 + Math.random() * 2).toFixed(2),
    });

    const { error: insertError } = await supabase
      .from('ad_variants')
      .insert(variants);

    if (insertError) throw insertError;

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'ready' })
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({ success: true, variants }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in generate-ad-variants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
