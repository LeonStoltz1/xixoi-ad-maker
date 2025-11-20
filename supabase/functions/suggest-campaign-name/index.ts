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
    const { description, productType } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a marketing expert who creates clear, searchable campaign names following a standard filing system.

CRITICAL FORMAT REQUIREMENTS:
- Use this exact format: "YYYY-MM-DD | Category | 3-5 Keywords"
- Date format must be YYYY-MM-DD (e.g., 2025-11-20)
- Category must be one word describing the business type (e.g., Restaurant, Realtor, Fitness, Retail, Service, Tech, Healthcare, etc.)
- Keywords must be 3-5 descriptive words that capture the product/service essence
- Total name should be under 60 characters
- Use title case for category and keywords
- Use vertical bar | as separators with spaces

EXAMPLES:
"2025-11-20 | Headphones | Premium Noise-Canceling Audio"
"2025-11-20 | Restaurant | Italian Dinner Special Promo"
"2025-11-20 | Realtor | Luxury Downtown Condo Listing"
"2025-11-20 | Fitness | Summer Bootcamp Early Bird"

Return ONLY the campaign name in this format, nothing else.`;

    const userPrompt = `Today's date: ${new Date().toISOString().split('T')[0]}
Product/Service: ${description}${productType ? `\nType: ${productType}` : ''}

Generate a searchable campaign name following the exact format specified.`;

    console.log('Calling Lovable AI for campaign name suggestion...');

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate campaign name' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const suggestedName = data.choices?.[0]?.message?.content?.trim() || 'New Campaign';

    console.log('Generated campaign name:', suggestedName);

    return new Response(
      JSON.stringify({ suggestedName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-campaign-name:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
