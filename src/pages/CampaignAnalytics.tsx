import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, MousePointer, DollarSign, Target, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CampaignAnalytics() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [autoOptimize, setAutoOptimize] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
      setUserPlan(profile?.plan || 'free');

      // Fetch campaign
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (!campaignData) {
        toast({
          variant: "destructive",
          title: "Campaign not found",
          description: "This campaign does not exist or you don't have access to it.",
        });
        navigate("/dashboard");
        return;
      }

      setCampaign(campaignData);

      // Fetch or generate demo performance data
      const { data: performanceData } = await supabase
        .from("campaign_performance")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: false });

      if (performanceData && performanceData.length > 0) {
        setPerformance(performanceData);
      } else {
        // Generate demo data
        await generateDemoData(campaignId);
      }

      setLoading(false);
    };

    fetchData();
  }, [campaignId, navigate, toast]);

  const generateDemoData = async (campaignId: string) => {
    // Generate 7 days of demo performance data
    const demoData = [];
    const platforms = ["meta", "tiktok", "google", "linkedin", "x"];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const platform of platforms) {
        const impressions = Math.floor(Math.random() * 5000) + 1000;
        const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
        const spend = parseFloat((Math.random() * 50 + 10).toFixed(2));
        const conversions = Math.floor(clicks * (Math.random() * 0.15 + 0.05)); // 5-20% conversion
        const revenue = parseFloat((conversions * (Math.random() * 100 + 50)).toFixed(2));
        const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
        const cpc = parseFloat((spend / clicks).toFixed(2));
        const roas = parseFloat((revenue / spend).toFixed(2));

        demoData.push({
          campaign_id: campaignId,
          platform,
          date: date.toISOString().split('T')[0],
          impressions,
          clicks,
          spend,
          conversions,
          revenue,
          ctr,
          cpc,
          roas,
          is_demo: true,
        });
      }
    }

    const { data } = await supabase
      .from("campaign_performance")
      .insert(demoData)
      .select();

    if (data) {
      setPerformance(data);
    }
  };

  const calculateTotals = () => {
    const totals = {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
    };

    performance.forEach((p) => {
      totals.impressions += p.impressions || 0;
      totals.clicks += p.clicks || 0;
      totals.spend += parseFloat(p.spend) || 0;
      totals.conversions += p.conversions || 0;
      totals.revenue += parseFloat(p.revenue) || 0;
    });

    const avgCtr = totals.clicks > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";
    const avgCpc = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : "0.00";
    const totalRoas = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : "0.00";

    return { ...totals, avgCtr, avgCpc, totalRoas };
  };

  const getPlatformPerformance = () => {
    const platformData: any = {};
    
    performance.forEach((p) => {
      if (!platformData[p.platform]) {
        platformData[p.platform] = {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      
      platformData[p.platform].impressions += p.impressions || 0;
      platformData[p.platform].clicks += p.clicks || 0;
      platformData[p.platform].spend += parseFloat(p.spend) || 0;
      platformData[p.platform].conversions += p.conversions || 0;
      platformData[p.platform].revenue += parseFloat(p.revenue) || 0;
    });

    return Object.entries(platformData).map(([platform, data]: [string, any]) => ({
      platform,
      ...data,
      ctr: data.clicks > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0.00",
      roas: data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : "0.00",
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  const totals = calculateTotals();
  const platformPerformance = getPlatformPerformance();
  const isDemoData = performance.length > 0 && performance[0].is_demo;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/20 bg-black">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <video
              src="/xiXoiLogo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-xl md:text-2xl font-bold text-white">Campaign Analytics</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Demo Data Banner */}
          {isDemoData && (
            <div className="border-2 border-foreground p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Demo Mode - Simulated Data</h3>
                <p className="text-sm">
                  This dashboard displays simulated performance metrics for demonstration purposes. 
                  To view real campaign data, connect your Meta, TikTok, Google, LinkedIn, and X accounts 
                  in Settings and publish your campaign to these platforms.
                </p>
              </div>
            </div>
          )}

          {/* ELITE: Auto-Optimizer Toggle */}
          {userPlan === 'elite' && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Auto-Optimizer</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-1">Automatically pause losers, scale winners</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoOptimize} 
                      onChange={(e) => {
                        setAutoOptimize(e.target.checked);
                        toast({
                          title: e.target.checked ? "Auto-Optimizer enabled" : "Auto-Optimizer disabled",
                          description: e.target.checked 
                            ? "Campaigns will be automatically optimized based on performance" 
                            : "Manual optimization only"
                        });
                      }} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* Campaign Info */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{campaign?.name || "Campaign"}</h2>
            <p className="text-muted-foreground mt-2">
              Performance overview • Last 7 days
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{totals.avgCtr}% CTR</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">${totals.spend.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">${totals.avgCpc} avg CPC</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{totals.totalRoas}x</div>
                <p className="text-xs text-muted-foreground">${totals.revenue.toFixed(2)} revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformPerformance.map((p) => (
                  <div key={p.platform} className="border-b border-foreground/10 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold uppercase text-sm">{p.platform}</span>
                      <span className="text-sm text-muted-foreground">{p.roas}x ROAS</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Impressions</div>
                        <div className="font-medium">{p.impressions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Clicks</div>
                        <div className="font-medium">{p.clicks.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">CTR</div>
                        <div className="font-medium">{p.ctr}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Spend</div>
                        <div className="font-medium">${p.spend.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Revenue</div>
                        <div className="font-medium">${p.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
