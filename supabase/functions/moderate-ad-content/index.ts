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
      meta: `Meta (Facebook/Instagram) Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: ANY targeting/exclusion based on race, ethnicity, national origin, religion, age, sex, sexual orientation, gender identity, family status, disability, medical condition, genetic information
- Housing/Employment/Credit: MUST NOT target protected characteristics - use only interest/behavioral targeting
- Health: No before/after images, no weight loss claims without disclaimers, no unsafe supplements, no misleading medical claims
- Substances: No tobacco, vaping, drugs, unsafe supplements, recreational drugs
- Adult Content: No nudity, sexual services, dating with sexual intent
- Weapons: No firearms, ammunition, explosives
- Misleading: No false claims, no clickbait, no sensational language, no unrealistic promises
- Shocking: No violence, gore, disturbing content
- Personal Attributes: Cannot assert or imply personal characteristics (race, religion, health, financial status, sexual orientation)

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
- Discrimination: No targeting based on protected characteristics (race, ethnicity, religion, gender, age, disability, sexual orientation)
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
- Discrimination: No content targeting/excluding based on protected classes (race, religion, national origin, disability, age, sex, sexual orientation)
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
      
      linkedin: `LinkedIn Advertising Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No targeting/content based on protected characteristics (race, ethnicity, religion, gender, age, disability, sexual orientation, national origin)
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
      
      x: `X (Twitter) Advertising Policies - STRICT ENFORCEMENT:

PROHIBITED CONTENT (AUTO-REJECT):
- Discrimination: No content targeting/based on protected classes (race, ethnicity, religion, national origin, gender, sexual orientation, disability, age)
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
            content: `You are a STRICT social media advertising compliance expert. Your job is to review ad content with ZERO TOLERANCE for policy violations.

CRITICAL COMPLIANCE RULES:
1. HOUSING/REAL ESTATE: NEVER allow targeting based on race, color, religion, national origin, sex, familial status, or disability - Fair Housing Act violation = INSTANT REJECTION
2. EMPLOYMENT: NEVER allow targeting based on protected characteristics - EEOC violation = INSTANT REJECTION
3. CREDIT/FINANCIAL: NEVER allow discrimination - ECOA violation = INSTANT REJECTION
4. If content mentions ANY protected class in a targeting context = AUTO-REJECT
5. If content makes unrealistic promises or misleading claims = REJECT
6. If content could be seen as discriminatory in ANY way = REJECT
7. Better to reject borderline content than risk platform rejection

Analyze the content against these platform guidelines:

${selectedGuidelines}

Check for these specific red flags:
- ANY mention of race, ethnicity, religion in targeting
- Protected class characteristics (age, gender, disability, etc.) in targeting  
- "Before/after" health claims without disclaimers
- Unrealistic promises ("guaranteed", "instant", "miracle")
- Clickbait or sensational language
- Vague or misleading pricing
- Implied personal characteristics about viewers
- Any language that could be interpreted as discriminatory

Return a JSON object with:
{
  "approved": boolean (false if ANY violation detected),
  "violations": [
    {
      "platform": "platform name",
      "issue": "specific policy violated with exact quote",
      "severity": "high" | "medium" | "low",
      "recommendation": "specific actionable fix"
    }
  ],
  "overallRisk": "high" | "medium" | "low" | "none",
  "summary": "detailed explanation of approval/rejection"
}

BE EXTREMELY STRICT - it's better to reject compliant content than approve violating content. When in doubt, REJECT.`
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
