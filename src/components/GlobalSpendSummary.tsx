import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SpendSummary {
  todaySpend: number;
  monthSpend: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalRemainingBudget: number;
}

export function GlobalSpendSummary() {
  const [summary, setSummary] = useState<SpendSummary>({
    todaySpend: 0,
    monthSpend: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    totalRemainingBudget: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpendSummary();
  }, []);

  const loadSpendSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      // Get campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status, is_active, daily_budget, total_spent, lifetime_budget')
        .eq('user_id', user.id);

      if (!campaigns) return;

      const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.is_active).length;
      const pausedCampaigns = campaigns.filter(c => c.status === 'paused' || !c.is_active).length;

      // Calculate total remaining budget across all campaigns
      const totalRemaining = campaigns.reduce((sum, c) => {
        if (c.lifetime_budget) {
          return sum + Math.max(0, c.lifetime_budget - (c.total_spent || 0));
        }
        return sum;
      }, 0);

      // Get today's spend
      const { data: todaySpendData } = await supabase
        .from('campaign_spend_daily')
        .select('spend')
        .in('campaign_id', campaigns.map(c => c.id))
        .eq('date', today);

      const todaySpend = todaySpendData?.reduce((sum, row) => sum + Number(row.spend || 0), 0) || 0;

      // Get month's spend
      const { data: monthSpendData } = await supabase
        .from('campaign_spend_daily')
        .select('spend')
        .in('campaign_id', campaigns.map(c => c.id))
        .gte('date', firstOfMonth);

      const monthSpend = monthSpendData?.reduce((sum, row) => sum + Number(row.spend || 0), 0) || 0;

      setSummary({
        todaySpend,
        monthSpend,
        activeCampaigns,
        pausedCampaigns,
        totalRemainingBudget: totalRemaining,
      });
    } catch (error) {
      console.error('Error loading spend summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Spend</p>
              <p className="text-2xl font-bold">${summary.todaySpend.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">${summary.monthSpend.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">
                {summary.activeCampaigns}
                {summary.pausedCampaigns > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({summary.pausedCampaigns} paused)
                  </span>
                )}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Remaining Budget</p>
              <p className="text-2xl font-bold">${summary.totalRemainingBudget.toFixed(2)}</p>
            </div>
            <Wallet className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
