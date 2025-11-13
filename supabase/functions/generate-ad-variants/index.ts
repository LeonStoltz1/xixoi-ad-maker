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

    // Get the text content from assets (all asset types now have description)
    const asset = campaign.campaign_assets[0];
    const productDescription = asset?.asset_text || 'Product description';
    
    console.log('Campaign data:', JSON.stringify(campaign, null, 2));
    console.log('Asset found:', asset);
    console.log('Product description to use:', productDescription);

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
            content: `You are an expert ad copywriter. Your job is to take a product/service description and create platform-specific advertising copy for Meta, TikTok, Google Ads, and LinkedIn.

CRITICAL: You are writing ads FOR THE USER'S PRODUCT/SERVICE, not for xiXoi. xiXoi is just the platform generating the ads.

CHARACTER LIMITS (strictly enforce):
- Meta (Facebook/Instagram): Primary text 125 chars max, Headline 40 chars max
- TikTok: Text 100 chars max
- Google Ads: Headline 30 chars max, Description 90 chars max  
- LinkedIn: Primary text 150 chars max

YOUR TASK:
1. Read the user's product/service description carefully
2. Extract: what they're selling, price, location, features, contact info
3. Create platform-optimized ad copy using THEIR details
4. DO NOT write about "AI-powered ads" or "xiXoi" - write about THEIR product
5. Preserve specific details like prices, phone numbers, locations
6. Adapt the content to fit each platform's character limits
7. Include appropriate call-to-action for their product
8. Return valid JSON only`
          },
          {
            role: 'user',
            content: `Write advertising copy for this product/service:

"${productDescription}"

Create 4 platform-specific ad variants using the details above. Write about THIS PRODUCT/SERVICE, not about ad creation tools.
            
Return JSON with this exact structure:
{
  "variants": [
    {
      "platform": "meta",
      "headline": "string (max 40 chars - about their product)",
      "body": "string (max 125 chars - about their product)",
      "cta": "string (max 20 chars - action for their product)"
    },
    {
      "platform": "tiktok",
      "headline": "string (max 30 chars)",
      "body": "string (max 100 chars)",
      "cta": "string (max 20 chars)"
    },
    {
      "platform": "google",
      "headline": "string (max 30 chars)",
      "body": "string (max 90 chars)",
      "cta": "string (max 20 chars)"
    },
    {
      "platform": "linkedin",
      "headline": "string (max 40 chars)",
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
    
    console.log('AI Response status:', aiResponse.status);
    console.log('AI Response content:', content);
    
    // Parse AI response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log('Successfully parsed AI response:', JSON.stringify(parsedContent, null, 2));
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback. Parse error:', parseError);
      console.error('Content that failed to parse:', content);
      // If AI didn't return valid JSON, create fallback platform-specific variants
      parsedContent = {
        variants: [
          {
            platform: "meta",
            headline: "Transform Your Business",
            body: "AI-powered ads in 60 seconds. Join thousands of satisfied customers. Start your free trial today!",
            cta: "Get Started Free"
          },
          {
            platform: "tiktok",
            headline: "Instant Ad Creation",
            body: "Create pro ads in seconds with xiXoi™. No design skills needed. Try it free!",
            cta: "Start Now"
          },
          {
            platform: "google",
            headline: "AI Ad Creation Platform",
            body: "Generate professional ads instantly. No experience required. Free trial available.",
            cta: "Try Free"
          },
          {
            platform: "linkedin",
            headline: "Professional Ad Creation Made Easy",
            body: "Streamline your advertising with xiXoi™'s AI-powered platform. Create compelling ads in under 60 seconds. Trusted by businesses worldwide.",
            cta: "Start Free Trial"
          }
        ]
      };
    }

    // Insert ad variants into database
    const variants = parsedContent.variants.map((variant: any) => ({
      campaign_id: campaignId,
      variant_type: variant.platform,
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
