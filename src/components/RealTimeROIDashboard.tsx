import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, MousePointerClick, ShoppingCart } from 'lucide-react';

interface ROIMetrics {
  spend: number;
  revenue: number;
  roas: number;
  clicks: number;
  conversions: number;
}

export const RealTimeROIDashboard = ({ campaignId }: { campaignId?: string }) => {
  const [metrics, setMetrics] = useState<ROIMetrics>({
    spend: 0,
    revenue: 0,
    roas: 0,
    clicks: 0,
    conversions: 0
  });

  useEffect(() => {
    loadMetrics();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('campaign-performance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_performance',
          filter: campaignId ? `campaign_id=eq.${campaignId}` : undefined
        },
        () => loadMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('campaign_performance')
        .select('*');

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      } else {
        // Get all campaigns for user
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id);
        
        if (campaigns && campaigns.length > 0) {
          query = query.in('campaign_id', campaigns.map(c => c.id));
        }
      }

      const { data } = await query
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (data && data.length > 0) {
        const totals = data.reduce((acc, row) => ({
          spend: acc.spend + (typeof row.spend === 'string' ? parseFloat(row.spend) : row.spend || 0),
          revenue: acc.revenue + (typeof row.revenue === 'string' ? parseFloat(row.revenue) : row.revenue || 0),
          clicks: acc.clicks + (row.clicks || 0),
          conversions: acc.conversions + (row.conversions || 0)
        }), { spend: 0, revenue: 0, clicks: 0, conversions: 0 });

        setMetrics({
          ...totals,
          roas: totals.spend > 0 ? totals.revenue / totals.spend : 0
        });
      }
    } catch (error) {
      console.error('Load metrics error:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.spend.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.revenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">ROAS</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.roas >= 2 ? 'text-green-500' : metrics.roas >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
            {metrics.roas.toFixed(2)}x
          </div>
          <p className="text-xs text-muted-foreground">Return on ad spend</p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversions}</div>
          <p className="text-xs text-muted-foreground">{metrics.clicks} clicks</p>
        </CardContent>
      </Card>
    </div>
  );
};