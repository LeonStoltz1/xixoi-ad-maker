import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Pause,
  Play, 
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
  Image as ImageIcon
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
  stripe_payment_id?: string | null;
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
  const [loading, setLoading] = useState(false);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<AdVariant | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteCampaignAlert, setShowDeleteCampaignAlert] = useState(false);
  const [adToDelete, setAdToDelete] = useState<AdVariant | null>(null);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [editingAd, setEditingAd] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedCta, setEditedCta] = useState('');
  const [savingAd, setSavingAd] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [hasWatermark, setHasWatermark] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [checkingPublishStatus, setCheckingPublishStatus] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAdVariants();
    loadUserProfile();
    loadWalletBalance();
  }, [campaign.id]);

  useEffect(() => {
    if (selectedVariant) {
      checkPublishStatus(selectedVariant.id);
    }
  }, [selectedVariant]);

  const loadUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setUserPlan(profile.plan || 'free');
    }

    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('has_watermark')
      .eq('id', campaign.id)
      .single();

    if (campaignData) {
      setHasWatermark(campaignData.has_watermark ?? true);
    }
  };

  const loadWalletBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: wallet } = await supabase
      .from('ad_wallets')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    if (wallet) {
      setWalletBalance(wallet.balance);
    }
  };

  const checkPublishStatus = async (variantId: string) => {
    setCheckingPublishStatus(true);
    try {
      const { data } = await supabase
        .from('free_ads')
        .select('id')
        .eq('ad_variant_id', variantId)
        .maybeSingle();

      setIsPublished(!!data);
    } catch (error) {
      console.error('Error checking publish status:', error);
    } finally {
      setCheckingPublishStatus(false);
    }
  };

  const loadAdVariants = async () => {
    const { data, error } = await supabase
      .from('ad_variants')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAdVariants(data);
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

      await loadAdVariants();
      if (selectedVariant?.id === adToDelete.id) {
        setShowAdModal(false);
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error deleting ad variant:', error);
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

  const handleEditAd = () => {
    if (!selectedVariant) return;
    setEditedHeadline(selectedVariant.headline || '');
    setEditedBody(selectedVariant.body_copy || '');
    setEditedCta(selectedVariant.cta_text || '');
    setEditingAd(true);
  };

  const handleSaveAd = async () => {
    if (!selectedVariant) return;

    setSavingAd(true);
    try {
      const { error } = await supabase
        .from('ad_variants')
        .update({
          headline: editedHeadline,
          body_copy: editedBody,
          cta_text: editedCta,
        })
        .eq('id', selectedVariant.id);

      if (error) throw error;

      toast({
        title: 'Ad updated',
        description: 'Changes saved successfully',
      });

      await loadAdVariants();
      const updatedVariant = adVariants.find(v => v.id === selectedVariant.id);
      if (updatedVariant) {
        setSelectedVariant({
          ...updatedVariant,
          headline: editedHeadline,
          body_copy: editedBody,
          cta_text: editedCta,
        });
      }
      setEditingAd(false);
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSavingAd(false);
    }
  };

  const remainingBudget = campaign.lifetime_budget 
    ? campaign.lifetime_budget - campaign.total_spent
    : null;

  const budgetStatus = remainingBudget !== null && remainingBudget < (campaign.daily_budget || 0) * 2
    ? 'low'
    : 'normal';

  const spendVelocity = performance.spendToday > (campaign.daily_budget || 0) * 1.2 
    ? 'high' 
    : 'normal';

  const getStatusBadge = () => {
    // Paused
    if (!campaign.is_active || campaign.status === 'paused') {
      return <Badge variant="secondary" className="flex items-center gap-1">⏸ Paused</Badge>;
    }
    
    // Completed
    if (campaign.status === 'completed') {
      return <Badge variant="outline" className="flex items-center gap-1">⏹ Ended</Badge>;
    }
    
    // Draft (never generated variants or payment)
    if (campaign.status === 'draft') {
      return <Badge variant="outline" className="flex items-center gap-1">📝 Draft</Badge>;
    }
    
    // Ready to publish (generated but not paid)
    if (campaign.status === 'ready' && !campaign.stripe_payment_id && campaign.total_spent === 0) {
      return <Badge variant="default" className="bg-primary text-primary-foreground flex items-center gap-1">⚡ Ready to Publish</Badge>;
    }
    
    // Low budget warning (only for published campaigns)
    if (budgetStatus === 'low') {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Needs Budget</Badge>;
    }
    
    // High spend today (only for published campaigns)
    if (spendVelocity === 'high') {
      return <Badge className="bg-background text-foreground border border-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> High Spend Today</Badge>;
    }
    
    // Actually active (has payment or spend)
    if (campaign.stripe_payment_id || campaign.total_spent > 0) {
      return <Badge variant="default" className="flex items-center gap-1 bg-foreground text-background">🟢 Active</Badge>;
    }
    
    // Default: unpublished
    return <Badge variant="outline" className="flex items-center gap-1">📝 Unpublished</Badge>;
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

  const handleDeleteCampaign = async () => {
    setDeletingCampaign(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the safe delete function that stops ads on platforms first
      const { data, error } = await supabase.functions.invoke('delete-campaign-safe', {
        body: { campaignId: campaign.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success === false) {
        // Platform stop failed - show detailed error
        toast({
          title: 'Cannot delete campaign',
          description: data.message || 'Failed to stop ads on social platforms. Your ads are still running.',
          variant: 'destructive',
        });
        setShowDeleteCampaignAlert(false);
        setDeletingCampaign(false);
        return;
      }

      toast({
        title: 'Campaign deleted safely',
        description: `${campaign.name} has been stopped on all platforms and deleted`,
      });

      setShowDeleteCampaignAlert(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setDeletingCampaign(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {campaign.paused_reason && (
                <span className="text-xs text-muted-foreground truncate">({campaign.paused_reason})</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
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
                <DropdownMenuItem onClick={() => navigate(`/campaign/${campaign.id}`)}>
                  <Rocket className="w-4 h-4 mr-2" />
                  View Ad Status
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
                <DropdownMenuItem className="text-foreground font-medium">
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Campaign
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteCampaignAlert(true)}
                  className="text-destructive focus:text-destructive font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Spend Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spend Today</p>
            <p className="text-xl font-bold">${performance.spendToday.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spend This Month</p>
            <p className="text-xl font-bold">${performance.spendThisMonth.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold">${campaign.total_spent.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Remaining Budget</p>
            <p className="text-xl font-bold">
              {remainingBudget !== null ? `$${remainingBudget.toFixed(2)}` : 'Unlimited'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Budget and End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Daily Budget</p>
            <p className="text-base font-medium">${campaign.daily_budget?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-base font-medium">
              {campaign.end_date 
                ? new Date(campaign.end_date).toLocaleDateString() 
                : 'No end date'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">CTR</p>
            <p className="text-base font-semibold">{performance.ctr.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">CPM</p>
            <p className="text-base font-semibold">${performance.cpm.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">CPC</p>
            <p className="text-base font-semibold">${performance.cpc.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-base font-semibold">
              {performance.roas ? `${performance.roas.toFixed(2)}x` : 'N/A'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/ad-published/${campaign.id}?paid=${userPlan !== 'free'}`)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Ad
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(campaign)}
            className="flex-1"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onViewAnalytics(campaign.id)}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Ad Variants Count */}
        {adVariants.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedVariant(adVariants[0]);
              setShowAdModal(true);
            }}
            className="w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {adVariants.length} Ad Variant{adVariants.length !== 1 ? 's' : ''}
          </Button>
        )}
      </CardContent>

      {/* Ad Variant Modal */}
      <Dialog open={showAdModal} onOpenChange={setShowAdModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Ad Variants</DialogTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {selectedVariant && (
              <div className="space-y-4">
                {/* Variant Selector */}
                {adVariants.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {adVariants.map((variant) => (
                      <Button
                        key={variant.id}
                        size="sm"
                        variant={selectedVariant.id === variant.id ? "default" : "outline"}
                        onClick={() => setSelectedVariant(variant)}
                        className="flex-shrink-0"
                      >
                        {variant.variant_type}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Creative Preview */}
                {selectedVariant.creative_url && (
                  <div className="aspect-square max-w-md mx-auto bg-muted relative overflow-hidden">
                    <img 
                      src={selectedVariant.creative_url} 
                      alt={selectedVariant.headline || 'Ad creative'} 
                      className="w-full h-full object-contain"
                    />
                    {userPlan === 'free' && hasWatermark && (
                      <div className="absolute bottom-4 right-4 bg-foreground/90 backdrop-blur-sm py-2 px-4">
                        <p className="text-background text-xs font-semibold">
                          Powered by xiXoi™
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ad Copy */}
                <div className="space-y-4">
                  {editingAd ? (
                    <>
                      <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input
                          value={editedHeadline}
                          onChange={(e) => setEditedHeadline(e.target.value)}
                          maxLength={125}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body Copy</Label>
                        <Textarea
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          rows={4}
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Call to Action</Label>
                        <Input
                          value={editedCta}
                          onChange={(e) => setEditedCta(e.target.value)}
                          maxLength={30}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveAd} disabled={savingAd}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingAd(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedVariant.headline && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Headline</p>
                          <p className="font-semibold">{selectedVariant.headline}</p>
                        </div>
                      )}
                      {selectedVariant.body_copy && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Body Copy</p>
                          <p className="text-sm">{selectedVariant.body_copy}</p>
                        </div>
                      )}
                      {selectedVariant.cta_text && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Call to Action</p>
                          <p className="font-medium">{selectedVariant.cta_text}</p>
                        </div>
                      )}
                      {selectedVariant.predicted_roas && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Predicted ROAS</p>
                          <p className="text-lg font-bold">{selectedVariant.predicted_roas.toFixed(2)}x</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleEditAd}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Ad Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={(e) => {
                            handleDeleteAd(selectedVariant, e as any);
                          }}
                          disabled={deletingAdId === selectedVariant.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Wallet Balance & Publish Section */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between p-3 bg-muted">
                    <span className="text-sm font-medium">Wallet Balance</span>
                    <span className={`text-sm font-bold ${walletBalance < 50 ? 'text-foreground' : ''}`}>
                      ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                  
                  {walletBalance < 50 && (
                    <div className="text-xs border border-foreground p-2">
                      ⚠️ Low balance. Add funds to ensure uninterrupted ad delivery.
                    </div>
                  )}

                  {isPublished ? (
                    <div className="p-3 bg-foreground text-background text-center">
                      <p className="text-sm font-medium">✓ Ad Already Published</p>
                      <p className="text-xs mt-1">
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

      {/* Delete Campaign Confirmation Alert */}
      <AlertDialog open={showDeleteCampaignAlert} onOpenChange={setShowDeleteCampaignAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will permanently delete "{campaign.name}" from xiXoi™.</p>
              <p className="font-semibold text-foreground">
                ⚠️ Safety check: Your ads will be stopped on all social platforms BEFORE deletion to prevent runaway ad spend.
              </p>
              <p className="text-xs">
                This action cannot be undone. All ad variants, performance data, and settings will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCampaign}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              disabled={deletingCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCampaign ? 'Stopping ads & deleting...' : 'Stop Ads & Delete Campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
