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
    const { productDescription } = await req.json();
    
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

    const systemPrompt = `You are an expert digital advertising strategist. Analyze the product/service description and generate optimal targeting recommendations for Meta (Facebook/Instagram) ads.

Return structured targeting data including:
- audienceSummary: A concise 5-10 word description of the target audience (e.g., "Women 25-45, Health-Conscious Shoppers")
- reasoning: One sentence explaining why this audience is ideal (max 150 chars)
- recommendedChannels: Always return "Meta (Facebook & Instagram)" since we only support Meta currently
- suggestedLocation: Best geographic targeting (e.g., "United States", "California", "New York City")
- suggestedBudget: Recommended daily budget in USD (5-100, considering product price point and market)

Be specific and actionable. Base recommendations on product category, price point, and market positioning.`;

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
          { role: 'user', content: `Product/Service: ${productDescription}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_targeting',
              description: 'Generate targeting recommendations for the product',
              parameters: {
                type: 'object',
                properties: {
                  audienceSummary: { 
                    type: 'string',
                    description: 'Concise audience description (5-10 words)'
                  },
                  reasoning: { 
                    type: 'string',
                    description: 'One sentence explaining targeting strategy (max 150 chars)'
                  },
                  recommendedChannels: { 
                    type: 'string',
                    description: 'Always "Meta (Facebook & Instagram)"'
                  },
                  suggestedLocation: { 
                    type: 'string',
                    description: 'Geographic targeting recommendation'
                  },
                  suggestedBudget: { 
                    type: 'number',
                    description: 'Daily budget in USD (5-100)'
                  }
                },
                required: ['audienceSummary', 'reasoning', 'recommendedChannels', 'suggestedLocation', 'suggestedBudget'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_targeting' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const targeting = JSON.parse(toolCall.function.arguments);

    // Validate and constrain budget
    if (targeting.suggestedBudget < 5) targeting.suggestedBudget = 5;
    if (targeting.suggestedBudget > 100) targeting.suggestedBudget = 100;

    console.log('Generated targeting:', targeting);

    return new Response(
      JSON.stringify({ targeting }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-targeting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate targeting';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
