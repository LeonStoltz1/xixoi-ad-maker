import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { 
  Pause,
  Play, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Copy, 
  Pencil, 
  StopCircle,
  AlertTriangle,
  Zap,
  X,
  Save,
  Trash2,
  Rocket,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

interface CampaignPerformance {
  spendToday: number;
  spendThisMonth: number;
  ctr: number;
  cpm: number;
  cpc: number;
  roas: number | null;
}

interface AdVariant {
  id: string;
  headline: string | null;
  body_copy: string | null;
  cta_text: string | null;
  creative_url: string | null;
  variant_type: string;
  predicted_roas: number | null;
}

interface EnhancedCampaignCardProps {
  campaign: Campaign;
  performance: CampaignPerformance;
  onUpdate: () => void;
  onEdit: (campaign: Campaign) => void;
  onViewAnalytics: (campaignId: string) => void;
}

export function EnhancedCampaignCard({
  campaign,
  performance,
  onUpdate,
  onEdit,
  onViewAnalytics,
}: EnhancedCampaignCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<AdVariant | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState("");
  const [editedBodyCopy, setEditedBodyCopy] = useState("");
  const [editedCtaText, setEditedCtaText] = useState("");
  const [savingAd, setSavingAd] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [hasWatermark, setHasWatermark] = useState(false);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [adToDelete, setAdToDelete] = useState<AdVariant | null>(null);
  const [complianceViolations, setComplianceViolations] = useState<Array<{platform: string, issue: string}>>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(false);
  const [checkingPublishStatus, setCheckingPublishStatus] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiSuggestedCopy, setAiSuggestedCopy] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  // Character limits for each platform
  const platformLimits: Record<string, number> = {
    meta: 125,
    linkedin: 150,
    tiktok: 100,
    google: 90
  };

  // Get the strictest character limit based on selected platforms
  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 90; // Default to Google's strictest limit
    const limits = selectedPlatforms
      .map(platform => platformLimits[platform])
      .filter(limit => limit !== undefined);
    return limits.length > 0 ? Math.min(...limits) : 90;
  };

  const characterLimit = getCharacterLimit();
  const characterCount = editedBodyCopy.length;
  const isOverLimit = characterCount > characterLimit;
  const isNearLimit = characterCount > characterLimit * 0.9;

  useEffect(() => {
    loadAdVariants();
    loadUserPlanAndWatermark();
    loadWalletBalance();
    loadCampaignPlatforms();
  }, [campaign.id]);

  useEffect(() => {
    if (selectedVariant) {
      checkIfPublished(selectedVariant.id);
    }
  }, [selectedVariant]);

  const loadWalletBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet } = await supabase
        .from("ad_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setWalletBalance(wallet?.balance || 0);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    }
  };

  const loadCampaignPlatforms = async () => {
    try {
      const { data: channels } = await supabase
        .from("campaign_channels")
        .select("channel")
        .eq("campaign_id", campaign.id);

      if (channels) {
        setSelectedPlatforms(channels.map(c => c.channel));
      }
    } catch (error) {
      console.error("Error loading campaign platforms:", error);
      setSelectedPlatforms([]); // Default to empty, will use strictest limit
    }
  };

  const generateAICopy = async () => {
    if (!editedBodyCopy.trim()) {
      toast({
        variant: "destructive",
        title: "No copy to rewrite",
        description: "Please enter some ad copy first"
      });
      return;
    }

    setIsGeneratingAI(true);
    setShowAISuggestion(false);
    
    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'rewrite-ad-copy',
        {
          originalCopy: editedBodyCopy,
          characterLimit,
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['meta', 'google', 'tiktok', 'linkedin'],
          creativeUrl: selectedVariant?.creative_url || null
        },
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      if (error) {
        // Handle rate limit and credits exhausted errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Rate limit reached",
            description: "AI service temporarily unavailable. Please try again in a moment."
          });
          return;
        } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
          toast({
            variant: "destructive",
            title: "Credits exhausted",
            description: "AI service credits exhausted. Please contact support at support@xixoi.com"
          });
          return;
        }
        throw error;
      }

      if (data?.error) {
        toast({
          variant: "destructive",
          title: "AI generation failed",
          description: data.error
        });
        return;
      }

      setAiSuggestedCopy(data.rewrittenCopy);
      setShowAISuggestion(true);
      
      toast({
        title: "✨ AI copy generated",
        description: selectedVariant?.creative_url 
          ? "AI analyzed your image/video and optimized the copy"
          : "Review the suggestion and choose which version to use"
      });
    } catch (error) {
      console.error('Error generating AI copy:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate AI copy",
        description: "Please try again"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const useAICopy = () => {
    setEditedBodyCopy(aiSuggestedCopy);
    setShowAISuggestion(false);
    toast({
      title: "AI copy applied",
      description: "You can continue editing or save the changes"
    });
  };

  const checkIfPublished = async (variantId: string) => {
    setCheckingPublishStatus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: freeAd } = await supabase
        .from("free_ads")
        .select("id, published_at")
        .eq("ad_variant_id", variantId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsPublished(!!freeAd?.published_at);
    } catch (error) {
      setIsPublished(false);
    } finally {
      setCheckingPublishStatus(false);
    }
  };

  const loadAdVariants = async () => {
    const { data } = await supabase
      .from('ad_variants')
      .select('*')
      .eq('campaign_id', campaign.id)
      .limit(3);
    
    if (data) {
      setAdVariants(data);
    }
  };

  const loadUserPlanAndWatermark = async () => {
    // Load user's plan
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserPlan(profile.plan);
      }
    }

    // Load campaign watermark status
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('has_watermark')
      .eq('id', campaign.id)
      .single();
    
    if (campaignData) {
      setHasWatermark(campaignData.has_watermark ?? false);
    }
  };

  const handleEditAd = () => {
    if (selectedVariant) {
      setEditedHeadline(selectedVariant.headline || "");
      setEditedBodyCopy(selectedVariant.body_copy || "");
      setEditedCtaText(selectedVariant.cta_text || "");
      setComplianceViolations([]);
      setIsEditingAd(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingAd(false);
    setEditedHeadline("");
    setEditedBodyCopy("");
    setEditedCtaText("");
    setComplianceViolations([]);
  };

  const handleSaveAd = async () => {
    if (!selectedVariant) return;

    setSavingAd(true);
    try {
      // First, run AI moderation check on the edited content
      toast({
        title: "Validating content...",
        description: "Checking ad against platform policies",
      });

      const { data: moderationResult, error: moderationError } = await invokeWithRetry(
        supabase,
        'moderate-ad-content',
        {
          campaignId: campaign.id,
          platforms: ['meta', 'tiktok', 'google', 'linkedin', 'x'],
          adContent: {
            headline: editedHeadline.trim(),
            body_copy: editedBodyCopy.trim(),
            cta_text: editedCtaText.trim(),
          }
        },
        { maxRetries: 2, initialDelayMs: 1000 }
      );
      
      if (moderationError) {
        // Handle rate limit and credits exhausted errors
        if (moderationError.message?.includes('429') || moderationError.message?.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Rate limit reached",
            description: "Content moderation temporarily unavailable. Please try again in a moment."
          });
          return;
        } else if (moderationError.message?.includes('402') || moderationError.message?.includes('credits exhausted')) {
          toast({
            variant: "destructive",
            title: "Credits exhausted",
            description: "AI service credits exhausted. Please contact support at support@xixoi.com"
          });
          return;
        }
        throw moderationError;
      }

      if (moderationError) {
        console.error('Moderation error:', moderationError);
        throw new Error('Failed to validate ad content. Please try again.');
      }

      // Check if moderation failed
      if (!moderationResult.approved) {
        const violations = moderationResult.violations || [];
        setComplianceViolations(violations);
        setSavingAd(false);
        // Keep edit mode active so user can fix issues
        return;
      }

      // If moderation passed, update the ad variant with new content
      const { error } = await supabase
        .from('ad_variants')
        .update({
          headline: editedHeadline.trim(),
          body_copy: editedBodyCopy.trim(),
          cta_text: editedCtaText.trim(),
        })
        .eq('id', selectedVariant.id);

      if (error) throw error;

      // Update local state
      setAdVariants(prev => 
        prev.map(v => 
          v.id === selectedVariant.id 
            ? { ...v, headline: editedHeadline.trim(), body_copy: editedBodyCopy.trim(), cta_text: editedCtaText.trim() }
            : v
        )
      );
      
      setSelectedVariant({
        ...selectedVariant,
        headline: editedHeadline.trim(),
        body_copy: editedBodyCopy.trim(),
        cta_text: editedCtaText.trim(),
      });

      setIsEditingAd(false);
      setComplianceViolations([]);
      setIsPublished(false); // Reset publish status after edit
      toast({
        title: "✅ Ad updated successfully",
        description: "Your ad passed compliance checks. You can now publish it to platforms.",
      });
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        variant: "destructive",
        title: "Failed to save ad",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingAd(false);
    }
  };

  const remainingBudget = campaign.lifetime_budget 
    ? Math.max(0, campaign.lifetime_budget - campaign.total_spent)
    : null;

  const budgetStatus = remainingBudget !== null && remainingBudget < (campaign.daily_budget || 0) * 2
    ? 'low'
    : 'normal';

  const spendVelocity = performance.spendToday > (campaign.daily_budget || 0) * 1.2 
    ? 'high' 
    : 'normal';

  const getStatusBadge = () => {
    if (!campaign.is_active || campaign.status === 'paused') {
      return <Badge variant="secondary" className="flex items-center gap-1">⏸ Paused</Badge>;
    }
    if (campaign.status === 'completed') {
      return <Badge variant="outline" className="flex items-center gap-1">⏹ Ended</Badge>;
    }
    if (budgetStatus === 'low') {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Needs Budget</Badge>;
    }
    if (spendVelocity === 'high') {
      return <Badge className="bg-orange-500 flex items-center gap-1"><Zap className="w-3 h-3" /> High Spend Today</Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1 bg-green-600">🟢 Active</Badge>;
  };

  const handlePauseResume = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newStatus = campaign.is_active ? 'pause' : 'resume';
      
      await supabase.functions.invoke('pause-resume-campaign', {
        body: {
          campaignId: campaign.id,
          action: newStatus,
          reason: newStatus === 'pause' ? 'Paused from dashboard' : undefined
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      toast({
        title: newStatus === 'pause' ? 'Campaign paused' : 'Campaign resumed',
        description: `${campaign.name} has been ${newStatus}d`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = (amount: number) => {
    const newBudget = (campaign.lifetime_budget || 0) + amount;
    updateBudget(newBudget);
  };

  const updateBudget = async (newLifetimeBudget: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          lifetime_budget: newLifetimeBudget,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: 'Budget updated',
        description: `Lifetime budget set to $${newLifetimeBudget.toFixed(2)}`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to update budget',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = (variant: AdVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdToDelete(variant);
    setShowDeleteAlert(true);
  };

  const confirmDeleteAd = async () => {
    if (!adToDelete) return;
    
    setDeletingAdId(adToDelete.id);
    try {
      const { error } = await supabase
        .from('ad_variants')
        .delete()
        .eq('id', adToDelete.id);

      if (error) throw error;

      toast({
        title: 'Ad deleted',
        description: 'Ad variant has been removed',
      });

      // Update local state
      setAdVariants(adVariants.filter(v => v.id !== adToDelete.id));
      
      // Close modal if we deleted the currently selected variant
      if (selectedVariant?.id === adToDelete.id) {
        setShowAdModal(false);
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ad variant',
        variant: 'destructive',
      });
    } finally {
      setDeletingAdId(null);
      setShowDeleteAlert(false);
      setAdToDelete(null);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        !campaign.is_active ? 'bg-gray-400' :
        budgetStatus === 'low' ? 'bg-red-500' :
        spendVelocity === 'high' ? 'bg-orange-500' :
        'bg-green-500'
      }`} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {campaign.paused_reason && (
                <span className="text-xs text-muted-foreground">({campaign.paused_reason})</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePauseResume}
              disabled={loading}
            >
              {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">⋮</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAnalytics(campaign.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Line 1: Spend Metrics + Daily Budget */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Spend Today</span>
            <span className="text-lg font-bold">${performance.spendToday.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Spend This Month</span>
            <span className="text-lg font-bold">${performance.spendThisMonth.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Total Spent</span>
            <span className="text-lg font-bold">${campaign.total_spent.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Remaining Budget</span>
            <span className={`text-lg font-bold ${budgetStatus === 'low' ? 'text-red-600' : ''}`}>
              {remainingBudget !== null ? `$${remainingBudget.toFixed(2)}` : 'Unlimited'}
            </span>
          </div>
        </div>

        {/* Line 2: Daily Budget + Performance Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm border-t pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Daily Budget:</span>
            <span className="text-base font-medium">${campaign.daily_budget?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">CTR</span>
            <span className="text-base font-semibold">{performance.ctr.toFixed(2)}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">CPM</span>
            <span className="text-base font-semibold">${performance.cpm.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">CPC</span>
            <span className="text-base font-semibold">${performance.cpc.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">ROAS</span>
            <span className="text-base font-semibold">
              {performance.roas ? `${performance.roas.toFixed(2)}x` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Ad Creative Previews */}
        {adVariants.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Ad Previews</p>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {adVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex-shrink-0 w-48 border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/5 hover:border-primary transition-all cursor-pointer relative group"
                  >
                    <div 
                      onClick={() => {
                        setSelectedVariant(variant);
                        setShowAdModal(true);
                      }}
                      className="space-y-2"
                    >
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-7 w-7 p-0"
                        onClick={(e) => handleDeleteAd(variant, e)}
                        disabled={deletingAdId === variant.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    {variant.creative_url && (
                      <div className="aspect-square rounded overflow-hidden bg-muted relative">
                        <img 
                          src={variant.creative_url} 
                          alt={variant.headline || 'Ad creative'} 
                          className="w-full h-full object-cover"
                        />
                        {/* Watermark Badge for Free Users */}
                        {userPlan === 'free' && hasWatermark && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm py-1 px-3 rounded">
                            <p className="text-white text-[9px] font-semibold">
                              Powered by xiXoi™
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {variant.headline && (
                      <p className="text-xs font-semibold line-clamp-2">{variant.headline}</p>
                    )}
                    {variant.body_copy && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{variant.body_copy}</p>
                    )}
                    {variant.cta_text && (
                      <div className="text-xs font-medium text-primary">{variant.cta_text}</div>
                    )}
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-xs">{variant.variant_type}</Badge>
                        {variant.predicted_roas && (
                          <span className="text-xs text-green-600 font-medium">
                            {variant.predicted_roas.toFixed(1)}x ROAS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Quick Budget Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => handleAddBudget(20)}
            disabled={loading}
          >
            +$20
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => handleAddBudget(50)}
            disabled={loading}
          >
            +$50
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => handleAddBudget(100)}
            disabled={loading}
          >
            +$100
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" className="flex-1">
                <DollarSign className="w-4 h-4 mr-1" />
                Custom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddBudget(200)}>+$200</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBudget(500)}>+$500</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBudget(1000)}>+$1,000</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* End Date */}
        {campaign.end_date && (
          <div className="text-xs text-muted-foreground">
            Ends {formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })}
          </div>
        )}
      </CardContent>

      {/* Ad Preview Modal */}
      <Dialog open={showAdModal} onOpenChange={(open) => {
        setShowAdModal(open);
        if (!open) {
          setIsEditingAd(false);
          setComplianceViolations([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-10">
              <span>Ad Preview</span>
              <div className="flex items-center gap-2">
                {selectedVariant && (
                  <Badge variant="outline">{selectedVariant.variant_type}</Badge>
                )}
                {!isEditingAd ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditAd}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => selectedVariant && handleDeleteAd(selectedVariant, e)}
                      disabled={selectedVariant && deletingAdId === selectedVariant.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={savingAd}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAd}
                      disabled={savingAd}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingAd ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedVariant && (
            <div className="space-y-4">
              {/* Ad Creative */}
              {selectedVariant.creative_url && (
                <div className="rounded-lg overflow-hidden bg-muted relative">
                  <img 
                    src={selectedVariant.creative_url} 
                    alt={selectedVariant.headline || 'Ad creative'} 
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                  {/* Watermark Overlay for Free Users */}
                  {userPlan === 'free' && hasWatermark && (
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm py-2 px-4 rounded">
                      <p className="text-white text-xs font-semibold">
                        Powered by xiXoi™
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Compliance Violations Alert */}
              {isEditingAd && complianceViolations.length > 0 && (
                <div className="border border-destructive bg-destructive/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-sm text-foreground">Platform Policy Violations</p>
                      <div className="space-y-1.5">
                        {complianceViolations.map((violation, idx) => (
                          <div key={idx} className="text-xs bg-background/50 p-2 rounded border border-destructive/20">
                            <span className="font-medium">{violation.platform}:</span> {violation.issue}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Please revise your ad content below to comply with these policies before saving again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Copy */}
              <div className="space-y-4">
                {/* Headline */}
                <div>
                  <Label htmlFor="headline" className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Headline
                  </Label>
                  {isEditingAd ? (
                    <Input
                      id="headline"
                      value={editedHeadline}
                      onChange={(e) => setEditedHeadline(e.target.value)}
                      placeholder="Enter headline"
                      className="text-lg font-bold"
                    />
                  ) : (
                    <p className="text-lg font-bold">{selectedVariant.headline}</p>
                  )}
                </div>
                
                {/* Body Copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="body-copy" className="text-xs font-semibold text-muted-foreground">
                      Body Copy
                    </Label>
                    {isEditingAd && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateAICopy}
                        disabled={isGeneratingAI || !editedBodyCopy.trim()}
                        className="h-7 text-xs gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {isGeneratingAI ? 'Analyzing...' : 'AI Rewrite'}
                      </Button>
                    )}
                  </div>
                  {isEditingAd ? (
                    <div className="space-y-3">
                      {/* Original Copy Input */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">Your Copy:</div>
                        <div className="relative">
                          <Textarea
                            id="body-copy"
                            value={editedBodyCopy}
                            onChange={(e) => {
                              setEditedBodyCopy(e.target.value);
                              setShowAISuggestion(false); // Hide suggestion when user edits
                            }}
                            placeholder="Enter body copy"
                            rows={4}
                            className="resize-none pr-20"
                          />
                          <div className={`absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded ${
                            isOverLimit 
                              ? 'bg-destructive/10 text-destructive' 
                              : isNearLimit 
                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' 
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {characterCount}/{characterLimit}
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Suggestion Display */}
                      {showAISuggestion && aiSuggestedCopy && (
                        <div className="border-2 border-primary bg-primary/5 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 p-1.5 rounded-full">
                                <Sparkles className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-foreground">AI-Optimized Copy</div>
                                <div className="text-xs text-muted-foreground">
                                  {selectedVariant?.creative_url ? 'Analyzed with image/video' : 'Text optimized'}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAISuggestion(false)}
                              className="h-7 w-7 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="bg-background/50 rounded-md p-3">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiSuggestedCopy}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                            <span className={`text-xs font-medium ${
                              aiSuggestedCopy.length > characterLimit 
                                ? 'text-destructive' 
                                : aiSuggestedCopy.length > characterLimit * 0.9
                                  ? 'text-yellow-600 dark:text-yellow-500'
                                  : 'text-muted-foreground'
                            }`}>
                              {aiSuggestedCopy.length}/{characterLimit} characters
                              {aiSuggestedCopy.length > characterLimit && ' (exceeds limit)'}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              onClick={useAICopy}
                              className="h-8 gap-2"
                            >
                              <Zap className="w-3 h-3" />
                              Use This Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedVariant.body_copy}</p>
                  )}
                </div>
                
                {/* CTA */}
                <div>
                  <Label htmlFor="cta-text" className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Call to Action
                  </Label>
                  {isEditingAd ? (
                    <Input
                      id="cta-text"
                      value={editedCtaText}
                      onChange={(e) => setEditedCtaText(e.target.value)}
                      placeholder="Enter CTA text"
                    />
                  ) : (
                    <Button className="w-full sm:w-auto">
                      {selectedVariant.cta_text}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Performance Prediction */}
              {selectedVariant.predicted_roas && !isEditingAd && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Predicted ROAS</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedVariant.predicted_roas.toFixed(1)}x
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      AI-generated prediction based on<br />
                      historical campaign performance
                    </div>
                  </div>
                  
                  {/* Wallet Balance & Publish Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Wallet Balance</span>
                      <span className={`text-sm font-bold ${walletBalance < 50 ? 'text-destructive' : 'text-primary'}`}>
                        ${walletBalance.toFixed(2)}
                      </span>
                    </div>
                    
                    {walletBalance < 50 && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        ⚠️ Low balance. Add funds to ensure uninterrupted ad delivery.
                      </div>
                    )}

                    {isPublished ? (
                      <div className="p-3 bg-primary/10 rounded-lg text-center">
                        <p className="text-sm font-medium text-primary">✓ Ad Already Published</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This ad variant has been published to platforms
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => {
                          if (walletBalance < 10) {
                            toast({
                              title: "Insufficient Funds",
                              description: "Please add funds to your wallet before publishing ads.",
                              variant: "destructive",
                            });
                            return;
                          }
                          navigate(`/campaign-publish?id=${campaign.id}`);
                        }}
                        className="w-full"
                        size="lg"
                        disabled={checkingPublishStatus || walletBalance < 10}
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Publish Ad to Platforms
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ad variant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAd}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
