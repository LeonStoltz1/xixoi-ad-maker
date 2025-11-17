import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AISupportChat } from "@/components/AISupportChat";
import { usePolitical } from "@/contexts/PoliticalContext";
import { GlobalSpendSummary } from "@/components/GlobalSpendSummary";
import { EnhancedCampaignCard } from "@/components/EnhancedCampaignCard";
import { CampaignAIRecommendations } from "@/components/CampaignAIRecommendations";
import { AccountPerformanceInsights } from "@/components/AccountPerformanceInsights";
import { getCampaignPerformance, CampaignPerformanceMetrics } from "@/utils/campaignPerformance";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CampaignContactSection } from "@/components/CampaignContactSection";
import { detectContactInfo, removeContactInfo } from "@/utils/contactDetection";

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
  paused_reason?: string | null;
  primary_goal?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  landing_url?: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<Record<string, CampaignPerformanceMetrics>>({});
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrimaryGoal, setEditPrimaryGoal] = useState<string | null>(null);
  const [editContactPhone, setEditContactPhone] = useState<string | null>(null);
  const [editContactEmail, setEditContactEmail] = useState<string | null>(null);
  const [editLandingUrl, setEditLandingUrl] = useState<string | null>(null);
  const [detectedContact, setDetectedContact] = useState<{ phone?: string; email?: string } | null>(null);
  const [showContactDetection, setShowContactDetection] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { politicalProfile } = usePolitical();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
        loadCampaigns(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadCampaigns(session.user.id);
    setLoading(false);
  };

  const loadCampaigns = async (userId: string) => {
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (campaignsData) {
      setCampaigns(campaignsData);

      // Load performance for each campaign
      const performancePromises = campaignsData.map(async (campaign) => {
        const perf = await getCampaignPerformance(campaign.id);
        return { id: campaign.id, perf };
      });

      const performances = await Promise.all(performancePromises);
      const perfMap: Record<string, CampaignPerformanceMetrics> = {};
      performances.forEach(({ id, perf }) => {
        perfMap[id] = perf;
      });

      setCampaignPerformance(perfMap);
    }
  };

  const handleUpdate = () => {
    if (user) {
      loadCampaigns(user.id);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleEditClick = async (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditPrimaryGoal(campaign.primary_goal || null);
    setEditContactPhone(campaign.contact_phone || null);
    setEditContactEmail(campaign.contact_email || null);
    setEditLandingUrl(campaign.landing_url || null);
    
    const { data: assets } = await supabase
      .from('campaign_assets')
      .select('asset_text')
      .eq('campaign_id', campaign.id)
      .single();
    
    const description = assets?.asset_text || '';
    setEditDescription(description);
    
    if (description) {
      const detected = detectContactInfo(description);
      if (detected.phone || detected.email) {
        setDetectedContact(detected);
        setShowContactDetection(true);
      }
    }
    
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
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          name: editName.trim(),
          primary_goal: editPrimaryGoal,
          contact_phone: editContactPhone?.trim() || null,
          contact_email: editContactEmail?.trim() || null,
          landing_url: editLandingUrl?.trim() || null,
        })
        .eq('id', editingCampaign.id);

      if (campaignError) throw campaignError;

      if (editDescription.trim()) {
        await supabase
          .from('campaign_assets')
          .update({ asset_text: editDescription.trim() })
          .eq('campaign_id', editingCampaign.id);
      }

      toast({
        title: 'Campaign updated',
        description: 'Your campaign has been updated successfully',
      });

      handleUpdate();
      setShowEditDialog(false);
      setEditingCampaign(null);
      setShowContactDetection(false);
      setDetectedContact(null);
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

      <main className="container mx-auto px-6 py-12 mt-32">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Your Campaigns</h2>
              <p className="text-muted-foreground mt-1">
                Money-first view of your ad performance
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/create-campaign")}>
              <Plus className="w-5 h-5 mr-2" />
              New Campaign
            </Button>
          </div>

          {/* SECTION 1: Global Spend Summary */}
          <GlobalSpendSummary key={refreshKey} />

          {/* POLITICAL MODE HIDDEN - Re-enable later for launch */}
          {/* {politicalProfile?.hasPoliticalTier && (
            <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Political Ad System</h3>
                  <p className="text-muted-foreground mb-4">
                    {politicalProfile.adsUsed} of {politicalProfile.adsLimit} political ads generated this month
                  </p>
                  {politicalProfile.candidate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong>{politicalProfile.candidate.fullName}</strong> • {politicalProfile.candidate.race}
                    </p>
                  )}
                </div>
                <Button onClick={() => navigate('/political/dashboard')}>
                  View Political Dashboard
                </Button>
              </div>
            </div>
          )} */}

          {/* SECTION 2: Campaign Cards */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Campaigns</h3>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Button onClick={() => navigate("/create-campaign")}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="space-y-4">
                    <EnhancedCampaignCard
                      key={`card-${campaign.id}`}
                      campaign={campaign}
                      performance={campaignPerformance[campaign.id] || {
                        spendToday: 0,
                        spendThisMonth: 0,
                        ctr: 0,
                        cpm: 0,
                        cpc: 0,
                        roas: null,
                      }}
                      onUpdate={handleUpdate}
                      onEdit={handleEditClick}
                      onViewAnalytics={(id) => navigate(`/campaign-analytics?id=${id}`)}
                    />
                    
                    {/* AI Recommendations per campaign */}
                    {campaignPerformance[campaign.id] && (
                      <CampaignAIRecommendations
                        key={`recommendations-${campaign.id}`}
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                        performance={campaignPerformance[campaign.id]}
                        budget={{
                          daily: campaign.daily_budget || 0,
                          remaining: campaign.lifetime_budget 
                            ? campaign.lifetime_budget - campaign.total_spent 
                            : null,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Account Performance Insights */}
          {campaigns.length > 0 && <AccountPerformanceInsights key={refreshKey} />}
        </div>
      </main>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign details and contact information
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
            </div>

            {showContactDetection && detectedContact && (
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-3">
                  <div>
                    <p className="font-semibold">Contact information detected</p>
                    {detectedContact.phone && <p className="text-sm">Phone: {detectedContact.phone}</p>}
                    {detectedContact.email && <p className="text-sm">Email: {detectedContact.email}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (detectedContact.phone) {
                          setEditContactPhone(detectedContact.phone);
                          setEditPrimaryGoal('calls');
                        } else if (detectedContact.email) {
                          setEditContactEmail(detectedContact.email);
                          setEditPrimaryGoal('email');
                        }
                        setEditDescription(removeContactInfo(editDescription, detectedContact));
                        setShowContactDetection(false);
                      }}
                    >
                      Move to CTA
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowContactDetection(false)}>
                      Keep in text
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <CampaignContactSection
                primaryGoal={editPrimaryGoal}
                contactPhone={editContactPhone}
                contactEmail={editContactEmail}
                landingUrl={editLandingUrl}
                onPrimaryGoalChange={setEditPrimaryGoal}
                onContactPhoneChange={setEditContactPhone}
                onContactEmailChange={setEditContactEmail}
                onLandingUrlChange={setEditLandingUrl}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={savingEdit || !editName.trim()}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
