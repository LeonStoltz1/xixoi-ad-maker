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

    const systemPrompt = `You are an expert digital advertising strategist. Analyze ANY product/service description and generate 3 DIFFERENT targeting strategies.

CRITICAL: You must intelligently analyze and create strategies for ANY legitimate business or offering, not just predefined categories.

PLATFORM RULES:
- xiXoi currently supports ONLY Meta (Facebook & Instagram)
- NEVER recommend platforms not in the available list
- Always recommend Facebook and/or Instagram based on what fits the business best

BUSINESS TYPE EXAMPLES (use as guidance, but adapt to ANY business):
1. Local services (plumber, dentist, salon, gym, restaurant): Google Search, Facebook, Instagram, TikTok
2. Ecommerce/online products: Instagram, Facebook, TikTok, Google Shopping
3. B2B/professional services: LinkedIn, Facebook, Google, X
4. Events/promos/seasonal: Facebook, Instagram, TikTok, YouTube
5. Creative/artistic (musicians, artists, photographers): Instagram, Facebook, TikTok
6. Education/coaching (tutors, consultants, trainers): Facebook, LinkedIn, Instagram
7. Real estate agents: Facebook, Instagram, Google Search
8. Nonprofits/causes: Facebook, Instagram, TikTok
9. Tech/software products: LinkedIn, Facebook, Google
10. ANY OTHER legitimate business: analyze intelligently and recommend Meta platforms

Each strategy should target a distinct audience segment with different demographics, psychographics, or behaviors. For example:
- Strategy 1 might target younger, budget-conscious buyers
- Strategy 2 might target affluent professionals
- Strategy 3 might target a niche enthusiast community

For each strategy, provide:
- audienceSummary: A concise 5-10 word description (e.g., "Women 25-45, Health-Conscious Shoppers")
- reasoning: One sentence explaining why this audience is ideal (max 150 chars)
- recommendedChannels: "Meta (Facebook & Instagram)" - be specific about which platform(s) and why they fit this business
- suggestedLocation: Best geographic targeting
- suggestedBudget: Recommended daily budget in USD (5-100)
- confidence: Your confidence in this strategy's success (0.70-0.95 scale, where 0.95 is highest confidence)

Make each strategy meaningfully different, actionable, and platform-specific.`;

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
              name: 'generate_targeting_options',
              description: 'Generate 3 different targeting strategy options',
              parameters: {
                type: 'object',
                properties: {
                  options: {
                    type: 'array',
                    description: 'Array of 3 targeting strategies',
                    minItems: 3,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      properties: {
                        audienceSummary: { 
                          type: 'string',
                          description: 'Concise audience description (5-10 words)'
                        },
                        reasoning: { 
                          type: 'string',
                          description: 'One sentence explaining strategy (max 150 chars)'
                        },
                        recommendedChannels: { 
                          type: 'string',
                          description: 'Currently only "Meta (Facebook & Instagram)" - recommend specific platform(s) based on business fit'
                        },
                        suggestedLocation: { 
                          type: 'string',
                          description: 'Geographic targeting'
                        },
                        suggestedBudget: { 
                          type: 'number',
                          description: 'Daily budget in USD (5-100)'
                        },
                        confidence: {
                          type: 'number',
                          description: 'Confidence score (0.70-0.95)'
                        }
                      },
                      required: ['audienceSummary', 'reasoning', 'recommendedChannels', 'suggestedLocation', 'suggestedBudget', 'confidence'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['options'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_targeting_options' } }
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
    
    const result = JSON.parse(toolCall.function.arguments);
    const options = result.options || [];

    if (options.length !== 3) {
      throw new Error('Expected 3 targeting options');
    }

    // Validate and constrain each option
    options.forEach((option: any) => {
      if (option.suggestedBudget < 5) option.suggestedBudget = 5;
      if (option.suggestedBudget > 100) option.suggestedBudget = 100;
      if (option.confidence < 0.70) option.confidence = 0.70;
      if (option.confidence > 0.95) option.confidence = 0.95;
    });

    // Sort by confidence (highest first)
    options.sort((a: any, b: any) => b.confidence - a.confidence);

    console.log('Generated targeting options:', options);

    return new Response(
      JSON.stringify({ options }),
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
