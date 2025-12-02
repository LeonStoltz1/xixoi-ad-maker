import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Clock, XCircle, TrendingUp, Eye, DollarSign, MousePointerClick, Activity } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: string;
  is_active: boolean;
  daily_budget: number | null;
  lifetime_budget: number | null;
  total_spent: number;
  created_at: string;
  end_date: string | null;
}

interface PublishQueueStatus {
  id: string;
  platform: string;
  status: string;
  queue_position: number | null;
  estimated_start_time: string | null;
  error_message: string | null;
  created_at: string;
}

interface PerformanceMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
}

export default function CampaignStatus() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [publishQueue, setPublishQueue] = useState<PublishQueueStatus[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    loadCampaignData();

    // Set up real-time subscription for publish queue
    const channel = supabase
      .channel('campaign_publish_status')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_start_publish_queue',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          loadPublishQueue();
        }
      )
      .subscribe();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadPublishQueue();
      loadPerformance();
    }, 10000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!campaignId) return;

    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      await loadPublishQueue();
      await loadPerformance();
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const loadPublishQueue = async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from('quick_start_publish_queue')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    setPublishQueue(data || []);
  };

  const loadPerformance = async () => {
    if (!campaignId) return;

    const { data } = await supabase
      .from('campaign_performance')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (data && data.length > 0) {
      const totals = data.reduce(
        (acc, curr) => ({
          spend: acc.spend + (curr.spend || 0),
          impressions: acc.impressions + (curr.impressions || 0),
          clicks: acc.clicks + (curr.clicks || 0),
          conversions: acc.conversions + (curr.conversions || 0),
        }),
        { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
      );

      setPerformance({
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      });
    }
  };

  const getPublishStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'publishing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'live':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getPublishStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      case 'publishing':
        return <Badge className="bg-blue-500">Publishing</Badge>;
      case 'live':
        return <Badge className="bg-green-500">Live</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout title="Campaign Status" showBack backTo="/dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout title="Campaign Status" showBack backTo="/dashboard">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  const hasLiveAds = publishQueue.some(q => q.status === 'live');
  const hasPublishingAds = publishQueue.some(q => q.status === 'publishing' || q.status === 'queued');

  return (
    <AppLayout title="Campaign Status" showBack backTo="/dashboard">
      <div className="space-y-6">
        {/* Campaign Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={campaign.is_active ? "default" : "secondary"}>
                    {campaign.is_active ? "Active" : "Paused"}
                  </Badge>
                  <Badge variant="outline">
                    {campaign.status || "draft"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/analytics/${campaignId}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Full Analytics
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Publishing Status */}
        {publishQueue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publishing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publishQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getPublishStatusIcon(item.status)}
                      <div>
                        <p className="font-medium capitalize">{item.platform}</p>
                        {item.status === 'queued' && item.queue_position && (
                          <p className="text-sm text-muted-foreground">
                            Position #{item.queue_position} in queue
                            {item.estimated_start_time && (
                              <> • Starts in ~{Math.max(0, Math.floor((new Date(item.estimated_start_time).getTime() - Date.now()) / 1000 / 60))}m</>
                            )}
                          </p>
                        )}
                        {item.status === 'publishing' && (
                          <p className="text-sm text-muted-foreground">
                            Publishing to platform...
                          </p>
                        )}
                        {item.status === 'live' && (
                          <p className="text-sm text-green-600">
                            Ad is live and running
                          </p>
                        )}
                        {item.status === 'failed' && item.error_message && (
                          <p className="text-sm text-red-600">
                            {item.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    {getPublishStatusBadge(item.status)}
                  </div>
                ))}
              </div>
              
              {hasPublishingAds && (
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    Your ad is being published in safe batches. This typically takes 30-60 seconds.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        {hasLiveAds && performance && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Spend (7d)</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${performance.spend.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{performance.impressions.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Clicks</p>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{performance.clicks.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">CTR</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{performance.ctr.toFixed(2)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">CPC</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${performance.cpc.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{performance.conversions}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Daily Budget</p>
                <p className="text-xl font-semibold">
                  ${campaign.daily_budget?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lifetime Budget</p>
                <p className="text-xl font-semibold">
                  ${campaign.lifetime_budget?.toFixed(2) || 'Unlimited'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-xl font-semibold">
                  ${campaign.total_spent.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {publishQueue.length === 0 && !hasLiveAds && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                This campaign hasn't been published yet.
              </p>
              <Button onClick={() => navigate(`/campaign-publish/${campaignId}`)}>
                Publish Campaign
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
