import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Crown, Settings, Home, CreditCard, Zap, Wallet, Pause, Play, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealTimeROIDashboard } from "@/components/RealTimeROIDashboard";
import { PerformanceAlerts } from "@/components/PerformanceAlerts";
import { AISupportChat } from "@/components/AISupportChat";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pausingCampaigns, setPausingCampaigns] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCheckoutSession, openCustomerPortal, loading: stripeLoading } = useStripeCheckout();

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user profile to get plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserPlan(profile.plan || 'free');
      }

      // Fetch user campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*, ad_variants(count)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData);
      }

      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePauseResumeCampaign = async (campaignId: string, currentlyActive: boolean) => {
    setPausingCampaigns(prev => new Set(prev).add(campaignId));

    try {
      const { data, error } = await supabase.functions.invoke('pause-resume-campaign', {
        body: {
          campaignId,
          action: currentlyActive ? 'pause' : 'resume',
          reason: currentlyActive ? 'Manually paused by user' : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: currentlyActive ? 'Campaign paused' : 'Campaign resumed',
        description: `Campaign has been ${currentlyActive ? 'paused' : 'resumed'} successfully`,
      });

      // Refresh campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*, ad_variants(count)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error pausing/resuming campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      });
    } finally {
      setPausingCampaigns(prev => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AISupportChat />
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 mt-32">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Your Campaigns</h2>
              <p className="text-muted-foreground mt-2">Create and manage your ad campaigns</p>
            </div>
            <Button size="lg" onClick={() => navigate("/create-campaign")}>
              <Plus className="w-5 h-5 mr-2" />
              New Campaign
            </Button>
          </div>

          {/* Add Ad Budget Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold">Reload Ad Budget</h3>
                <p className="text-sm md:text-base opacity-90">
                  Add funds in 60 seconds. $5 service fee per reload. Ads go live instantly.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/add-ad-budget")}
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 whitespace-nowrap"
              >
                <Zap className="w-5 h-5 mr-2" />
                Add Ad Budget
              </Button>
            </div>
          </div>

          {/* Campaigns List or Empty State */}
          {campaigns.length === 0 ? (
            <div className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold">No campaigns yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first campaign and let xiXoi™ generate stunning ads instantly
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/create-campaign")}>
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-2 border-foreground">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs uppercase font-bold ${
                            campaign.status === 'ready' ? 'text-green-600' : 
                            campaign.status === 'draft' ? 'text-yellow-600' : 
                            'text-muted-foreground'
                          }`}>
                            {campaign.status}
                          </span>
                          {campaign.status === 'ready' && (
                            <span className={`text-xs uppercase font-bold flex items-center gap-1 ${
                              campaign.is_active ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {campaign.is_active ? (
                                <>
                                  <Play className="w-3 h-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Pause className="w-3 h-3" />
                                  Paused
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Created: {new Date(campaign.created_at).toLocaleDateString()}</div>
                      {campaign.target_location && (
                        <div>Location: {campaign.target_location}</div>
                      )}
                      {campaign.daily_budget && (
                        <div>Budget: ${campaign.daily_budget}/day</div>
                      )}
                      {!campaign.is_active && campaign.paused_reason && (
                        <div className="text-orange-600 flex items-start gap-1 mt-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="text-xs">{campaign.paused_reason}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {campaign.status === 'ready' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/ad-published/${campaign.id}?paid=${!campaign.has_watermark}`)}
                            className="flex-1"
                          >
                            View Ad
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/analytics/${campaign.id}`)}
                            className="flex-1"
                          >
                            Analytics
                          </Button>
                          <Button
                            size="sm"
                            variant={campaign.is_active ? "destructive" : "default"}
                            onClick={() => handlePauseResumeCampaign(campaign.id, campaign.is_active)}
                            disabled={pausingCampaigns.has(campaign.id)}
                          >
                            {pausingCampaigns.has(campaign.id) ? (
                              '...'
                            ) : campaign.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
