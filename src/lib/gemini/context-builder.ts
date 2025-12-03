/**
 * Long Context Builder for Gemini
 * Assembles rich context from creative memory, competitors, and brand data
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreativeContext {
  pastAds: Array<{
    headline: string;
    body_copy: string;
    cta_text: string;
    performance_score: number;
    impressions: number;
    clicks: number;
  }>;
  topPerformers: Array<{
    ad_text: string;
    performance_score: number;
  }>;
}

export interface CompetitorContext {
  competitors: Array<{
    brand_name: string;
    ad_text: string;
    platform: string;
  }>;
  trends: string[];
}

export interface BrandContext {
  brandVoice: string;
  preferredTone: string;
  topHooks: string[];
  ctaPatterns: string[];
}

export interface CampaignContext {
  campaign: {
    id: string;
    name: string;
    status: string;
    daily_budget: number;
    total_spent: number;
    target_location: string;
    target_audience: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  variants: Array<{
    id: string;
    headline: string;
    body_copy: string;
    cta_text: string;
  }>;
}

/**
 * Build creative context from user's past ads and performance
 */
export async function buildCreativeContext(userId: string): Promise<CreativeContext> {
  const { data: memories } = await supabase
    .from('creative_memory')
    .select('headline, body_copy, cta_text, performance_score, impressions, clicks')
    .eq('user_id', userId)
    .order('performance_score', { ascending: false })
    .limit(20);

  const pastAds = memories || [];
  const topPerformers = pastAds
    .filter(ad => ad.performance_score && ad.performance_score > 70)
    .slice(0, 5)
    .map(ad => ({
      ad_text: `${ad.headline} - ${ad.body_copy}`,
      performance_score: ad.performance_score || 0
    }));

  return { pastAds, topPerformers };
}

/**
 * Build competitor context from market intelligence
 */
export async function buildCompetitorContext(category: string): Promise<CompetitorContext> {
  const { data: competitors } = await supabase
    .from('competitor_ads')
    .select('brand_name, ad_text, platform')
    .eq('category', category)
    .order('last_seen_at', { ascending: false })
    .limit(10);

  // Extract trends from competitor ads (simplified - could use embeddings)
  const trends: string[] = [];
  if (competitors && competitors.length > 0) {
    // Common words/phrases analysis would go here
    trends.push('Video content trending');
    trends.push('Urgency messaging effective');
  }

  return {
    competitors: competitors || [],
    trends
  };
}

/**
 * Build brand context from user profile and past performance
 */
export async function buildBrandContext(userId: string): Promise<BrandContext> {
  // Get user's intake form for brand info
  const { data: intake } = await supabase
    .from('customer_intake_forms')
    .select('product_description, industry_category')
    .eq('user_id', userId)
    .single();

  // Analyze past successful ads for patterns
  const { data: topAds } = await supabase
    .from('creative_memory')
    .select('headline, body_copy, cta_text')
    .eq('user_id', userId)
    .gte('performance_score', 70)
    .limit(10);

  // Extract patterns (simplified)
  const topHooks = topAds?.map(ad => ad.headline).filter(Boolean) as string[] || [];
  const ctaPatterns = [...new Set(topAds?.map(ad => ad.cta_text).filter(Boolean))] as string[];

  return {
    brandVoice: intake?.product_description || 'Professional and engaging',
    preferredTone: intake?.industry_category === 'technology' ? 'innovative' : 'friendly',
    topHooks: topHooks.slice(0, 5),
    ctaPatterns: ctaPatterns.slice(0, 3)
  };
}

/**
 * Build campaign context with performance data
 */
export async function buildCampaignContext(campaignId: string): Promise<CampaignContext | null> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, status, daily_budget, total_spent, target_location, target_audience')
    .eq('id', campaignId)
    .single();

  if (!campaign) return null;

  // Get recent performance
  const { data: performance } = await supabase
    .from('campaign_performance')
    .select('impressions, clicks, conversions, spend, ctr, cpc, roas')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })
    .limit(7);

  // Aggregate performance
  const aggregated = (performance || []).reduce(
    (acc, p) => ({
      impressions: acc.impressions + (p.impressions || 0),
      clicks: acc.clicks + (p.clicks || 0),
      conversions: acc.conversions + (p.conversions || 0),
      spend: acc.spend + (p.spend || 0),
      ctr: p.ctr || acc.ctr,
      cpc: p.cpc || acc.cpc,
      roas: p.roas || acc.roas
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, ctr: 0, cpc: 0, roas: 0 }
  );

  // Get variants
  const { data: variants } = await supabase
    .from('ad_variants')
    .select('id, headline, body_copy, cta_text')
    .eq('campaign_id', campaignId);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status || 'draft',
      daily_budget: campaign.daily_budget || 0,
      total_spent: campaign.total_spent || 0,
      target_location: campaign.target_location || '',
      target_audience: campaign.target_audience || ''
    },
    performance: aggregated,
    variants: variants || []
  };
}

/**
 * Build unified context for Gemini Conductor
 */
export async function buildFullContext(
  userId: string,
  campaignIds: string[],
  category?: string
): Promise<string> {
  const [creative, brand] = await Promise.all([
    buildCreativeContext(userId),
    buildBrandContext(userId)
  ]);

  const competitor = category ? await buildCompetitorContext(category) : null;

  const campaigns = await Promise.all(
    campaignIds.map(id => buildCampaignContext(id))
  );

  const contextParts: string[] = [
    '=== BRAND CONTEXT ===',
    `Brand Voice: ${brand.brandVoice}`,
    `Preferred Tone: ${brand.preferredTone}`,
    `Top Hooks: ${brand.topHooks.join(', ')}`,
    `CTA Patterns: ${brand.ctaPatterns.join(', ')}`,
    '',
    '=== CREATIVE MEMORY ===',
    `Top Performing Ads: ${creative.topPerformers.length}`,
    ...creative.topPerformers.map(ad => `- Score ${ad.performance_score}: ${ad.ad_text.substring(0, 100)}...`),
    ''
  ];

  if (competitor) {
    contextParts.push(
      '=== COMPETITOR INTELLIGENCE ===',
      `Competitors Tracked: ${competitor.competitors.length}`,
      `Market Trends: ${competitor.trends.join(', ')}`,
      ''
    );
  }

  contextParts.push('=== ACTIVE CAMPAIGNS ===');
  for (const campaign of campaigns.filter(Boolean)) {
    if (!campaign) continue;
    contextParts.push(
      `Campaign: ${campaign.campaign.name} (${campaign.campaign.status})`,
      `Budget: $${campaign.campaign.daily_budget}/day | Spent: $${campaign.performance.spend}`,
      `Performance: ${campaign.performance.impressions} imp | ${campaign.performance.clicks} clicks | CTR ${(campaign.performance.ctr * 100).toFixed(2)}%`,
      `Variants: ${campaign.variants.length}`,
      ''
    );
  }

  return contextParts.join('\n');
}
