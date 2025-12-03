/**
 * Brand Model Builder
 * Analyzes user's past ads and website to build a brand identity model
 */

import { supabase } from '@/integrations/supabase/client';

export interface BrandModel {
  brandVoice: {
    tone: string[];
    formality: 'casual' | 'neutral' | 'formal';
    personality: string[];
  };
  visualStyle: {
    primaryColors: string[];
    preferredImagery: string[];
    layoutPreferences: string[];
  };
  messagingPatterns: {
    hookTypes: string[];
    ctaPatterns: string[];
    valueProps: string[];
  };
  targetAudience: {
    demographics: string[];
    psychographics: string[];
    painPoints: string[];
  };
}

export interface BrandAnalysisInput {
  userId: string;
  websiteUrl?: string;
  existingAds?: Array<{
    headline: string;
    body: string;
    performance: number;
  }>;
  brandDescription?: string;
}

export async function buildBrandModel(input: BrandAnalysisInput): Promise<BrandModel | null> {
  try {
    // Fetch existing creative memory for this user
    const { data: creativeMemory } = await supabase
      .from('creative_memory')
      .select('*')
      .eq('user_id', input.userId)
      .order('performance_score', { ascending: false })
      .limit(20);

    // Fetch user's past campaigns for pattern analysis
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select(`
        *,
        ad_variants (*)
      `)
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Analyze patterns from existing data
    const model = analyzePatterns(creativeMemory || [], campaigns || [], input);

    return model;
  } catch (error) {
    console.error('Error building brand model:', error);
    return null;
  }
}

function analyzePatterns(
  creativeMemory: any[],
  campaigns: any[],
  input: BrandAnalysisInput
): BrandModel {
  // Extract headlines and body copy from campaigns
  const allHeadlines: string[] = [];
  const allBodies: string[] = [];
  const allCtas: string[] = [];

  campaigns.forEach((campaign) => {
    campaign.ad_variants?.forEach((variant: any) => {
      if (variant.headline) allHeadlines.push(variant.headline);
      if (variant.body_copy) allBodies.push(variant.body_copy);
      if (variant.cta_text) allCtas.push(variant.cta_text);
    });
  });

  // Analyze tone from existing content
  const toneAnalysis = analyzeTone(allHeadlines, allBodies);
  
  // Extract CTA patterns
  const ctaPatterns = extractCtaPatterns(allCtas);
  
  // Extract hook types from headlines
  const hookTypes = extractHookTypes(allHeadlines);

  return {
    brandVoice: {
      tone: toneAnalysis.tones,
      formality: toneAnalysis.formality,
      personality: toneAnalysis.personality,
    },
    visualStyle: {
      primaryColors: [], // Would need image analysis
      preferredImagery: ['product-focused', 'lifestyle'],
      layoutPreferences: ['clean', 'minimal'],
    },
    messagingPatterns: {
      hookTypes,
      ctaPatterns,
      valueProps: extractValueProps(allBodies),
    },
    targetAudience: {
      demographics: campaigns[0]?.target_audience?.split(',').map((s: string) => s.trim()) || [],
      psychographics: [],
      painPoints: [],
    },
  };
}

function analyzeTone(headlines: string[], bodies: string[]): {
  tones: string[];
  formality: 'casual' | 'neutral' | 'formal';
  personality: string[];
} {
  const allText = [...headlines, ...bodies].join(' ').toLowerCase();
  
  const tones: string[] = [];
  const personality: string[] = [];
  
  // Simple keyword-based tone detection
  if (allText.includes('!') || allText.includes('amazing') || allText.includes('incredible')) {
    tones.push('enthusiastic');
  }
  if (allText.includes('discover') || allText.includes('learn') || allText.includes('find out')) {
    tones.push('educational');
  }
  if (allText.includes('limited') || allText.includes('hurry') || allText.includes('now')) {
    tones.push('urgent');
  }
  if (allText.includes('trusted') || allText.includes('proven') || allText.includes('expert')) {
    tones.push('authoritative');
    personality.push('trustworthy');
  }
  if (allText.includes('fun') || allText.includes('enjoy') || allText.includes('love')) {
    personality.push('playful');
  }
  
  // Determine formality
  let formality: 'casual' | 'neutral' | 'formal' = 'neutral';
  if (allText.includes("you'll") || allText.includes("we're") || allText.includes('hey')) {
    formality = 'casual';
  } else if (allText.includes('therefore') || allText.includes('consequently')) {
    formality = 'formal';
  }

  return {
    tones: tones.length > 0 ? tones : ['professional'],
    formality,
    personality: personality.length > 0 ? personality : ['reliable'],
  };
}

function extractCtaPatterns(ctas: string[]): string[] {
  const patterns: string[] = [];
  
  ctas.forEach((cta) => {
    const lower = cta.toLowerCase();
    if (lower.includes('shop') || lower.includes('buy')) patterns.push('transactional');
    if (lower.includes('learn') || lower.includes('discover')) patterns.push('educational');
    if (lower.includes('get') || lower.includes('claim')) patterns.push('acquisition');
    if (lower.includes('try') || lower.includes('start')) patterns.push('trial');
  });

  return [...new Set(patterns)];
}

function extractHookTypes(headlines: string[]): string[] {
  const hooks: string[] = [];
  
  headlines.forEach((headline) => {
    const lower = headline.toLowerCase();
    if (lower.includes('how to') || lower.includes('ways to')) hooks.push('how-to');
    if (lower.includes('?')) hooks.push('question');
    if (/\d+/.test(lower)) hooks.push('number-driven');
    if (lower.includes('secret') || lower.includes('revealed')) hooks.push('curiosity');
    if (lower.includes('new') || lower.includes('introducing')) hooks.push('announcement');
  });

  return [...new Set(hooks)];
}

function extractValueProps(bodies: string[]): string[] {
  const props: string[] = [];
  
  bodies.forEach((body) => {
    const lower = body.toLowerCase();
    if (lower.includes('save') || lower.includes('discount') || lower.includes('%')) props.push('cost-savings');
    if (lower.includes('fast') || lower.includes('quick') || lower.includes('instant')) props.push('speed');
    if (lower.includes('quality') || lower.includes('premium') || lower.includes('best')) props.push('quality');
    if (lower.includes('easy') || lower.includes('simple') || lower.includes('effortless')) props.push('convenience');
  });

  return [...new Set(props)];
}
