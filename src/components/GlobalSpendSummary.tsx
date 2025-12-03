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

      // Fetch campaigns first (needed for spend queries)
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status, is_active, total_spent')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        setSummary({
          todaySpend: 0,
          monthSpend: 0,
          totalSpent: 0,
          walletBalance: 0,
          monthlySpendLimit: null,
        });
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);
      const totalSpent = campaigns.reduce((sum, c) => sum + (c.total_spent || 0), 0);

      // Run all remaining queries in parallel for maximum speed
      const [profileResult, walletResult, todaySpendResult, monthSpendResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('monthly_ad_spend_limit')
          .eq('id', user.id)
          .single(),
        supabase
          .from('ad_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('campaign_spend_daily')
          .select('spend')
          .in('campaign_id', campaignIds)
          .eq('date', today),
        supabase
          .from('campaign_spend_daily')
          .select('spend')
          .in('campaign_id', campaignIds)
          .gte('date', firstOfMonth)
      ]);

      const walletBalance = walletResult.data?.balance ? Number(walletResult.data.balance) : 0;
      const todaySpend = todaySpendResult.data?.reduce((sum, row) => sum + Number(row.spend || 0), 0) || 0;
      const monthSpend = monthSpendResult.data?.reduce((sum, row) => sum + Number(row.spend || 0), 0) || 0;

      setSummary({
        todaySpend,
        monthSpend,
        totalSpent,
        walletBalance,
        monthlySpendLimit: profileResult.data?.monthly_ad_spend_limit ? Number(profileResult.data.monthly_ad_spend_limit) : null,
      });
    } catch (error) {
      console.error('Error loading spend summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6 border-2 border-foreground">
        <CardContent className="p-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-foreground">
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
