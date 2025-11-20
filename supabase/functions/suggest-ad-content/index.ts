import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { productDescription, currentCTA, mediaUrl, mediaType, textContent } = await req.json();
    
    if (!productDescription || productDescription.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Product description too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert Meta advertising consultant. Analyze the user's product/service based on:
- Product description text
- Uploaded media (image, video, or text content)

Provide:
1. The BEST call-to-action type for this business (choose ONE: website, calls, email, messages, lead_form)
2. A compelling headline (max 40 characters)
3. Engaging body copy (max 125 characters)
4. A suggested landing URL structure (e.g., "yoursite.com/product-name" or "yoursite.com/contact")
5. Brief reasoning for your CTA recommendation

Consider:
- E-commerce/products → website
- Local services (plumbers, doctors, salons) → calls
- Professional services (lawyers, consultants) → email or lead_form
- Social businesses (influencers, community) → messages
- High-ticket items → lead_form

When analyzing uploaded media:
- For images: describe what you see, identify the product/service, note visual style and brand identity
- For videos: describe the content, identify the product/service being promoted
- For text ads: analyze the text content directly

Return ONLY valid JSON with this structure:
{
  "recommendedCTA": "website",
  "headline": "Your Perfect Headline",
  "bodyCopy": "Engaging description that sells",
  "suggestedURL": "yoursite.com/landing-page",
  "reasoning": "Brief explanation why this CTA works best"
}`;

    // Build user content with media context
    let userContent = `Product/Service Description:\n${productDescription}\n\nCurrent CTA selection: ${currentCTA || 'none'}`;
    
    if (mediaType === 'text' && textContent) {
      userContent += `\n\nText Ad Content:\n${textContent}`;
    } else if (mediaType === 'image' && mediaUrl) {
      userContent += `\n\nUploaded Image URL: ${mediaUrl}\nNote: Analyze the image to understand the product/service being advertised.`;
    } else if (mediaType === 'video' && mediaUrl) {
      userContent += `\n\nUploaded Video URL: ${mediaUrl}\nNote: This is a video ad. Consider video-appropriate messaging.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response
    let suggestions;
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      suggestions = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-ad-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
