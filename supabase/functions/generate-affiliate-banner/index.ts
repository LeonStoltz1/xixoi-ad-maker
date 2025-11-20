import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { size } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    let dimensions = { width: 1200, height: 628 };

    // Set prompt and dimensions based on size
    if (size === '1200x628') {
      dimensions = { width: 1200, height: 628 };
      prompt = `Create a professional social media banner (1200x628) for xiXoi™ Affiliate Program. 
      Design should be modern, clean, and bold with black/white color scheme and purple accent (#9b87f5).
      Include: "xiXoi™ Affiliate Program" as headline, "Earn 20% Lifetime Commission" as subheading.
      Add visual elements: dollar signs, growth charts, or abstract patterns.
      Style: minimalist, high-contrast, tech-forward, suitable for Facebook/LinkedIn/Twitter.`;
    } else if (size === '1080x1080') {
      dimensions = { width: 1080, height: 1080 };
      prompt = `Create a professional square Instagram post (1080x1080) for xiXoi™ Affiliate Program.
      Design should be modern, clean, and bold with black/white color scheme and purple accent (#9b87f5).
      Include: "xiXoi™" logo-style text at top, "Affiliate Program" below, "20% Commission" prominently displayed.
      Add visual elements: upward trending arrows, percentage symbols, or geometric patterns.
      Style: minimalist, high-contrast, Instagram-optimized, eye-catching.`;
    } else if (size === '1080x1920') {
      dimensions = { width: 1080, height: 1920 };
      prompt = `Create a professional vertical story format (1080x1920) for xiXoi™ Affiliate Program.
      Design should be modern, clean, and bold with black/white color scheme and purple accent (#9b87f5).
      Include: "Join xiXoi™" at top, "Affiliate Program" in middle, "Earn 20% Forever" at bottom.
      Add visual elements: vertical growth bars, currency symbols, or flowing abstract lines.
      Style: minimalist, high-contrast, story-optimized for Instagram/TikTok/Facebook.`;
    }

    console.log(`Generating ${size} banner with prompt:`, prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received:', data);

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated in response');
    }

    return new Response(
      JSON.stringify({ imageUrl, size }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-affiliate-banner:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
