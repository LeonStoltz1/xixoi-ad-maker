import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Award, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceInsights {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  overallROAS: number;
  bestPerformingCampaign: {
    id: string;
    name: string;
    roas: number;
  } | null;
  worstPerformingCampaign: {
    id: string;
    name: string;
    roas: number;
  } | null;
}

export function AccountPerformanceInsights() {
  const [insights, setInsights] = useState<PerformanceInsights>({
    totalSpend: 0,
    totalRevenue: 0,
    totalConversions: 0,
    overallROAS: 0,
    bestPerformingCampaign: null,
    worstPerformingCampaign: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, total_spent')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);

      // Get performance data
      const { data: performanceData } = await supabase
        .from('campaign_performance')
        .select('campaign_id, spend, revenue, conversions, roas')
        .in('campaign_id', campaignIds);

      if (!performanceData || performanceData.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalSpend = performanceData.reduce((sum, row) => sum + Number(row.spend || 0), 0);
      const totalRevenue = performanceData.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
      const totalConversions = performanceData.reduce((sum, row) => sum + Number(row.conversions || 0), 0);
      const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      // Find best and worst performing campaigns by ROAS
      const campaignPerformance = campaignIds.map(campaignId => {
        const campaignData = performanceData.filter(p => p.campaign_id === campaignId);
        const spend = campaignData.reduce((sum, row) => sum + Number(row.spend || 0), 0);
        const revenue = campaignData.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
        const roas = spend > 0 ? revenue / spend : 0;
        const campaign = campaigns.find(c => c.id === campaignId);

        return {
          id: campaignId,
          name: campaign?.name || 'Unknown',
          roas,
          spend,
        };
      }).filter(c => c.spend > 10); // Only include campaigns with meaningful spend

      campaignPerformance.sort((a, b) => b.roas - a.roas);

      setInsights({
        totalSpend,
        totalRevenue,
        totalConversions,
        overallROAS,
        bestPerformingCampaign: campaignPerformance.length > 0 ? campaignPerformance[0] : null,
        worstPerformingCampaign: campaignPerformance.length > 1 
          ? campaignPerformance[campaignPerformance.length - 1] 
          : null,
      });
    } catch (error) {
      console.error('Error loading performance insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Performance Insights</CardTitle>
        <CardDescription>
          Executive summary of your advertising performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Spend</p>
            </div>
            <p className="text-2xl font-bold">${insights.totalSpend.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold">${insights.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Conversions</p>
            </div>
            <p className="text-2xl font-bold">{insights.totalConversions}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Overall ROAS</p>
            </div>
            <p className="text-2xl font-bold">
              {insights.overallROAS.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* Best and Worst Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.bestPerformingCampaign && (
            <div className="border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5" />
                <p className="font-semibold">Best Performer</p>
              </div>
              <p className="text-sm font-medium">{insights.bestPerformingCampaign.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-foreground text-background">
                  {insights.bestPerformingCampaign.roas.toFixed(2)}x ROAS
                </Badge>
              </div>
            </div>
          )}

          {insights.worstPerformingCampaign && (
            <div className="border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-semibold">Needs Attention</p>
              </div>
              <p className="text-sm font-medium">{insights.worstPerformingCampaign.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-foreground text-foreground">
                  {insights.worstPerformingCampaign.roas.toFixed(2)}x ROAS
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
