/**
 * Competitor Scraper
 * Stub implementation for Meta Ad Library queries
 * In production, this would use the Meta Ad Library API
 */

import { supabase } from '@/integrations/supabase/client';

export interface CompetitorAd {
  id: string;
  brandName: string;
  adText: string;
  adImageUrl?: string;
  platform?: string;
  category: string;
  lastSeenAt: Date;
}

export interface ScraperOptions {
  category: string;
  country?: string;
  limit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Fetch competitor ads from the database
 * In production, this would query the Meta Ad Library API
 */
export async function fetchCompetitorAds(options: ScraperOptions): Promise<CompetitorAd[]> {
  const { category, limit = 20 } = options;

  const { data, error } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('category', category)
    .order('last_seen_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching competitor ads:', error);
    return [];
  }

  return (data || []).map((ad) => ({
    id: ad.id,
    brandName: ad.brand_name || 'Unknown Brand',
    adText: ad.ad_text || '',
    adImageUrl: ad.ad_image_url || undefined,
    platform: ad.platform || undefined,
    category: ad.category,
    lastSeenAt: new Date(ad.last_seen_at || Date.now()),
  }));
}

/**
 * Search for competitor ads by keyword
 */
export async function searchCompetitorAds(
  keyword: string,
  category?: string
): Promise<CompetitorAd[]> {
  let query = supabase
    .from('competitor_ads')
    .select('*')
    .or(`ad_text.ilike.%${keyword}%,brand_name.ilike.%${keyword}%`)
    .order('last_seen_at', { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching competitor ads:', error);
    return [];
  }

  return (data || []).map((ad) => ({
    id: ad.id,
    brandName: ad.brand_name || 'Unknown Brand',
    adText: ad.ad_text || '',
    adImageUrl: ad.ad_image_url || undefined,
    platform: ad.platform || undefined,
    category: ad.category,
    lastSeenAt: new Date(ad.last_seen_at || Date.now()),
  }));
}

/**
 * Get trending competitors in a category
 */
export async function getTrendingCompetitors(category: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('competitor_ads')
    .select('brand_name')
    .eq('category', category)
    .order('last_seen_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Count brand occurrences
  const brandCounts: Record<string, number> = {};
  data.forEach((ad) => {
    if (ad.brand_name) {
      brandCounts[ad.brand_name] = (brandCounts[ad.brand_name] || 0) + 1;
    }
  });

  // Sort by count and return top brands
  return Object.entries(brandCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([brand]) => brand);
}

/**
 * Stub: Would use Meta Ad Library API in production
 * https://www.facebook.com/ads/library/api/
 */
export async function fetchFromMetaAdLibrary(
  _pageId: string,
  _options: {
    adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
    country?: string;
    limit?: number;
  }
): Promise<CompetitorAd[]> {
  // This is a stub - Meta Ad Library API requires approved app access
  console.log('Meta Ad Library API not implemented - using cached data');
  return [];
}

/**
 * Save competitor ads to database for future analysis
 */
export async function saveCompetitorAds(ads: Omit<CompetitorAd, 'id'>[]): Promise<void> {
  const adsToInsert = ads.map((ad) => ({
    brand_name: ad.brandName,
    ad_text: ad.adText,
    ad_image_url: ad.adImageUrl,
    platform: ad.platform,
    category: ad.category,
    last_seen_at: ad.lastSeenAt.toISOString(),
  }));

  const { error } = await supabase.from('competitor_ads').insert(adsToInsert);

  if (error) {
    console.error('Error saving competitor ads:', error);
  }
}
