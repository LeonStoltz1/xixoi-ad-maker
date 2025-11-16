import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  PlusCircle, 
  TrendingUp, 
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye
} from "lucide-react";
import { usePolitical } from "@/contexts/PoliticalContext";
import { supabase } from "@/integrations/supabase/client";
import type { PoliticalAd } from "@/types/political";

export default function PoliticalDashboard() {
  const navigate = useNavigate();
  const { politicalProfile } = usePolitical();
  const [ads, setAds] = useState<PoliticalAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('political_ads')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database response to PoliticalAd type
      const mappedAds: PoliticalAd[] = (data || []).map(ad => ({
        id: ad.id,
        userId: ad.user_id,
        candidateId: ad.candidate_id,
        campaignId: ad.campaign_id,
        adCopy: ad.ad_copy,
        imageUrl: ad.image_url,
        platform: ad.platform,
        watermarkUrl: ad.watermark_url,
        signatureBase58: ad.signature_base58,
        policyFocus: ad.policy_focus,
        tone: ad.tone,
        published: ad.published,
        publishedAt: ad.published_at,
        complianceChecked: ad.compliance_checked,
        complianceIssues: ad.compliance_issues as any,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at
      }));
      
      setAds(mappedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!politicalProfile?.hasPoliticalTier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Political Tier Required</h2>
          <p className="text-muted-foreground mb-6">
            Access to the Political Dashboard requires the $99/month Political tier subscription.
          </p>
          <Button onClick={() => navigate('/pricing')}>View Pricing</Button>
        </Card>
      </div>
    );
  }

  const publishedAds = ads.filter(ad => ad.published);
  const draftAds = ads.filter(ad => !ad.published);
  const compliantAds = ads.filter(ad => ad.complianceChecked);
  const usagePercentage = (politicalProfile.adsUsed / politicalProfile.adsLimit) * 100;

  // Platform distribution
  const platformCounts = ads.reduce((acc, ad) => {
    acc[ad.platform] = (acc[ad.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Political Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your political advertising campaigns
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/political/generate')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate New Ad
          </Button>
        </div>

        {/* Candidate Info */}
        {politicalProfile.candidate && (
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{politicalProfile.candidate.fullName}</h2>
                <p className="text-muted-foreground">{politicalProfile.candidate.race}</p>
                <p className="text-sm text-muted-foreground">
                  {politicalProfile.candidate.party} • {politicalProfile.candidate.electionYear}
                </p>
              </div>
              <Badge variant={politicalProfile.candidate.approved ? "default" : "secondary"}>
                {politicalProfile.candidate.approved ? "Verified" : "Pending"}
              </Badge>
            </div>
          </Card>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ads</p>
                <p className="text-2xl font-bold">{ads.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{publishedAds.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{draftAds.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold">{compliantAds.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Usage */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Monthly Usage</h3>
                <p className="text-sm text-muted-foreground">
                  {politicalProfile.adsUsed} of {politicalProfile.adsLimit} ads generated this month
                </p>
              </div>
              <Badge variant={usagePercentage >= 90 ? "destructive" : "default"}>
                {Math.round(usagePercentage)}% Used
              </Badge>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {usagePercentage >= 90 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">
                  You're approaching your monthly limit. Ads reset on the 1st of each month.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Platform Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Platform Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['meta', 'google', 'tiktok', 'linkedin', 'x'].map(platform => (
              <div key={platform} className="text-center p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground capitalize mb-2">{platform}</p>
                <p className="text-2xl font-bold">{platformCounts[platform] || 0}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Ads */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Recent Political Ads</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/political/generate')}>
              View All
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading ads...</p>
          ) : ads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No political ads yet</p>
              <Button onClick={() => navigate('/political/generate')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Political Ad
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.slice(0, 5).map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {ad.imageUrl && (
                    <img
                      src={ad.imageUrl}
                      alt="Ad preview"
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{ad.adCopy.substring(0, 100)}...</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {ad.platform}
                          </Badge>
                          {ad.policyFocus && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {ad.policyFocus}
                            </Badge>
                          )}
                          {ad.complianceChecked && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Compliant
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ad.published ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(ad.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
