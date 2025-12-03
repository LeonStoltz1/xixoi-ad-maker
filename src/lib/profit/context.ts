/**
 * Profit Context Builder
 * Builds margin-aware context for Gemini conductor
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateProfitMetrics, assessProfitRisk, type ProductMargin, type CampaignMetrics } from './calculations';

export interface ProfitabilityContext {
  products: ProductProfitData[];
  campaignProfitability: CampaignProfitData[];
  elasticityHistory: ElasticityRecord[];
  profitLogs: ProfitLogEntry[];
  aggregateMetrics: AggregateMetrics;
}

interface ProductProfitData {
  productId: string;
  productName: string;
  basePrice: number;
  costOfGoods: number;
  margin: number;
  marginPercentage: number;
  pricingStrategy: string;
  elasticityCoefficient: number | null;
  optimalPrice: number | null;
}

interface CampaignProfitData {
  campaignId: string;
  campaignName: string;
  productId: string | null;
  spend: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  marginAdjustedRoas: number;
  profitPerClick: number;
  riskLevel: string;
  recommendation: string;
}

interface ElasticityRecord {
  productId: string;
  testPrice: number;
  baselinePrice: number;
  elasticity: number;
  testedAt: string;
}

interface ProfitLogEntry {
  eventType: string;
  productId: string | null;
  campaignId: string | null;
  marginBefore: number | null;
  marginAfter: number | null;
  decision: string | null;
  confidence: number | null;
  createdAt: string;
}

interface AggregateMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  averageMarginPercentage: number;
  profitableCampaigns: number;
  unprofitableCampaigns: number;
}

/**
 * Build complete profitability context for a user
 */
export async function buildProfitabilityContext(userId: string): Promise<ProfitabilityContext> {
  // Fetch all data in parallel
  const [productsResult, campaignsResult, elasticityResult, logsResult] = await Promise.all([
    supabase
      .from('product_profitability')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('campaigns')
      .select(`
        id,
        name,
        daily_budget,
        campaign_performance (
          spend,
          revenue,
          conversions,
          impressions,
          clicks
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('elasticity_tests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('profit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  // Process products
  const products: ProductProfitData[] = (productsResult.data || []).map((p: any) => ({
    productId: p.product_id,
    productName: p.product_name || p.product_id,
    basePrice: Number(p.base_price) || 0,
    costOfGoods: Number(p.cost_of_goods) || 0,
    margin: Number(p.margin) || 0,
    marginPercentage: Number(p.margin_percentage) || 0,
    pricingStrategy: p.pricing_strategy || 'standard',
    elasticityCoefficient: p.elasticity_coefficient ? Number(p.elasticity_coefficient) : null,
    optimalPrice: p.optimal_price ? Number(p.optimal_price) : null,
  }));

  // Create product lookup map
  const productMap = new Map(products.map(p => [p.productId, p]));

  // Process campaigns with profit metrics
  const campaignProfitability: CampaignProfitData[] = [];
  let totalSpend = 0;
  let totalRevenue = 0;
  let totalGrossProfit = 0;
  let totalNetProfit = 0;
  let profitableCampaigns = 0;
  let unprofitableCampaigns = 0;

  for (const campaign of (campaignsResult.data || [])) {
    const perf = campaign.campaign_performance || [];
    const aggregated: CampaignMetrics = perf.reduce(
      (acc: CampaignMetrics, p: any) => ({
        spend: acc.spend + (Number(p.spend) || 0),
        revenue: acc.revenue + (Number(p.revenue) || 0),
        conversions: acc.conversions + (Number(p.conversions) || 0),
        impressions: acc.impressions + (Number(p.impressions) || 0),
        clicks: acc.clicks + (Number(p.clicks) || 0),
      }),
      { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
    );

    // Use first product or default margin
    const defaultMargin: ProductMargin = {
      productId: 'default',
      basePrice: 100,
      costOfGoods: 60,
      margin: 40,
      marginPercentage: 40,
    };
    
    const productMargin = products[0] || defaultMargin;
    const profitMetrics = calculateProfitMetrics(aggregated, productMargin);
    const riskAssessment = assessProfitRisk(profitMetrics, aggregated.spend, Number(campaign.daily_budget) || 0);

    campaignProfitability.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      productId: products[0]?.productId || null,
      spend: aggregated.spend,
      revenue: aggregated.revenue,
      grossProfit: profitMetrics.grossProfit,
      netProfit: profitMetrics.netProfit,
      marginAdjustedRoas: profitMetrics.marginAdjustedRoas,
      profitPerClick: profitMetrics.profitPerClick,
      riskLevel: riskAssessment.riskLevel,
      recommendation: riskAssessment.recommendation,
    });

    totalSpend += aggregated.spend;
    totalRevenue += aggregated.revenue;
    totalGrossProfit += profitMetrics.grossProfit;
    totalNetProfit += profitMetrics.netProfit;
    
    if (profitMetrics.netProfit > 0) {
      profitableCampaigns++;
    } else if (aggregated.spend > 0) {
      unprofitableCampaigns++;
    }
  }

  // Process elasticity history
  const elasticityHistory: ElasticityRecord[] = (elasticityResult.data || []).map((e: any) => ({
    productId: e.product_id,
    testPrice: Number(e.test_price) || 0,
    baselinePrice: Number(e.baseline_price) || 0,
    elasticity: Number(e.calculated_elasticity) || 0,
    testedAt: e.completed_at,
  }));

  // Process profit logs
  const profitLogs: ProfitLogEntry[] = (logsResult.data || []).map((l: any) => ({
    eventType: l.event_type,
    productId: l.product_id,
    campaignId: l.campaign_id,
    marginBefore: l.margin_before ? Number(l.margin_before) : null,
    marginAfter: l.margin_after ? Number(l.margin_after) : null,
    decision: l.decision_rationale,
    confidence: l.confidence ? Number(l.confidence) : null,
    createdAt: l.created_at,
  }));

  const avgMargin = products.length > 0
    ? products.reduce((sum, p) => sum + p.marginPercentage, 0) / products.length
    : 40;

  return {
    products,
    campaignProfitability,
    elasticityHistory,
    profitLogs,
    aggregateMetrics: {
      totalSpend,
      totalRevenue,
      totalGrossProfit,
      totalNetProfit,
      averageMarginPercentage: avgMargin,
      profitableCampaigns,
      unprofitableCampaigns,
    },
  };
}

/**
 * Format profitability context as prompt text for Gemini
 */
export function formatProfitabilityContextForPrompt(ctx: ProfitabilityContext): string {
  const lines: string[] = [
    '## PROFITABILITY CONTEXT',
    '',
    '### Aggregate Metrics',
    `- Total Ad Spend: $${ctx.aggregateMetrics.totalSpend.toFixed(2)}`,
    `- Total Revenue: $${ctx.aggregateMetrics.totalRevenue.toFixed(2)}`,
    `- Gross Profit: $${ctx.aggregateMetrics.totalGrossProfit.toFixed(2)}`,
    `- Net Profit (after ad spend): $${ctx.aggregateMetrics.totalNetProfit.toFixed(2)}`,
    `- Average Margin: ${ctx.aggregateMetrics.averageMarginPercentage.toFixed(1)}%`,
    `- Profitable Campaigns: ${ctx.aggregateMetrics.profitableCampaigns}`,
    `- Unprofitable Campaigns: ${ctx.aggregateMetrics.unprofitableCampaigns}`,
    '',
  ];

  if (ctx.products.length > 0) {
    lines.push('### Product Margins');
    for (const p of ctx.products.slice(0, 10)) {
      lines.push(`- ${p.productName}: Price $${p.basePrice}, Cost $${p.costOfGoods}, Margin ${p.marginPercentage.toFixed(1)}%`);
      if (p.elasticityCoefficient) {
        lines.push(`  Elasticity: ${p.elasticityCoefficient.toFixed(2)}, Optimal Price: $${p.optimalPrice?.toFixed(2) || 'TBD'}`);
      }
    }
    lines.push('');
  }

  if (ctx.campaignProfitability.length > 0) {
    lines.push('### Campaign Profitability');
    for (const c of ctx.campaignProfitability.slice(0, 10)) {
      lines.push(`- ${c.campaignName}:`);
      lines.push(`  Spend: $${c.spend.toFixed(2)}, Revenue: $${c.revenue.toFixed(2)}`);
      lines.push(`  Net Profit: $${c.netProfit.toFixed(2)}, MA-ROAS: ${c.marginAdjustedRoas.toFixed(2)}x`);
      lines.push(`  Risk: ${c.riskLevel.toUpperCase()} - ${c.recommendation}`);
    }
    lines.push('');
  }

  if (ctx.elasticityHistory.length > 0) {
    lines.push('### Recent Price Elasticity Tests');
    for (const e of ctx.elasticityHistory.slice(0, 5)) {
      lines.push(`- Product ${e.productId}: Tested $${e.testPrice} vs baseline $${e.baselinePrice}, Elasticity: ${e.elasticity.toFixed(2)}`);
    }
    lines.push('');
  }

  lines.push('### Profit Optimization Rules');
  lines.push('- Never increase spend on campaigns with negative net profit');
  lines.push('- Prioritize campaigns with margin-adjusted ROAS > 1.5x');
  lines.push('- Flag campaigns with risk level "high" or "critical" for review');
  lines.push('- Consider price tests for products with unknown elasticity');
  lines.push('');

  return lines.join('\n');
}
