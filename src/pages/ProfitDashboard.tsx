import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  Zap,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateProfitMetrics, 
  assessProfitRisk,
  type ProductMargin,
  type CampaignMetrics 
} from '@/lib/profit/calculations';
import { PlatformCostWarning } from '@/components/PlatformCostWarning';
import { usePlatformCosts } from '@/hooks/usePlatformCosts';

interface ProductData {
  id: string;
  product_id: string;
  product_name: string;
  base_price: number;
  cost_of_goods: number;
  margin: number;
  margin_percentage: number;
  pricing_strategy: string;
  elasticity_coefficient: number | null;
  optimal_price: number | null;
}

interface CampaignProfit {
  id: string;
  name: string;
  spend: number;
  revenue: number;
  netProfit: number;
  marginAdjustedRoas: number;
  riskLevel: string;
}

interface ProfitLog {
  id: string;
  event_type: string;
  product_id: string | null;
  campaign_id: string | null;
  old_price: number | null;
  new_price: number | null;
  margin_before: number | null;
  margin_after: number | null;
  decision_rationale: string | null;
  confidence: number | null;
  auto_executed: boolean;
  created_at: string;
}

export default function ProfitDashboard() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignProfit[]>([]);
  const [profitLogs, setProfitLogs] = useState<ProfitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState(false);
  const [aggregates, setAggregates] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgMargin: 0,
    profitableCampaigns: 0,
    totalCampaigns: 0,
  });
  const { toast } = useToast();
  const { costProfile, showCritical } = usePlatformCosts();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load products
    const { data: productsData } = await supabase
      .from('product_profitability')
      .select('*')
      .eq('user_id', user.id);

    setProducts((productsData || []) as ProductData[]);

    // Load campaigns with performance
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        campaign_performance (spend, revenue, conversions, impressions, clicks)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    const avgMargin = productsData && productsData.length > 0
      ? productsData.reduce((sum, p) => sum + (Number(p.margin_percentage) || 0), 0) / productsData.length
      : 40;

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let profitableCampaigns = 0;

    const processedCampaigns: CampaignProfit[] = (campaignsData || []).map((c: any) => {
      const perf = c.campaign_performance || [];
      const totals = perf.reduce((acc: CampaignMetrics, p: any) => ({
        spend: acc.spend + (Number(p.spend) || 0),
        revenue: acc.revenue + (Number(p.revenue) || 0),
        conversions: acc.conversions + (Number(p.conversions) || 0),
        impressions: acc.impressions + (Number(p.impressions) || 0),
        clicks: acc.clicks + (Number(p.clicks) || 0),
      }), { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 });

      const defaultMargin: ProductMargin = {
        productId: 'default',
        basePrice: 100,
        costOfGoods: 100 - avgMargin,
        margin: avgMargin,
        marginPercentage: avgMargin,
      };

      const metrics = calculateProfitMetrics(totals, defaultMargin);
      const risk = assessProfitRisk(metrics, totals.spend, 0);

      totalSpend += totals.spend;
      totalRevenue += totals.revenue;
      totalProfit += metrics.netProfit;
      if (metrics.netProfit > 0) profitableCampaigns++;

      return {
        id: c.id,
        name: c.name,
        spend: totals.spend,
        revenue: totals.revenue,
        netProfit: metrics.netProfit,
        marginAdjustedRoas: metrics.marginAdjustedRoas,
        riskLevel: risk.riskLevel,
      };
    });

    setCampaigns(processedCampaigns);
    setAggregates({
      totalSpend,
      totalRevenue,
      totalProfit,
      avgMargin,
      profitableCampaigns,
      totalCampaigns: processedCampaigns.length,
    });

    // Load profit logs
    const { data: logsData } = await supabase
      .from('profit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setProfitLogs((logsData || []) as ProfitLog[]);
    setLoading(false);
  }

  async function runPriceTests() {
    setRunningTest(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('gemini-price-tests', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: 'Price Tests Generated',
        description: data.summary || `${data.tests?.length || 0} tests proposed`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate price tests',
        variant: 'destructive',
      });
    } finally {
      setRunningTest(false);
    }
  }

  async function runSafetyCheck() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('gemini-profit-safety', {
        body: { userId: user.id, autoExecute: false }
      });

      if (error) throw error;

      toast({
        title: 'Safety Check Complete',
        description: `Risk level: ${data.overallRiskLevel}. ${data.actions?.length || 0} recommendations.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run safety check',
        variant: 'destructive',
      });
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive',
    };
    return <Badge variant={variants[level] || 'outline'}>{level.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <AppLayout title="Profit Dashboard" showBack backTo="/dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profit Dashboard" showBack backTo="/dashboard">
      <div className="space-y-6">
        {/* Platform Cost Warning Banner */}
        <PlatformCostWarning />
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ad Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(aggregates.totalSpend)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${aggregates.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(aggregates.totalProfit)}
                  </p>
                </div>
                {aggregates.totalProfit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Margin</p>
                  <p className="text-2xl font-bold">{aggregates.avgMargin.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profitable</p>
                  <p className="text-2xl font-bold">
                    {aggregates.profitableCampaigns}/{aggregates.totalCampaigns}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={runPriceTests} 
            disabled={runningTest || showCritical}
            title={showCritical ? 'AI usage limit reached' : undefined}
          >
            <Zap className="h-4 w-4 mr-2" />
            {runningTest ? 'Generating...' : 'Generate Price Tests'}
          </Button>
          <Button 
            variant="outline" 
            onClick={runSafetyCheck}
            disabled={showCritical}
            title={showCritical ? 'AI usage limit reached' : undefined}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Run Safety Check
          </Button>
          <Button variant="ghost" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campaign Profitability</TabsTrigger>
            <TabsTrigger value="products">Products & Margins</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active campaigns to analyze
                </CardContent>
              </Card>
            ) : (
              campaigns.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{c.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getRiskBadge(c.riskLevel)}
                          <span className="text-sm text-muted-foreground">
                            MA-ROAS: {c.marginAdjustedRoas.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${c.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(c.netProfit)}
                        </p>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Spend</p>
                        <p className="font-medium">{formatCurrency(c.spend)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatCurrency(c.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit Margin</p>
                        <p className={`font-medium ${c.revenue > 0 && c.netProfit / c.revenue > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {c.revenue > 0 ? ((c.netProfit / c.revenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No products configured yet</p>
                  <p className="text-sm mt-2">Add products to track margins and optimize pricing</p>
                </CardContent>
              </Card>
            ) : (
              products.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{p.product_name || p.product_id}</h3>
                      <Badge variant="outline">{p.pricing_strategy}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium">{formatCurrency(p.base_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-medium">{formatCurrency(p.cost_of_goods)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin</p>
                        <p className="font-medium text-green-500">{p.margin_percentage?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Optimal Price</p>
                        <p className="font-medium">
                          {p.optimal_price ? formatCurrency(p.optimal_price) : 'TBD'}
                        </p>
                      </div>
                    </div>
                    {p.elasticity_coefficient && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          Elasticity: {p.elasticity_coefficient.toFixed(2)} 
                          ({Math.abs(p.elasticity_coefficient) > 1 ? 'Elastic' : 'Inelastic'})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {profitLogs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No profit optimization actions yet
                </CardContent>
              </Card>
            ) : (
              profitLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.auto_executed ? 'default' : 'secondary'}>
                            {log.event_type.replace(/_/g, ' ')}
                          </Badge>
                          {log.auto_executed && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                        {log.decision_rationale && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.decision_rationale}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {log.confidence && (
                          <p className="text-muted-foreground">
                            Confidence: {(log.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {(log.old_price || log.new_price) && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span>{formatCurrency(log.old_price || 0)}</span>
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(log.new_price || 0)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
