import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { campaignId, category, count = 50 } = await req.json();

    // Get template
    const { data: template } = await supabaseClient
      .from('campaign_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (!template) throw new Error('Template not found');

    // Call Lovable AI to generate variants
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
          { role: 'system', content: 'You are an expert ad copywriter. Generate unique ad variants in JSON format.' },
          { role: 'user', content: `${template.ai_prompt}\n\nGenerate ${count} unique variants as JSON array with fields: headline, body_copy, cta_text` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_variants',
            description: 'Generate ad variants',
            parameters: {
              type: 'object',
              properties: {
                variants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      headline: { type: 'string' },
                      body_copy: { type: 'string' },
                      cta_text: { type: 'string' }
                    },
                    required: ['headline', 'body_copy', 'cta_text']
                  }
                }
              },
              required: ['variants']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_variants' } }
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls[0];
    const variants = JSON.parse(toolCall.function.arguments).variants;

    // Save variants to database
    const variantRecords = variants.map((v: any) => ({
      campaign_id: campaignId,
      variant_type: category,
      headline: v.headline,
      body_copy: v.body_copy,
      cta_text: v.cta_text
    }));

    await supabaseClient
      .from('ad_variants')
      .insert(variantRecords);

    return new Response(
      JSON.stringify({ success: true, count: variants.length, variants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Generate variants error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});