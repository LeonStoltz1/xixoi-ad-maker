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

export async function getCampaignPerformance(campaignId: string): Promise<CampaignPerformanceMetrics> {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  // Get today's spend
  const { data: todayData } = await supabase
    .from('campaign_spend_daily')
    .select('spend')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single();

  const spendToday = Number(todayData?.spend || 0);

  // Get month's spend
  const { data: monthData } = await supabase
    .from('campaign_spend_daily')
    .select('spend')
    .eq('campaign_id', campaignId)
    .gte('date', firstOfMonth);

  const spendThisMonth = monthData?.reduce((sum, row) => sum + Number(row.spend || 0), 0) || 0;

  // Get performance metrics (last 7 days average)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: perfData } = await supabase
    .from('campaign_performance')
    .select('impressions, clicks, spend, revenue, conversions')
    .eq('campaign_id', campaignId)
    .gte('date', sevenDaysAgoStr);

  let ctr = 0;
  let cpm = 0;
  let cpc = 0;
  let roas: number | null = null;

  if (perfData && perfData.length > 0) {
    const totalImpressions = perfData.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
    const totalClicks = perfData.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const totalSpend = perfData.reduce((sum, row) => sum + Number(row.spend || 0), 0);
    const totalRevenue = perfData.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

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

  return {
    spendToday,
    spendThisMonth,
    ctr,
    cpm,
    cpc,
    roas,
    lastUpdated: new Date().toISOString(),
  };
}
