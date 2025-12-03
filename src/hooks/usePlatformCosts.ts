/**
 * Hook for fetching and monitoring user platform costs
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCostProfile, 
  calculateCostStatus, 
  getTierLimit,
  CostStatus 
} from '@/lib/profit/platform-costs';

interface UsePlatformCostsReturn {
  costProfile: UserCostProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  showWarning: boolean;
  showCritical: boolean;
  warningMessage: string;
}

export function usePlatformCosts(): UsePlatformCostsReturn {
  const [costProfile, setCostProfile] = useState<UserCostProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's profile and plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      const userPlan = profile?.plan || 'free';
      const tierLimit = getTierLimit(userPlan);

      // Get current month's usage
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: usage } = await supabase
        .from('user_llm_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('month_start', monthStartStr)
        .maybeSingle();

      // Fetch Stripe fees from payment_economics
      const { data: paymentEconomics } = await supabase
        .from('payment_economics')
        .select('gross_amount_usd, stripe_fees_usd, net_revenue_usd')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      const stripeFees = paymentEconomics?.reduce(
        (sum, p) => sum + (Number(p.stripe_fees_usd) || 0), 
        0
      ) || 0;

      const grossRevenue = paymentEconomics?.reduce(
        (sum, p) => sum + Math.max(0, Number(p.gross_amount_usd) || 0),
        0
      ) || 0;

      const netRevenue = paymentEconomics?.reduce(
        (sum, p) => sum + (Number(p.net_revenue_usd) || 0),
        0
      ) || 0;

      // Calculate totals
      const llmCost = Number(usage?.llm_cost_usd) || 0;
      const infraCost = Number(usage?.total_infra_cost) || 0;
      const platformCosts = llmCost + infraCost;
      const totalCost = platformCosts + stripeFees;
      const marginRemaining = tierLimit - platformCosts;
      const marginPercentage = tierLimit > 0 ? marginRemaining / tierLimit : 0;
      const status = calculateCostStatus(marginPercentage);
      const trueProfitMargin = netRevenue - platformCosts;

      const costProfileData: UserCostProfile = {
        userId: user.id,
        llmCost,
        infraCost,
        stripeFees,
        totalCost,
        tierLimit,
        marginRemaining,
        marginPercentage,
        status,
        tier: userPlan,
        autopilotLoops: usage?.autopilot_loops || 0,
        conductorExecutions: usage?.conductor_executions || 0,
        creativeGenerations: usage?.creative_generations || 0,
        priceTests: usage?.price_tests || 0,
        safetyChecks: usage?.safety_checks || 0,
        apiCalls: usage?.api_calls || 0,
        grossRevenue,
        netRevenue,
        trueProfitMargin,
      };

      setCostProfile(costProfileData);
    } catch (err) {
      console.error('Error fetching platform costs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch costs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const showWarning = costProfile?.status === 'warning';
  const showCritical = costProfile?.status === 'critical' || 
                       costProfile?.status === 'blocked' || 
                       costProfile?.status === 'exceeded';

  let warningMessage = '';
  if (costProfile) {
    switch (costProfile.status) {
      case 'warning':
        warningMessage = `⚠️ You are approaching your monthly AI usage cap. ${((1 - costProfile.marginPercentage) * 100).toFixed(0)}% used.`;
        break;
      case 'critical':
        warningMessage = `⚠️ AI usage critical! Only ${(costProfile.marginPercentage * 100).toFixed(0)}% remaining. Some features may be limited.`;
        break;
      case 'blocked':
        warningMessage = `❌ AI usage limit reached. Autopilot and optimizations are paused.`;
        break;
      case 'exceeded':
        warningMessage = `❌ Your AI usage has exceeded your plan. Autopilot is paused until reset.`;
        break;
    }
  }

  return {
    costProfile,
    isLoading,
    error,
    refetch: fetchCosts,
    showWarning,
    showCritical,
    warningMessage,
  };
}
