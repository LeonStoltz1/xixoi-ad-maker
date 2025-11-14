import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Crown, Settings, Home, CreditCard, Zap, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealTimeROIDashboard } from "@/components/RealTimeROIDashboard";
import { PerformanceAlerts } from "@/components/PerformanceAlerts";
import { AISupportChat } from "@/components/AISupportChat";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [campaigns, setCampaigns] = useState<any[]>([]);
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
      
      {/* Header */}
      <header className="border-b border-foreground/20 bg-black">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <video 
                src="/xiXoiLogo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-xl md:text-2xl font-bold text-white">xiXoi™</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => navigate("/")}
                className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button 
                onClick={() => navigate("/dashboard")}
                className="text-white font-medium flex items-center gap-2"
              >
                Campaigns
              </button>
              <button 
                onClick={() => navigate("/#pricing")}
                className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pricing
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <div className={`px-4 py-2 rounded-full border ${
              userPlan !== 'free'
                ? 'bg-white/10 border-white/30 text-white' 
                : 'bg-white/5 border-white/20 text-white/70'
            } flex items-center gap-2`}>
              {userPlan !== 'free' && <Crown className="w-4 h-4" />}
              <span className="text-sm font-medium uppercase">
                {userPlan === 'pro' ? 'Pro' : userPlan === 'elite' ? 'Elite' : userPlan === 'agency' ? 'Agency' : 'Free'}
              </span>
            </div>
            
            {/* Manage Subscription Button for paid users */}
            {userPlan !== 'free' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={openCustomerPortal}
                className="text-white hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="text-white hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
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
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>
                      <span className={`text-xs uppercase font-bold ${
                        campaign.status === 'ready' ? 'text-green-600' : 
                        campaign.status === 'draft' ? 'text-yellow-600' : 
                        'text-muted-foreground'
                      }`}>
                        {campaign.status}
                      </span>
                    </CardDescription>
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
                            onClick={() => navigate(`/analytics/${campaign.id}`)}
                            className="flex-1"
                          >
                            Analytics
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
    </div>
  );
}
