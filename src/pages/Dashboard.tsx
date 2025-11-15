import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Crown, Settings, Home, CreditCard, Zap, Wallet, Pause, Play, AlertTriangle, Trash2, Pencil, StopCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RealTimeROIDashboard } from "@/components/RealTimeROIDashboard";
import { PerformanceAlerts } from "@/components/PerformanceAlerts";
import { AISupportChat } from "@/components/AISupportChat";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BudgetManager } from "@/components/BudgetManager";
import { GlobalSpendOverview } from "@/components/GlobalSpendOverview";
import { CampaignCard } from "@/components/CampaignCard";
import { GlobalCampaignActions } from "@/components/GlobalCampaignActions";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pausingCampaigns, setPausingCampaigns] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgROAS: number;
  } | null>(null);
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
      await loadCampaigns(session.user.id);

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

  const loadCampaigns = async (userId: string) => {
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select(`
        *, 
        ad_variants(count),
        campaign_assets(asset_url, asset_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (campaignsData) {
      setCampaigns(campaignsData);
      
      // Fetch aggregated metrics if user has multiple campaigns
      if (campaignsData.length > 1) {
          const campaignIds = campaignsData.map(c => c.id);
          const { data: performanceData } = await supabase
            .from('campaign_performance')
            .select('spend, impressions, clicks, conversions, roas')
            .in('campaign_id', campaignIds);

          if (performanceData && performanceData.length > 0) {
            const totals = performanceData.reduce((acc, curr) => ({
              totalSpend: acc.totalSpend + (curr.spend || 0),
              totalImpressions: acc.totalImpressions + (curr.impressions || 0),
              totalClicks: acc.totalClicks + (curr.clicks || 0),
              totalConversions: acc.totalConversions + (curr.conversions || 0),
              avgROAS: acc.avgROAS + (curr.roas || 0),
            }), {
              totalSpend: 0,
              totalImpressions: 0,
              totalClicks: 0,
              totalConversions: 0,
              avgROAS: 0,
            });
            
            totals.avgROAS = totals.avgROAS / performanceData.length;
            setAggregatedMetrics(totals);
          }
        }
      }
  };

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
      if (user) {
        await loadCampaigns(user.id);
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

  const handleDeleteClick = (campaignId: string) => {
    setDeletingCampaignId(campaignId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaignId) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', deletingCampaignId);

      if (error) throw error;

      toast({
        title: 'Campaign deleted',
        description: 'Your campaign and all associated data have been removed',
      });

      // Refresh campaigns
      if (user) {
        await loadCampaigns(user.id);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingCampaignId(null);
    }
  };

  const handleEditClick = async (campaign: any) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    
    // Get the campaign asset description
    const { data: assets } = await supabase
      .from('campaign_assets')
      .select('asset_text')
      .eq('campaign_id', campaign.id)
      .single();
    
    setEditDescription(assets?.asset_text || '');
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editingCampaign || !editName.trim()) {
      toast({
        title: 'Error',
        description: 'Campaign name is required',
        variant: 'destructive',
      });
      return;
    }

    setSavingEdit(true);
    try {
      // Update campaign name
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ name: editName.trim() })
        .eq('id', editingCampaign.id);

      if (campaignError) throw campaignError;

      // Update campaign asset description if it exists
      if (editDescription.trim()) {
        const { error: assetError } = await supabase
          .from('campaign_assets')
          .update({ asset_text: editDescription.trim() })
          .eq('campaign_id', editingCampaign.id);

        if (assetError) throw assetError;
      }

      toast({
        title: 'Campaign updated',
        description: 'Your campaign has been updated successfully',
      });

      // Refresh campaigns
      if (user) {
        await loadCampaigns(user.id);
      }

      setShowEditDialog(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    } finally {
      setSavingEdit(false);
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Your Campaigns</h2>
                <p className="text-muted-foreground mt-2">Create and manage your ad campaigns</p>
              </div>
            </div>
            <div className="flex gap-2">
              <GlobalCampaignActions
                campaignCount={campaigns.length}
                activeCampaignCount={campaigns.filter(c => c.status === 'active').length}
                onUpdate={() => user && loadCampaigns(user.id)}
              />
              {campaigns.length > 1 && (
                <BudgetManager 
                  campaigns={campaigns} 
                  onBudgetUpdate={() => user && loadCampaigns(user.id)} 
                />
              )}
              <Button size="lg" onClick={() => navigate("/create-campaign")}>
                <Plus className="w-5 h-5 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>

          {/* Global Spend Overview */}
          <GlobalSpendOverview />

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

          {/* Performance Alerts */}
          <PerformanceAlerts />

          {/* Real-time ROI Dashboard */}
          {campaigns.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Performance Insights</h3>
              <RealTimeROIDashboard />
            </div>
          )}

          {/* Aggregated Metrics - Show when user has multiple campaigns */}
          {campaigns.length > 1 && aggregatedMetrics && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-xl">Overall Performance</CardTitle>
                <CardDescription>Aggregated metrics across all your active campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    <p className="text-2xl font-bold">${aggregatedMetrics.totalSpend.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">{aggregatedMetrics.totalImpressions.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{aggregatedMetrics.totalClicks.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{aggregatedMetrics.totalConversions.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg ROAS</p>
                    <p className="text-2xl font-bold">{aggregatedMetrics.avgROAS.toFixed(2)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              {campaigns.map((campaign) => {
                const thumbnail = campaign.campaign_assets?.[0];
                return (
                  <Card 
                    key={campaign.id} 
                    className="border-2 overflow-hidden transition-all border-foreground"
                  >
                    {thumbnail && (
                      <div className="relative h-48 w-full bg-muted">
                        {thumbnail.asset_type === 'video' ? (
                          <video 
                            src={thumbnail.asset_url} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={thumbnail.asset_url} 
                            alt={campaign.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={
                              campaign.status === 'active' ? 'bg-green-500' :
                              campaign.status === 'paused' ? 'bg-yellow-500' :
                              campaign.status === 'completed' ? 'bg-gray-500' :
                              campaign.status === 'draft' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }>
                              {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || 'Draft'}
                            </Badge>
                            {campaign.status_reason && (
                              <span className="text-xs text-muted-foreground">
                                ({campaign.status_reason.replace(/_/g, ' ')})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(campaign)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(campaign.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Budget Display */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Daily Budget</p>
                          <p className="text-lg font-bold">${campaign.daily_budget?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                          <p className="text-lg font-bold">${campaign.total_spent?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Created: {new Date(campaign.created_at).toLocaleDateString()}</div>
                        {campaign.target_location && (
                          <div>Location: {campaign.target_location}</div>
                        )}
                        {!campaign.is_active && campaign.paused_reason && (
                          <div className="text-orange-600 flex items-start gap-1 mt-2">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="text-xs">{campaign.paused_reason}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {campaign.status === 'draft' ? (
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/targeting/${campaign.id}`)}
                            className="w-full"
                          >
                            Continue Setup
                          </Button>
                        ) : (
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
                            
                            {/* Budget Controls Dropdown */}
                            {campaign.daily_budget && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Adjust Budget</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={async () => {
                                    const newBudget = campaign.daily_budget * 2;
                                    const { error } = await supabase
                                      .from('campaigns')
                                      .update({ daily_budget: newBudget, updated_at: new Date().toISOString() })
                                      .eq('id', campaign.id);
                                    if (!error) {
                                      toast({ title: `Budget doubled to $${newBudget.toFixed(2)}` });
                                      user && loadCampaigns(user.id);
                                    }
                                  }}>
                                    Double Budget
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => {
                                    const newBudget = campaign.daily_budget * 1.2;
                                    const { error } = await supabase
                                      .from('campaigns')
                                      .update({ daily_budget: newBudget, updated_at: new Date().toISOString() })
                                      .eq('id', campaign.id);
                                    if (!error) {
                                      toast({ title: `Budget increased to $${newBudget.toFixed(2)}` });
                                      user && loadCampaigns(user.id);
                                    }
                                  }}>
                                    +20% Budget
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => {
                                    const newBudget = campaign.daily_budget * 0.8;
                                    const { error } = await supabase
                                      .from('campaigns')
                                      .update({ daily_budget: newBudget, updated_at: new Date().toISOString() })
                                      .eq('id', campaign.id);
                                    if (!error) {
                                      toast({ title: `Budget reduced to $${newBudget.toFixed(2)}` });
                                      user && loadCampaigns(user.id);
                                    }
                                  }}>
                                    -20% Budget
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            {/* Stop Campaign Button */}
                            {campaign.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:text-red-600"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('campaigns')
                                    .update({ 
                                      status: 'completed',
                                      status_reason: 'user_stopped',
                                      end_date: new Date().toISOString(),
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('id', campaign.id);
                                  if (!error) {
                                    toast({ title: 'Campaign stopped' });
                                    user && loadCampaigns(user.id);
                                  }
                                }}
                              >
                                <StopCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete your campaign and remove all associated data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Campaign assets and ad variants</li>
                <li>Performance data and analytics history</li>
                <li>Campaign channels and platform connections</li>
              </ul>
              <p className="font-semibold text-orange-600 mt-4">
                ⚠️ Warning: Your overall analytics and historical data will be affected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign name and description. Note: Changing the description will require regenerating targeting suggestions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Campaign Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Campaign Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter your product/service description"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about your product, features, pricing, and target audience. Avoid discriminatory or illegal content.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={savingEdit || !editName.trim()}
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
