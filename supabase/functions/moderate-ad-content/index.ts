import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, platforms } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, campaign_assets(*), ad_variants(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    const productDescription = campaign.campaign_assets[0]?.asset_text || '';
    const adVariants = campaign.ad_variants || [];

    // Use Lovable AI to moderate content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const platformGuidelines = {
      meta: `Meta (Facebook/Instagram) Policies:
- No discriminatory content (race, ethnicity, religion, gender, age, sexual orientation, disability)
- No misleading claims or unrealistic promises
- No before/after images for health/weight loss without disclaimer
- No unsafe supplements or weapons
- No tobacco, drugs, or adult content
- Accurate representation of product/service
- Clear pricing without hidden fees
- No sensational language or clickbait`,
      
      tiktok: `TikTok Advertising Policies:
- No discriminatory targeting or content
- No misleading information or exaggerated claims
- No dangerous products or illegal activities
- No tobacco, alcohol (restrictions apply), or adult content
- No promotion of eating disorders or unhealthy body image
- Authentic product representation
- Age-appropriate content
- No shocking or sensational content`,
      
      google: `Google Ads Policies:
- No discriminatory practices
- No misleading claims or deceptive content
- No dangerous products or services
- No inappropriate content (adult, violence, etc.)
- Accurate business information
- Clear pricing and billing
- No prohibited pharmaceuticals or supplements
- Comply with local laws and regulations`,
      
      linkedin: `LinkedIn Advertising Policies:
- Professional, business-appropriate content
- No discriminatory targeting
- Accurate company/product information
- No misleading claims about employment
- No inappropriate or offensive content
- Comply with professional standards
- Clear, honest messaging
- No spam or low-quality content`,
      
      x: `X (Twitter) Advertising Policies:
- No discriminatory content or targeting
- No misleading or deceptive claims
- No inappropriate content (violence, adult content, hate speech)
- No illegal products or services
- Authentic representation of products/services
- No manipulation or spam
- Comply with local regulations
- Age-appropriate content
- No promotion of dangerous organizations or individuals
- Clear disclosure of sponsored content`
    };

    const selectedGuidelines = platforms
      .map((p: string) => platformGuidelines[p as keyof typeof platformGuidelines])
      .filter(Boolean)
      .join('\n\n');

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
            content: `You are a social media advertising compliance expert. Your job is to review ad content and determine if it violates any platform policies.

Analyze the content against these platform guidelines:

${selectedGuidelines}

Return a JSON object with:
{
  "approved": boolean (true if compliant with ALL selected platforms),
  "violations": [
    {
      "platform": "platform name",
      "issue": "specific policy violated",
      "severity": "high" | "medium" | "low",
      "recommendation": "how to fix"
    }
  ],
  "overallRisk": "high" | "medium" | "low" | "none",
  "summary": "brief explanation of approval/rejection"
}

Be strict - err on the side of rejection to prevent platform rejections.`
          },
          {
            role: 'user',
            content: `Review this ad campaign for the following platforms: ${platforms.join(', ')}

Product/Service Description:
${productDescription}

Ad Copy Variants:
${adVariants.map((v: any, i: number) => `
Variant ${i + 1}:
- Platform: ${v.variant_type}
- Headline: ${v.headline}
- Body: ${v.body_copy}
- CTA: ${v.cta_text}
`).join('\n')}

Check for ALL policy violations including discriminatory language, misleading claims, prohibited products, inappropriate content, etc.`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status);
      throw new Error('Failed to moderate content');
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content || '{}';
    
    console.log('AI Moderation Response:', content);

    // Strip markdown if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let moderationResult;
    try {
      moderationResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse moderation response:', parseError);
      console.error('Content:', content);
      // Default to rejection on parse error for safety
      moderationResult = {
        approved: false,
        violations: [{
          platform: 'all',
          issue: 'Content moderation error',
          severity: 'high',
          recommendation: 'Review content and try again'
        }],
        overallRisk: 'high',
        summary: 'Unable to complete moderation check. Please review your content.'
      };
    }

    console.log('Moderation result:', JSON.stringify(moderationResult, null, 2));

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        approved: false,
        violations: [{
          platform: 'all',
          issue: 'Moderation system error',
          severity: 'high',
          recommendation: 'Please try again or contact support'
        }],
        overallRisk: 'high',
        summary: 'Unable to complete content moderation'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
