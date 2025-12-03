import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { geminiJson } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONBOARDING_SCHEMA = {
  name: 'campaign_blueprint',
  description: 'Generate a complete campaign blueprint from product information',
  parameters: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Name of the product/service' },
      variants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            headline: { type: 'string', maxLength: 60 },
            body: { type: 'string', maxLength: 200 },
            cta: { type: 'string', maxLength: 20 },
            predictedCtr: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['headline', 'body', 'cta']
        },
        minItems: 3,
        maxItems: 3
      },
      audience: {
        type: 'object',
        properties: {
          ageRange: { type: 'string' },
          interests: { type: 'array', items: { type: 'string' }, maxItems: 6 },
          locations: { type: 'array', items: { type: 'string' }, maxItems: 5 }
        },
        required: ['ageRange', 'interests', 'locations']
      },
      budget: {
        type: 'object',
        properties: {
          daily: { type: 'number', minimum: 10 },
          recommended: { type: 'number', minimum: 10 },
          duration: { type: 'number', minimum: 7, maximum: 90 }
        },
        required: ['daily', 'recommended', 'duration']
      },
      platforms: {
        type: 'array',
        items: { type: 'string', enum: ['Facebook', 'Instagram', 'TikTok', 'Google', 'LinkedIn'] },
        minItems: 1
      }
    },
    required: ['productName', 'variants', 'audience', 'budget', 'platforms']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { inputType, inputValue } = await req.json();

    if (!inputValue) {
      return new Response(JSON.stringify({ error: 'Input value required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context prompt
    let productContext = '';
    if (inputType === 'url') {
      productContext = `
        Analyze this product/company URL and create an advertising campaign:
        URL: ${inputValue}
        
        Based on the URL structure and domain, infer:
        - What product/service is being offered
        - The likely target market
        - The brand tone and positioning
      `;
    } else {
      productContext = `
        Create an advertising campaign for this product/service:
        
        Description: ${inputValue}
      `;
    }

    const systemPrompt = `
      You are xiXoi's AI Campaign Strategist. Your job is to create high-converting 
      advertising campaigns optimized for social media platforms.
      
      Guidelines:
      - Headlines should be attention-grabbing and under 60 characters
      - Body copy should be persuasive and under 200 characters
      - CTAs should be action-oriented (e.g., "Shop Now", "Learn More", "Get Started")
      - Target audiences should be specific and actionable
      - Budget recommendations should be realistic for small-to-medium businesses
      - Predicted CTR should be based on industry benchmarks (typically 0.5-3% for social ads)
      
      Create 3 distinct ad variants that test different angles:
      1. Emotional/benefit-focused
      2. Feature/value-focused  
      3. Urgency/scarcity-focused
    `;

    console.log('Generating campaign blueprint for user:', user.id);

    const result = await geminiJson<{
      productName: string;
      variants: Array<{ headline: string; body: string; cta: string; predictedCtr?: number }>;
      audience: { ageRange: string; interests: string[]; locations: string[] };
      budget: { daily: number; recommended: number; duration: number };
      platforms: string[];
    }>(productContext, ONBOARDING_SCHEMA, systemPrompt);

    if (!result.success || !result.data) {
      console.error('Gemini generation failed:', result.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error || 'Failed to generate campaign' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create draft campaign in database
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: result.data.productName,
        status: 'draft',
        daily_budget: result.data.budget.daily,
        target_audience: result.data.audience.interests.join(', '),
        target_location: result.data.audience.locations.join(', '),
        audience_suggestion: result.data.audience,
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Failed to create campaign:', campaignError);
    }

    // Store ad variants
    if (campaign) {
      const variantsToInsert = result.data.variants.map((v) => ({
        campaign_id: campaign.id,
        variant_type: 'ai_generated',
        headline: v.headline,
        body_copy: v.body,
        cta_text: v.cta,
        predicted_roas: v.predictedCtr ? v.predictedCtr * 100 : null,
      }));

      await supabase.from('ad_variants').insert(variantsToInsert);
    }

    return new Response(JSON.stringify({
      success: true,
      blueprint: {
        ...result.data,
        campaignId: campaign?.id,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Onboarding error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
