/**
 * Competitor Insights
 * Analyzes competitor ads and generates actionable insights
 */

import { CompetitorAd, fetchCompetitorAds, getTrendingCompetitors } from './competitor-scraper';
import { extractTone, ToneAnalysisResult } from '../identity/tone-extractor';
import { generateFingerprint, CreativeFingerprint } from '../identity/creative-fingerprint';

export interface CompetitorInsight {
  type: 'trend' | 'opportunity' | 'threat' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: string;
  relatedAds?: string[];
}

export interface CategoryTrends {
  category: string;
  topBrands: string[];
  commonHooks: string[];
  popularCTAs: string[];
  avgAdLength: number;
  toneProfile: {
    dominant: string;
    emerging: string[];
  };
  insights: CompetitorInsight[];
}

export interface CompetitorAnalysis {
  competitor: string;
  adCount: number;
  toneProfile: ToneAnalysisResult | null;
  fingerprints: CreativeFingerprint[];
  strengths: string[];
  weaknesses: string[];
  differentiationOpportunities: string[];
}

/**
 * Analyze category trends from competitor ads
 */
export async function analyzeCategoryTrends(category: string): Promise<CategoryTrends> {
  const ads = await fetchCompetitorAds({ category, limit: 50 });
  const topBrands = await getTrendingCompetitors(category);

  if (ads.length === 0) {
    return {
      category,
      topBrands: [],
      commonHooks: [],
      popularCTAs: [],
      avgAdLength: 0,
      toneProfile: { dominant: 'professional', emerging: [] },
      insights: [{
        type: 'recommendation',
        title: 'Limited Data Available',
        description: 'Not enough competitor data in this category yet.',
        confidence: 50,
        actionable: 'Continue monitoring this category as more ads are collected.',
      }],
    };
  }

  // Analyze all ad texts
  const allText = ads.map((ad) => ad.adText).join(' ');
  const combinedTone = extractTone(allText);

  // Extract common hooks
  const hooks = extractCommonHooks(ads);
  
  // Extract popular CTAs
  const ctas = extractPopularCTAs(ads);

  // Calculate average ad length
  const avgLength = ads.reduce((sum, ad) => sum + ad.adText.length, 0) / ads.length;

  // Generate insights
  const insights = generateCategoryInsights(ads, combinedTone, hooks, ctas);

  return {
    category,
    topBrands,
    commonHooks: hooks,
    popularCTAs: ctas,
    avgAdLength: Math.round(avgLength),
    toneProfile: {
      dominant: combinedTone.tone.primary,
      emerging: combinedTone.tone.secondary,
    },
    insights,
  };
}

/**
 * Analyze a specific competitor
 */
export async function analyzeCompetitor(
  brandName: string,
  category: string
): Promise<CompetitorAnalysis> {
  const ads = await fetchCompetitorAds({ category, limit: 100 });
  const competitorAds = ads.filter(
    (ad) => ad.brandName.toLowerCase() === brandName.toLowerCase()
  );

  if (competitorAds.length === 0) {
    return {
      competitor: brandName,
      adCount: 0,
      toneProfile: null,
      fingerprints: [],
      strengths: [],
      weaknesses: [],
      differentiationOpportunities: ['No competitor data available - great opportunity to be first!'],
    };
  }

  // Analyze tone across all their ads
  const combinedText = competitorAds.map((ad) => ad.adText).join(' ');
  const toneProfile = extractTone(combinedText);

  // Generate fingerprints for each ad
  const fingerprints = competitorAds.map((ad) =>
    generateFingerprint(ad.adText.split('.')[0] || ad.adText, ad.adText)
  );

  // Identify strengths and weaknesses
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(competitorAds, toneProfile);

  // Find differentiation opportunities
  const opportunities = findDifferentiationOpportunities(toneProfile, fingerprints);

  return {
    competitor: brandName,
    adCount: competitorAds.length,
    toneProfile,
    fingerprints,
    strengths,
    weaknesses,
    differentiationOpportunities: opportunities,
  };
}

/**
 * Compare your brand against competitors
 */
export function compareBrandToCompetitors(
  yourTone: ToneAnalysisResult,
  competitorAnalyses: CompetitorAnalysis[]
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  // Find unique tone opportunities
  const competitorTones = new Set(
    competitorAnalyses
      .filter((c) => c.toneProfile)
      .map((c) => c.toneProfile!.tone.primary)
  );

  if (!competitorTones.has(yourTone.tone.primary)) {
    insights.push({
      type: 'opportunity',
      title: 'Unique Voice Advantage',
      description: `Your ${yourTone.tone.primary} tone is not commonly used by competitors.`,
      confidence: 85,
      actionable: 'Double down on your unique voice to stand out.',
    });
  }

  // Find emotional gaps
  const competitorEmotions = new Set(
    competitorAnalyses
      .filter((c) => c.toneProfile)
      .flatMap((c) => c.toneProfile!.tone.emotionalRange)
  );

  const yourUniqueEmotions = yourTone.tone.emotionalRange.filter(
    (e) => !competitorEmotions.has(e)
  );

  if (yourUniqueEmotions.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Emotional Differentiation',
      description: `You evoke ${yourUniqueEmotions.join(', ')} emotions that competitors don't.`,
      confidence: 75,
      actionable: 'Emphasize these emotional triggers in your messaging.',
    });
  }

  // Identify threats
  competitorAnalyses.forEach((competitor) => {
    if (competitor.strengths.length > 3) {
      insights.push({
        type: 'threat',
        title: `Strong Competitor: ${competitor.competitor}`,
        description: `${competitor.competitor} has ${competitor.adCount} active ads with multiple strengths.`,
        confidence: 70,
        actionable: `Analyze ${competitor.competitor}'s approach and find ways to differentiate.`,
      });
    }
  });

  return insights;
}

// Helper functions

function extractCommonHooks(ads: CompetitorAd[]): string[] {
  const hookPatterns: Record<string, number> = {
    'question': 0,
    'how-to': 0,
    'number-driven': 0,
    'curiosity': 0,
    'announcement': 0,
    'problem-solution': 0,
  };

  ads.forEach((ad) => {
    const text = ad.adText.toLowerCase();
    if (text.includes('?')) hookPatterns['question']++;
    if (text.includes('how to')) hookPatterns['how-to']++;
    if (/\d+/.test(text)) hookPatterns['number-driven']++;
    if (text.includes('secret') || text.includes('discover')) hookPatterns['curiosity']++;
    if (text.includes('new') || text.includes('introducing')) hookPatterns['announcement']++;
    if (text.includes('tired') || text.includes('struggling')) hookPatterns['problem-solution']++;
  });

  return Object.entries(hookPatterns)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0)
    .slice(0, 5)
    .map(([hook]) => hook);
}

function extractPopularCTAs(ads: CompetitorAd[]): string[] {
  const ctaPatterns: Record<string, number> = {};
  const ctaRegexes = [
    { pattern: /shop now/i, cta: 'Shop Now' },
    { pattern: /learn more/i, cta: 'Learn More' },
    { pattern: /get started/i, cta: 'Get Started' },
    { pattern: /sign up/i, cta: 'Sign Up' },
    { pattern: /try free/i, cta: 'Try Free' },
    { pattern: /book now/i, cta: 'Book Now' },
    { pattern: /download/i, cta: 'Download' },
    { pattern: /subscribe/i, cta: 'Subscribe' },
  ];

  ads.forEach((ad) => {
    ctaRegexes.forEach(({ pattern, cta }) => {
      if (pattern.test(ad.adText)) {
        ctaPatterns[cta] = (ctaPatterns[cta] || 0) + 1;
      }
    });
  });

  return Object.entries(ctaPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cta]) => cta);
}

function generateCategoryInsights(
  ads: CompetitorAd[],
  tone: ToneAnalysisResult,
  hooks: string[],
  ctas: string[]
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  // Trend insight
  if (hooks[0]) {
    insights.push({
      type: 'trend',
      title: `${hooks[0]} Hooks Dominate`,
      description: `${hooks[0]} style hooks are most common in this category.`,
      confidence: 80,
      actionable: `Consider using ${hooks[0]} hooks or differentiate with ${hooks[hooks.length - 1] || 'alternative'} approaches.`,
    });
  }

  // CTA insight
  if (ctas[0]) {
    insights.push({
      type: 'trend',
      title: `"${ctas[0]}" is the Top CTA`,
      description: `Most competitors use "${ctas[0]}" as their call-to-action.`,
      confidence: 75,
      actionable: `Test "${ctas[0]}" against unique CTAs to find what works for your audience.`,
    });
  }

  // Tone opportunity
  if (tone.tone.intensity === 'subtle') {
    insights.push({
      type: 'opportunity',
      title: 'Category Lacks Bold Messaging',
      description: 'Most ads in this category use subtle, understated messaging.',
      confidence: 70,
      actionable: 'Stand out with bolder, more confident messaging.',
    });
  }

  return insights;
}

function analyzeStrengthsWeaknesses(
  ads: CompetitorAd[],
  tone: ToneAnalysisResult
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze volume
  if (ads.length > 20) {
    strengths.push('High ad volume indicates strong market presence');
  } else if (ads.length < 5) {
    weaknesses.push('Limited ad presence in the market');
  }

  // Analyze tone consistency
  if (tone.tone.secondary.length === 0) {
    strengths.push('Consistent brand voice across ads');
  } else if (tone.tone.secondary.length > 2) {
    weaknesses.push('Inconsistent messaging tone');
  }

  // Analyze emotional range
  if (tone.tone.emotionalRange.length > 2) {
    strengths.push('Diverse emotional appeals');
  } else if (tone.tone.emotionalRange.length === 0) {
    weaknesses.push('Lacks emotional connection');
  }

  return { strengths, weaknesses };
}

function findDifferentiationOpportunities(
  tone: ToneAnalysisResult,
  fingerprints: CreativeFingerprint[]
): string[] {
  const opportunities: string[] = [];

  // Find unused tones
  const unusedTones = ['bold', 'empathetic', 'luxurious', 'innovative'].filter(
    (t) => t !== tone.tone.primary && !tone.tone.secondary.includes(t)
  );

  if (unusedTones.length > 0) {
    opportunities.push(`Try a ${unusedTones[0]} tone approach`);
  }

  // Analyze structure patterns
  const structures = fingerprints.map((fp) => fp.structureSignature);
  const uniqueStructures = [...new Set(structures)];

  if (uniqueStructures.length < 3) {
    opportunities.push('Competitor uses limited ad formats - experiment with different structures');
  }

  // Check for missing elements
  const hasPrice = fingerprints.some((fp) => fp.features.hasPrice);
  const hasUrgency = fingerprints.some((fp) => fp.features.hasUrgency);
  const hasSocialProof = fingerprints.some((fp) => fp.features.hasSocialProof);

  if (!hasPrice) opportunities.push('Add pricing transparency to differentiate');
  if (!hasUrgency) opportunities.push('Test urgency-driven messaging');
  if (!hasSocialProof) opportunities.push('Include social proof elements');

  return opportunities.slice(0, 5);
}
