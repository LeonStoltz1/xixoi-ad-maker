import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, PlayCircle, PauseCircle } from 'lucide-react';

interface SpendOverview {
  spendToday: number;
  spendThisMonth: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  walletBalance?: number;
}

export const GlobalSpendOverview = () => {
  const [overview, setOverview] = useState<SpendOverview>({
    spendToday: 0,
    spendThisMonth: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('spend-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_spend_daily' }, loadOverview)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, loadOverview)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOverview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      // Get user's campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        setOverview({
          spendToday: 0,
          spendThisMonth: 0,
          activeCampaigns: 0,
          pausedCampaigns: 0,
        });
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;

      // Run all spend queries in parallel for faster loading
      const [todaySpendResult, monthSpendResult, walletResult] = await Promise.all([
        supabase
          .from('campaign_spend_daily')
          .select('spend')
          .in('campaign_id', campaignIds)
          .eq('date', today),
        supabase
          .from('campaign_spend_daily')
          .select('spend')
          .in('campaign_id', campaignIds)
          .gte('date', firstDayOfMonth),
        supabase
          .from('ad_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single()
      ]);

      const spendToday = todaySpendResult.data?.reduce((sum, row) => sum + (Number(row.spend) || 0), 0) || 0;
      const spendThisMonth = monthSpendResult.data?.reduce((sum, row) => sum + (Number(row.spend) || 0), 0) || 0;

      setOverview({
        spendToday,
        spendThisMonth,
        activeCampaigns,
        pausedCampaigns,
        walletBalance: walletResult.data?.balance ? Number(walletResult.data.balance) : undefined,
      });
    } catch (error) {
      console.error('Error loading spend overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      <Card className="p-6 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Spend Today</p>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold">${overview.spendToday.toFixed(2)}</div>
      </Card>

      <Card className="p-6 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Spend This Month</p>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold">${overview.spendThisMonth.toFixed(2)}</div>
      </Card>

      <Card className="p-6 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold">{overview.activeCampaigns}</div>
        <p className="text-xs text-muted-foreground mt-1">{overview.pausedCampaigns} paused</p>
      </Card>

      <Card className="p-6 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">Ad Balance</p>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold">
          {overview.walletBalance !== undefined ? `$${overview.walletBalance.toFixed(2)}` : 'N/A'}
        </div>
        {overview.walletBalance !== undefined && overview.walletBalance < 50 && (
          <p className="text-xs text-muted-foreground mt-1 border-t border-foreground/20 pt-1">Low balance - top up soon</p>
        )}
      </Card>
    </div>
  );
};
