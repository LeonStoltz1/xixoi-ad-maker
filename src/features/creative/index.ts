export { 
  fetchCompetitorAds, 
  searchCompetitorAds, 
  getTrendingCompetitors,
  saveCompetitorAds 
} from './competitor-scraper';
export type { CompetitorAd, ScraperOptions } from './competitor-scraper';

export { 
  analyzeCategoryTrends, 
  analyzeCompetitor, 
  compareBrandToCompetitors 
} from './competitor-insights';
export type { 
  CompetitorInsight, 
  CategoryTrends, 
  CompetitorAnalysis 
} from './competitor-insights';

export { CompetitorInsightsPanel } from './CompetitorInsightsPanel';
