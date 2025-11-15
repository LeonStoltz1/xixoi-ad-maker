import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign and user profile to check plan
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, campaign_assets(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get user's plan from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', campaign.user_id)
      .single();

    const userPlan = profile?.plan || 'free';
    const isFreeUser = userPlan === 'free';
    
    // Variant limits by tier
    const variantCount: Record<string, number> = {
      free: 1,
      pro: 4,
      elite: 8,
      agency: 16
    };
    const maxVariants = variantCount[userPlan] || 1;
    
    console.log('User plan:', userPlan, 'Is free user:', isFreeUser, 'Max variants:', maxVariants);

    // Get the text content from assets (all asset types now have description)
    const asset = campaign.campaign_assets[0];
    const productDescription = asset?.asset_text || 'Product description';
    
    console.log('Campaign data:', JSON.stringify(campaign, null, 2));
    console.log('Asset found:', asset);
    console.log('Product description to use:', productDescription);

    // Use Lovable AI to generate ad variants
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
          {
            role: 'system',
            content: `You are a professional advertising copywriter with STRICT compliance training. Your job is to rewrite user-provided product/service descriptions into high-converting, COMPLIANT, platform-optimized ad copy.

CRITICAL COMPLIANCE RULES (NEVER VIOLATE):
1. HOUSING/REAL ESTATE: NEVER mention or imply race, color, religion, national origin, sex, familial status, disability - Fair Housing Act
2. EMPLOYMENT: NEVER target based on protected characteristics - EEOC regulations  
3. CREDIT/FINANCIAL: NEVER discriminate - Equal Credit Opportunity Act
4. NO unrealistic promises ("guaranteed", "instant miracle", "get rich quick")
5. NO before/after claims without disclaimers
6. NO misleading claims or false information
7. NO sensational/clickbait language
8. NO targeting language that excludes protected groups
9. If unsure whether something violates policy = DON'T USE IT

DO NOT write about "xiXoi" or "AI-powered ads" — you are writing ads FOR THE USER'S PRODUCT.

Platform specifications:
- Meta: Primary text 125 chars max, Headline 40 chars max
- TikTok: Text 100 chars max  
- Google Ads: Description 90 chars max, Headline 30 chars max
- LinkedIn: Primary text 150 chars max

Your task:
1. Read the user's description
2. Extract: product name, key features, price, location, contact info
3. Rewrite into compelling BUT COMPLIANT ad copy for each platform
4. Preserve critical details (prices, phone numbers, locations)
5. Add persuasive language and urgency WITHOUT violating policies
6. Include platform-appropriate CTAs
7. Ensure ZERO discriminatory language
8. Use inclusive, non-exclusionary language
9. Return valid JSON only`
          },
          {
            role: 'user',
            content: `Rewrite this product/service description into high-converting ad copy for 4 platforms:

"${productDescription}"

Extract the key details and create platform-optimized variants. Use the ACTUAL product details from above.
            
Return JSON:
{
  "variants": [
    {
      "platform": "meta",
      "headline": "max 40 chars - compelling headline about their product",
      "body": "max 125 chars - persuasive copy using their details",
      "cta": "max 20 chars"
    },
    {
      "platform": "tiktok",
      "headline": "max 30 chars",
      "body": "max 100 chars",
      "cta": "max 20 chars"
    },
    {
      "platform": "google",
      "headline": "max 30 chars",
      "body": "max 90 chars",
      "cta": "max 20 chars"
    },
    {
      "platform": "linkedin",
      "headline": "max 40 chars",
      "body": "max 150 chars",
      "cta": "max 20 chars"
    }
  ]
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content || '{}';
    
    console.log('AI Response status:', aiResponse.status);
    console.log('AI Response content:', content);
    
    // Check if AI refused the request (common with discriminatory or illegal content)
    // Must check BEFORE attempting to parse JSON
    if (content.toLowerCase().includes('cannot fulfill') || 
        content.toLowerCase().includes('cannot create') ||
        content.toLowerCase().includes('i cannot') ||
        content.toLowerCase().includes('violates') ||
        content.toLowerCase().includes('discriminatory') ||
        content.toLowerCase().includes('illegal') ||
        content.toLowerCase().includes('ethical guidelines')) {
      console.error('AI refused to generate content:', content);
      throw new Error('This campaign contains content that violates advertising policies. Please review your campaign description and remove any discriminatory or illegal content.');
    }
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse AI response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log('Successfully parsed AI response:', JSON.stringify(parsedContent, null, 2));
    } catch (parseError) {
      console.error('Failed to parse AI response. Parse error:', parseError);
      console.error('Content that failed to parse:', content);
      throw new Error('AI failed to generate valid ad variants. This may be due to content policy violations or technical issues.');
    }

    // Get campaign asset URL
    const assetUrl = campaign.campaign_assets[0]?.asset_url || null;
    console.log('Asset URL:', assetUrl);

    // Limit variants based on tier
    const variantsToCreate = isFreeUser 
      ? parsedContent.variants.filter((v: any) => v.platform === 'meta').slice(0, 1)
      : parsedContent.variants.slice(0, maxVariants);

    console.log(`Creating ${variantsToCreate.length} variant(s) for ${userPlan} user (max: ${maxVariants})`);

    // Insert ad variants into database with asset URL
    const variants = variantsToCreate.map((variant: any) => ({
      campaign_id: campaignId,
      variant_type: variant.platform,
      headline: variant.headline,
      body_copy: variant.body,
      cta_text: variant.cta,
      creative_url: assetUrl,
      predicted_roas: (2.5 + Math.random() * 2).toFixed(2),
    }));

    const { data: insertedVariants, error: insertError } = await supabase
      .from('ad_variants')
      .insert(variants)
      .select();

    if (insertError) throw insertError;

    // For free users, create fingerprint records
    if (isFreeUser && insertedVariants && insertedVariants.length > 0) {
      const fingerprint = `${campaign.user_id}_${campaignId}_${Date.now()}`;
      
      const fingerprintRecords = insertedVariants.map((variant: any) => ({
        user_id: campaign.user_id,
        ad_variant_id: variant.id,
        fingerprint: fingerprint,
        image_url: assetUrl
      }));

      const { error: fingerprintError } = await supabase
        .from('free_ads')
        .insert(fingerprintRecords);

      if (fingerprintError) {
        console.error('Failed to create fingerprint records:', fingerprintError);
      } else {
        console.log('Fingerprint records created for free user');
      }
    }

    // Generate AI audience targeting suggestions
    const audiencePrompt = `Analyze this product/service and suggest advertising targeting:

Product Description: "${productDescription}"
${assetUrl ? `Image URL: ${assetUrl}` : ''}

CRITICAL COMPLIANCE REQUIREMENTS:
- For housing/real estate: NEVER target or exclude based on race, color, religion, national origin, sex, familial status, disability, or any protected class
- For employment: NEVER target based on protected characteristics
- For credit/financial services: Follow Equal Credit Opportunity Act guidelines
- Focus on legitimate interest-based and behavioral targeting only

Return ONLY valid JSON with this exact structure:
{
  "product_type": "descriptive product category",
  "audience": {
    "age_range": "25-45",
    "gender": "all",
    "interests": ["behavioral interest 1", "interest-based 2", "contextual interest 3"]
  },
  "locations": ["US", "UK", "CA"],
  "daily_budget": 35,
  "platforms": ["meta", "tiktok"],
  "reasoning": "brief explanation of targeting strategy focused on interests and behaviors, not demographics"
}

Interests must be:
- Behavioral (e.g., "apartment hunters", "first-time renters")
- Contextual (e.g., "urban living", "NYC real estate")
- Interest-based (e.g., "home decor", "city guides")
NEVER include race, ethnicity, religion, or other protected class identifiers.`;

    let audienceSuggestion = null;
    try {
      const audienceResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `You are an expert digital advertising strategist with STRICT compliance training in advertising laws across ALL platforms.

ABSOLUTE COMPLIANCE REQUIREMENTS - ZERO TOLERANCE:
- Fair Housing Act: NO targeting/exclusion based on race, color, religion, national origin, sex, familial status, disability
- EEOC Employment: NO targeting based on age, gender, race, disability, religion, national origin
- Equal Credit Opportunity Act: NO discrimination in financial advertising
- Meta Policies: NO personal attributes targeting, NO discriminatory practices
- Google Ads: NO protected class targeting, NO misleading claims
- TikTok: NO discriminatory content, NO sensational claims
- LinkedIn: NO discriminatory employment targeting
- X/Twitter: NO protected class discrimination

STRICT TARGETING RULES:
1. Use ONLY these targeting types:
   - Behavioral (what people DO: "apartment searching", "job hunting", "shopping for cars")
   - Interest-based (what people LIKE: "home improvement", "professional development", "fitness")
   - Contextual (where/what they READ: "real estate websites", "career sites", "tech blogs")
   - Geographic (location only, never combined with demographics)

2. NEVER suggest:
   - Race, ethnicity, national origin
   - Religion or beliefs
   - Gender, sex, sexual orientation
   - Age or age ranges (except for legal restrictions like alcohol)
   - Familial status, marital status
   - Disability or health conditions
   - Financial status or credit history
   - Any protected class characteristics

3. For HOUSING/REAL ESTATE: 
   - Use ONLY interest-based: "home decor enthusiasts", "urban living", "real estate investors"
   - NEVER mention demographics or family status

4. For EMPLOYMENT:
   - Use ONLY: "career advancement", "professional skills", "job market"
   - NEVER target by age, gender, or any protected class

5. For FINANCIAL/CREDIT:
   - Use ONLY: "financial planning", "investment interested", "business owners"
   - NEVER target by credit history or financial status

Return ONLY valid JSON, no markdown formatting. When in doubt, use broader, more inclusive targeting.`
            },
            {
              role: 'user',
              content: audiencePrompt
            }
          ],
        }),
      });

      if (audienceResponse.ok) {
        const audienceData = await audienceResponse.json();
        let audienceContent = audienceData.choices[0]?.message?.content || '{}';
        audienceContent = audienceContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        audienceSuggestion = JSON.parse(audienceContent);
        console.log('AI Audience Suggestion:', JSON.stringify(audienceSuggestion, null, 2));
      }
    } catch (error) {
      console.error('Failed to generate audience suggestions:', error);
      // Continue without audience suggestions if AI fails
    }

    // Update campaign with audience suggestions and status
    const campaignUpdate: any = { status: 'ready' };
    if (audienceSuggestion) {
      campaignUpdate.audience_suggestion = audienceSuggestion;
      campaignUpdate.auto_targeted = true;
      campaignUpdate.detected_product_type = audienceSuggestion.product_type;
      campaignUpdate.suggested_daily_budget = audienceSuggestion.daily_budget;
    }

    await supabase
      .from('campaigns')
      .update(campaignUpdate)
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({ success: true, variants, audienceSuggestion }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in generate-ad-variants:', error);
    
    // Provide more specific error messages
    let userMessage = error.message;
    if (error.message.includes('content that violates')) {
      userMessage = error.message; // Already user-friendly
    } else if (error.message.includes('AI failed to generate')) {
      userMessage = 'Unable to generate ad variants. Please review your campaign description for any policy violations or try again.';
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
