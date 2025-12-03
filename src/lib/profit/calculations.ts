/**
 * Profit Engine Calculations
 * Margin-aware ROAS and profitability metrics
 */

export interface ProductMargin {
  productId: string;
  basePrice: number;
  costOfGoods: number;
  margin: number;
  marginPercentage: number;
}

export interface CampaignMetrics {
  spend: number;
  revenue: number;
  conversions: number;
  impressions: number;
  clicks: number;
}

export interface ProfitMetrics {
  grossProfit: number;
  netProfit: number;
  marginAdjustedRoas: number;
  profitPerImpression: number;
  profitPerClick: number;
  profitPerDollarSpent: number;
  profitPerConversion: number;
  breakEvenRoas: number;
  effectiveMargin: number;
}

/**
 * Calculate margin-adjusted ROAS
 * Standard ROAS doesn't account for product margins - this does
 */
export function calculateMarginAdjustedRoas(
  revenue: number,
  spend: number,
  marginPercentage: number
): number {
  if (spend === 0) return 0;
  const grossProfit = revenue * (marginPercentage / 100);
  return grossProfit / spend;
}

/**
 * Calculate profit per impression
 */
export function calculateProfitPerImpression(
  revenue: number,
  impressions: number,
  marginPercentage: number,
  spend: number
): number {
  if (impressions === 0) return 0;
  const grossProfit = revenue * (marginPercentage / 100);
  const netProfit = grossProfit - spend;
  return netProfit / impressions;
}

/**
 * Calculate profit per click
 */
export function calculateProfitPerClick(
  revenue: number,
  clicks: number,
  marginPercentage: number,
  spend: number
): number {
  if (clicks === 0) return 0;
  const grossProfit = revenue * (marginPercentage / 100);
  const netProfit = grossProfit - spend;
  return netProfit / clicks;
}

/**
 * Calculate profit per dollar spent
 */
export function calculateProfitPerDollarSpent(
  revenue: number,
  spend: number,
  marginPercentage: number
): number {
  if (spend === 0) return 0;
  const grossProfit = revenue * (marginPercentage / 100);
  const netProfit = grossProfit - spend;
  return netProfit / spend;
}

/**
 * Calculate comprehensive profit metrics for a campaign
 */
export function calculateProfitMetrics(
  metrics: CampaignMetrics,
  margin: ProductMargin
): ProfitMetrics {
  const { spend, revenue, conversions, impressions, clicks } = metrics;
  const marginPct = margin.marginPercentage;
  
  const grossProfit = revenue * (marginPct / 100);
  const netProfit = grossProfit - spend;
  
  // Break-even ROAS = 1 / margin percentage
  // E.g., if margin is 40%, you need 2.5x ROAS to break even
  const breakEvenRoas = marginPct > 0 ? 100 / marginPct : Infinity;
  
  return {
    grossProfit,
    netProfit,
    marginAdjustedRoas: calculateMarginAdjustedRoas(revenue, spend, marginPct),
    profitPerImpression: calculateProfitPerImpression(revenue, impressions, marginPct, spend),
    profitPerClick: calculateProfitPerClick(revenue, clicks, marginPct, spend),
    profitPerDollarSpent: calculateProfitPerDollarSpent(revenue, spend, marginPct),
    profitPerConversion: conversions > 0 ? netProfit / conversions : 0,
    breakEvenRoas,
    effectiveMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
  };
}

/**
 * Determine if a campaign is profitable
 */
export function isProfitable(metrics: ProfitMetrics): boolean {
  return metrics.netProfit > 0;
}

/**
 * Calculate price elasticity from test results
 */
export function calculateElasticity(
  baselinePrice: number,
  testPrice: number,
  baselineConversionRate: number,
  testConversionRate: number
): number {
  if (baselinePrice === 0 || baselineConversionRate === 0) return 0;
  
  const priceChange = (testPrice - baselinePrice) / baselinePrice;
  const demandChange = (testConversionRate - baselineConversionRate) / baselineConversionRate;
  
  if (priceChange === 0) return 0;
  
  // Elasticity = % change in demand / % change in price
  return demandChange / priceChange;
}

/**
 * Calculate optimal price based on elasticity
 */
export function calculateOptimalPrice(
  currentPrice: number,
  costOfGoods: number,
  elasticity: number
): number {
  if (elasticity >= -1) {
    // Inelastic demand - can raise prices
    return currentPrice * 1.1;
  }
  
  // Elastic demand - optimal price formula: P = MC * e / (e + 1)
  // where MC = marginal cost, e = elasticity (negative)
  const optimalPrice = costOfGoods * (elasticity / (elasticity + 1));
  
  // Ensure price is at least cost + 10% margin
  return Math.max(optimalPrice, costOfGoods * 1.1);
}

/**
 * Risk assessment for profit safety
 */
export interface ProfitRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: string[];
  recommendation: string;
}

export function assessProfitRisk(
  metrics: ProfitMetrics,
  spend: number,
  dailyBudget: number
): ProfitRiskAssessment {
  const factors: string[] = [];
  let riskScore = 0;
  
  // Check negative profit
  if (metrics.netProfit < 0) {
    riskScore += 40;
    factors.push('Campaign is currently unprofitable');
  }
  
  // Check margin-adjusted ROAS below break-even
  if (metrics.marginAdjustedRoas < 1) {
    riskScore += 30;
    factors.push('Margin-adjusted ROAS below break-even');
  }
  
  // Check effective margin collapse
  if (metrics.effectiveMargin < 10) {
    riskScore += 20;
    factors.push('Effective margin below 10%');
  }
  
  // Check high spend relative to profit
  if (spend > 0 && metrics.profitPerDollarSpent < 0.1) {
    riskScore += 10;
    factors.push('Low profit per dollar spent');
  }
  
  let riskLevel: ProfitRiskAssessment['riskLevel'];
  let recommendation: string;
  
  if (riskScore >= 70) {
    riskLevel = 'critical';
    recommendation = 'Pause campaign immediately to prevent further losses';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
    recommendation = 'Reduce budget and review targeting urgently';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
    recommendation = 'Monitor closely and consider optimization';
  } else {
    riskLevel = 'low';
    recommendation = 'Campaign is performing within acceptable parameters';
  }
  
  return { riskLevel, riskScore, factors, recommendation };
}
