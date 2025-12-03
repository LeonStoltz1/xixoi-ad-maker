import { supabase } from "@/integrations/supabase/client";

export interface CampaignPerformanceMetrics {
  spendToday: number;
  spendThisMonth: number;
  ctr: number;
  cpm: number;
  cpc: number;
  roas: number | null;
  lastUpdated: string;
}

// Single campaign performance (kept for backward compatibility)
export async function getCampaignPerformance(campaignId: string): Promise<CampaignPerformanceMetrics> {
  const result = await getBatchCampaignPerformance([campaignId]);
  return result[campaignId] || getEmptyMetrics();
}

// Batch load performance for multiple campaigns in minimal queries
export async function getBatchCampaignPerformance(
  campaignIds: string[]
): Promise<Record<string, CampaignPerformanceMetrics>> {
  if (campaignIds.length === 0) return {};

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Single query: Get all daily spend data for all campaigns
  const { data: spendData } = await supabase
    .from('campaign_spend_daily')
    .select('campaign_id, date, spend')
    .in('campaign_id', campaignIds)
    .gte('date', firstOfMonth);

  // Single query: Get all performance data for all campaigns (last 7 days)
  const { data: perfData } = await supabase
    .from('campaign_performance')
    .select('campaign_id, impressions, clicks, spend, revenue, conversions')
    .in('campaign_id', campaignIds)
    .gte('date', sevenDaysAgoStr);

  // Process results
  const result: Record<string, CampaignPerformanceMetrics> = {};

  for (const campaignId of campaignIds) {
    // Calculate spend metrics
    const campaignSpend = spendData?.filter(s => s.campaign_id === campaignId) || [];
    const spendToday = campaignSpend
      .filter(s => s.date === today)
      .reduce((sum, row) => sum + Number(row.spend || 0), 0);
    const spendThisMonth = campaignSpend
      .reduce((sum, row) => sum + Number(row.spend || 0), 0);

    // Calculate performance metrics
    const campaignPerf = perfData?.filter(p => p.campaign_id === campaignId) || [];
    
    let ctr = 0;
    let cpm = 0;
    let cpc = 0;
    let roas: number | null = null;

    if (campaignPerf.length > 0) {
      const totalImpressions = campaignPerf.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
      const totalClicks = campaignPerf.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
      const totalSpend = campaignPerf.reduce((sum, row) => sum + Number(row.spend || 0), 0);
      const totalRevenue = campaignPerf.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

      if (totalImpressions > 0) {
        ctr = (totalClicks / totalImpressions) * 100;
        cpm = (totalSpend / totalImpressions) * 1000;
      }

      if (totalClicks > 0) {
        cpc = totalSpend / totalClicks;
      }

      if (totalSpend > 0 && totalRevenue > 0) {
        roas = totalRevenue / totalSpend;
      }
    }

    result[campaignId] = {
      spendToday,
      spendThisMonth,
      ctr,
      cpm,
      cpc,
      roas,
      lastUpdated: new Date().toISOString(),
    };
  }

  return result;
}

function getEmptyMetrics(): CampaignPerformanceMetrics {
  return {
    spendToday: 0,
    spendThisMonth: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    roas: null,
    lastUpdated: new Date().toISOString(),
  };
}
