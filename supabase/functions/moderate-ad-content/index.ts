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
    const { campaignId, platforms, adContent } = await req.json();

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
    
    // Use provided ad content if available, otherwise use existing variants
    let adVariants = [];
    if (adContent) {
      // Use the edited content for moderation
      adVariants = [{
        headline: adContent.headline,
        body_copy: adContent.body_copy,
        cta_text: adContent.cta_text,
      }];
    } else {
      // Use existing variants from database
      adVariants = campaign.ad_variants || [];
    }

    console.log('Moderating content:', {
      isEditedContent: !!adContent,
      variantsCount: adVariants.length,
      firstVariant: adVariants[0] ? {
        headline: adVariants[0].headline,
        body_copy: adVariants[0].body_copy?.substring(0, 50) + '...',
        cta_text: adVariants[0].cta_text
      } : null
    });

    // Use Lovable AI to moderate content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const platformGuidelines = {
      meta: `Meta (Facebook/Instagram) Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: ANY targeting/exclusion based on race, ethnicity, national origin, religion, age, sex, sexual orientation, gender identity, family status, disability, medical condition, genetic information
- Housing/Employment/Credit: MUST NOT use discriminatory language, preferences, or coded terms that exclude protected groups. Standard factual information (address, price, property features, open house times, agent contact) is ALLOWED and EXPECTED in real estate ads.
- Health: No before/after images, no weight loss claims without disclaimers, no unsafe supplements, no misleading medical claims
- Substances: No tobacco, vaping, drugs, unsafe supplements, recreational drugs
- Adult Content: No nudity, sexual services, dating with sexual intent
- Weapons: No firearms, ammunition, explosives
- Misleading: No false claims, no clickbait, no sensational language, no unrealistic promises
- Shocking: No violence, gore, disturbing content
- Personal Attributes: Cannot assert or imply personal characteristics (race, religion, health, financial status, sexual orientation)

REAL ESTATE ADS - WHAT IS ALLOWED:
- Property address, neighborhood, city, state
- Listing price and property features
- Open house dates and times
- Agent/broker name and contact information
- Factual property descriptions (bedrooms, bathrooms, square footage, amenities)
- Fair housing disclaimer is recommended but not required for approval

REAL ESTATE ADS - WHAT IS PROHIBITED:
- Language indicating preference for/against protected groups ("perfect for young professionals", "ideal for families without children")
- Coded terms suggesting racial/ethnic preferences ("urban", "exclusive", "traditional")
- Targeting settings that exclude protected characteristics
- Suggesting neighborhood demographics in discriminatory ways

REQUIRED ELEMENTS:
- Clear, honest product representation
- Transparent pricing (no hidden fees)
- Accurate business information
- Professional imagery and text
- Realistic expectations
- Proper disclosures for regulated industries
- Working landing pages that match ad content`,
      
      tiktok: `TikTok Advertising Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No discriminatory language or preferences targeting protected characteristics. Standard factual information in real estate ads (address, price, features) is ALLOWED.
- Misleading: No exaggerated claims, false information, or deceptive practices
- Dangerous: No illegal activities, weapons, explosives, dangerous organizations
- Substances: No tobacco, drugs, alcohol to minors, unsafe supplements
- Adult: No sexual content, nudity, dating services focused on sexual encounters
- Body Image: No promotion of eating disorders, unrealistic body standards, dangerous weight loss
- Minors: No targeting minors for inappropriate products, no exploitative content
- Shocking: No violence, gore, frightening content, sensationalism
- Spam: No misleading CTAs, no low-quality content, no manipulative tactics

REQUIRED ELEMENTS:
- Authentic, accurate product representation
- Age-appropriate content and targeting
- Clear, honest messaging
- High-quality creative assets
- Proper disclosures for regulated products
- Realistic claims and expectations
- Professional presentation`,
      
      google: `Google Ads Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No discriminatory language or targeting excluding protected classes. Standard factual real estate information (address, price, property details) is ALLOWED and EXPECTED.
- Counterfeit: No fake goods, replica products, unauthorized replicas
- Dangerous: No explosives, weapons, tobacco, recreational drugs, unsafe supplements
- Dishonest: No phishing, malware, deceptive behavior, misleading claims, get-rich-quick schemes
- Adult: No sexual content, mail-order brides, international marriage brokers
- Healthcare: No unapproved pharmaceuticals, unapproved supplements, misleading health claims
- Gambling: Strict restrictions - must be licensed and follow local laws
- Political: Proper disclosures required, must follow local election laws
- Financial: No high-risk financial products without proper licenses

REQUIRED ELEMENTS:
- Accurate business representation
- Clear, transparent pricing
- Working, relevant landing pages
- Professional content and grammar
- Proper licensing for regulated industries
- Realistic, verifiable claims
- Clear value proposition`,
      
      linkedin: `LinkedIn Advertising Policies - PROFESSIONAL STANDARDS:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No discriminatory language or preferences. Factual job requirements and property details are ALLOWED.
- Misleading Employment: No false job opportunities, no misleading salary claims, no fake company profiles
- Professional Standards: No offensive language, no inappropriate content, no spam
- Adult Content: No sexual services, no dating focused on physical encounters
- Substances: No tobacco, drugs, unsafe supplements
- Scams: No get-rich-quick schemes, no pyramid schemes, no misleading business opportunities
- Low Quality: No clickbait, no sensational content, no irrelevant targeting

REQUIRED ELEMENTS:
- Professional, business-appropriate tone and imagery
- Accurate company information and credentials
- Clear, honest value proposition
- Relevant to professional audience
- High-quality, professional creative
- Proper grammar and spelling
- Legitimate business practices
- Accurate job/salary information if applicable`,
      
      x: `X (Twitter) Advertising Policies - BRAND SAFETY:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No discriminatory language or content targeting/excluding based on protected characteristics. Standard property and job information is ALLOWED.
- Illegal: No illegal products, services, or activities
- Adult: No sexual content, escort services, adult entertainment
- Substances: No illegal drugs, tobacco products (restrictions on alcohol)
- Weapons: No firearms, ammunition, explosives, weapon accessories
- Hate: No hateful content, violent organizations, terrorism
- Misleading: No deceptive claims, false information, manipulative media
- Violence: No violent or gory content, threats, dangerous organizations
- Spam: No low-quality content, manipulative engagement tactics
- Political: Prohibited in many regions, strict disclosure requirements where allowed

REQUIRED ELEMENTS:
- Clear, accurate product representation
- Transparent business practices
- Age-appropriate content
- Professional, respectful tone
- Honest claims and realistic expectations
- Proper disclosures for regulated content
- Brand safety considerations
- Clear sponsorship disclosure`
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
            content: `You are an advertising compliance officer. Your role is to review ad content for ACTUAL policy violations, not to flag standard business practices.

CRITICAL DISTINCTION FOR HOUSING/EMPLOYMENT/CREDIT ADS:
- REJECT: Discriminatory language, preferences for/against protected groups, coded terms suggesting exclusion
- APPROVE: Factual information (address, price, features, requirements, contact info, open house times)

Standard real estate ads MUST include property location, price, and contact information - this is EXPECTED and LEGAL.
Housing discrimination occurs through LANGUAGE and TARGETING, not through listing factual property details.

Examples of ACTUAL violations:
❌ "Perfect for young professionals" (age discrimination)
❌ "Traditional family neighborhood" (family status discrimination)  
❌ "No Section 8" (source of income discrimination)
❌ Targeting that excludes protected groups

Examples of COMPLIANT content:
✅ "3BR home in [neighborhood] for $500K. Open house Saturday."
✅ "Charming property at [address]. Call [agent] at [phone]."
✅ "Beautiful home priced at $2.3M. Contact for details."

Analyze the content against these platform guidelines:

${selectedGuidelines}

Check for these specific red flags:
- Discriminatory language or preferences based on protected characteristics
- "Before/after" health claims without disclaimers
- Unrealistic promises ("guaranteed", "instant", "miracle")
- Clickbait or sensational language
- Misleading pricing or false claims
- Implied personal characteristics about viewers

Return a JSON object with:
{
  "approved": boolean,
  "violations": [
    {
      "platform": "platform name",
      "issue": "specific policy violated with exact quote",
      "severity": "high" | "medium" | "low",
      "recommendation": "specific actionable fix"
    }
  ],
  "overallRisk": "high" | "medium" | "low" | "none",
  "summary": "brief overall assessment"
}

Focus on ACTUAL violations, not standard business information.`
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
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            approved: false,
            error: 'AI moderation service temporarily unavailable. Please try again in a moment.',
            overallRisk: 'unknown'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            approved: false,
            error: 'AI moderation service credits exhausted. Please contact support at support@xixoi.com',
            overallRisk: 'unknown'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to moderate content');
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content || '{}';
    
    console.log('AI Moderation Response:', content);

    // Strip markdown if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON object from response (handle cases where AI adds explanatory text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

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
