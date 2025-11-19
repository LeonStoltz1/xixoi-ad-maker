import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SpendSummary {
  todaySpend: number;
  monthSpend: number;
  totalSpent: number;
  walletBalance: number;
  monthlySpendLimit: number | null;
}

export function GlobalSpendSummary() {
  const [summary, setSummary] = useState<SpendSummary>({
    todaySpend: 0,
    monthSpend: 0,
    totalSpent: 0,
    walletBalance: 0,
    monthlySpendLimit: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpendSummary();
    
    // Set up realtime subscription to campaign changes
    const subscription = supabase
      .channel('campaign_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns' }, 
        () => {
          loadSpendSummary();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSpendSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      // Get user profile for monthly spend limit
      const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_ad_spend_limit')
        .eq('id', user.id)
        .single();

      // Get campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status, is_active, total_spent')
        .eq('user_id', user.id);

      if (!campaigns) return;

      // Calculate total spent across all campaigns
      const totalSpent = campaigns.reduce((sum, c) => sum + (c.total_spent || 0), 0);

      // Get wallet balance
      const { data: wallet } = await supabase
        .from('ad_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const walletBalance = wallet?.balance ? Number(wallet.balance) : 0;

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
        totalSpent,
        walletBalance,
        monthlySpendLimit: profile?.monthly_ad_spend_limit ? Number(profile.monthly_ad_spend_limit) : null,
      });
    } catch (error) {
      console.error('Error loading spend summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Spend Today</span>
            <span className="text-xl font-bold">${summary.todaySpend.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Spend This Month</span>
            <span className="text-xl font-bold">${summary.monthSpend.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
            <span className="text-xl font-bold">${summary.totalSpent.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Wallet Balance</span>
            <span className={`text-xl font-bold ${summary.walletBalance < 50 ? 'text-destructive' : ''}`}>
              ${summary.walletBalance.toFixed(2)}
            </span>
          </div>
          
          {summary.monthlySpendLimit && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Monthly Limit</span>
              <span className="text-xl font-bold">
                ${summary.monthSpend.toFixed(2)} / ${summary.monthlySpendLimit.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
