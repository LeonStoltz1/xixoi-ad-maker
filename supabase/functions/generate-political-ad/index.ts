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
    const { candidateName, race, electionYear, policyFocus, tone, platform, customMessage, characterLimit } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt
    const systemPrompt = `You are a political advertising copywriter that creates compliant, ethical political ads.

CRITICAL COMPLIANCE RULES:
1. NO misinformation or unverified claims
2. NO demographic targeting (age, race, gender, religion)
3. NO inflammatory or hateful language
4. NO absolute promises without qualifiers
5. MUST focus on policy and vision
6. MUST be factual and verifiable
7. MUST comply with FEC regulations
8. MUST include clear call-to-action (Vote, Donate, Volunteer, Learn More)
9. NO attacks without attribution
10. NO fear-mongering or divisive language

RESTRICTED WORDS/PHRASES TO AVOID:
- "proven fact", "definitely will", "guaranteed"
- "rigged", "stolen election", "fake votes"
- "illegals", "invasion", "radical", "extremist"
- Age/demographic targeting language
- Unsubstantiated statistics or claims

Platform: ${platform}
Character Limit: ${characterLimit} characters (body only, excluding disclaimer)`;

    const userPrompt = `Create 3 compelling political ad variations for:

Candidate: ${candidateName}
Race: ${race}
Election Year: ${electionYear}
Policy Focus: ${policyFocus}
Tone: ${tone}
${customMessage ? `Additional Context: ${customMessage}` : ''}

Generate 3 variations:
1. SHORT (60-80 characters) - Headline style
2. MEDIUM (120-180 characters) - Tweet length
3. LONG (${characterLimit - 100} characters) - Full persuasive ad

Each variation must:
- Focus on ${policyFocus} policy
- Use ${tone} tone
- Be inspiring but factual
- Include clear call-to-action
- Avoid ALL restricted language
- Be platform-appropriate for ${platform}
- Stay under character limit

Format as JSON:
{
  "short": "ad copy here",
  "medium": "ad copy here",
  "long": "ad copy here"
}

Return ONLY valid JSON, no explanations.`;

    console.log('Calling Lovable AI for political ad generation...');

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Parse JSON response
    let variants;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        variants = JSON.parse(jsonMatch[0]);
      } else {
        variants = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Generate disclaimer
    const disclaimer = `Paid for by ${candidateName} for ${race} | Verified by xiXoi`;

    console.log('Successfully generated political ad variants');

    return new Response(
      JSON.stringify({
        variants: {
          short: variants.short || '',
          medium: variants.medium || '',
          long: variants.long || '',
        },
        disclaimer,
        metadata: {
          candidateName,
          race,
          electionYear,
          policyFocus,
          tone,
          platform,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-political-ad:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
