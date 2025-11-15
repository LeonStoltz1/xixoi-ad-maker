import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Save
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
  const { toast } = useToast();

  useEffect(() => {
    loadAdVariants();
    loadUserPlanAndWatermark();
  }, [campaign.id]);

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
      setIsEditingAd(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingAd(false);
    setEditedHeadline("");
    setEditedBodyCopy("");
    setEditedCtaText("");
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

      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        'moderate-ad-content',
        {
          body: {
            campaignId: campaign.id,
            platforms: ['meta', 'tiktok', 'google', 'linkedin', 'x'],
          }
        }
      );

      if (moderationError) {
        console.error('Moderation error:', moderationError);
        throw new Error('Failed to validate ad content. Please try again.');
      }

      // Check if moderation failed
      if (!moderationResult.approved) {
        const violationsList = moderationResult.violations
          ?.map((v: any) => `${v.platform}: ${v.issue}`)
          .join('\n• ') || 'Content violates platform policies';

        toast({
          title: "⚠️ Platform Policy Violations",
          description: (
            <div className="space-y-3">
              <p className="font-semibold text-sm">Your ad content violates these policies:</p>
              <div className="text-xs bg-destructive/10 p-3 rounded border border-destructive/20">
                • {violationsList}
              </div>
              {moderationResult.summary && (
                <p className="text-xs text-muted-foreground italic">{moderationResult.summary}</p>
              )}
              <p className="text-xs font-medium">Please revise your ad to comply with platform guidelines.</p>
            </div>
          ),
          variant: "destructive",
          duration: 15000,
        });
        setSavingAd(false);
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
      toast({
        title: "✅ Ad updated successfully",
        description: "Your ad passed platform compliance checks and has been saved.",
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

      <CardContent className="space-y-4">
        {/* Spend Metrics */}
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
            <p className="text-lg font-semibold">${campaign.total_spent.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Remaining Budget</p>
            <p className={`text-lg font-semibold ${budgetStatus === 'low' ? 'text-red-600' : ''}`}>
              {remainingBudget !== null ? `$${remainingBudget.toFixed(2)}` : 'Unlimited'}
            </p>
          </div>
        </div>

        {/* Budget Info */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">Daily Budget:</span>
          <span className="font-medium">${campaign.daily_budget?.toFixed(2) || '0.00'}</span>
        </div>

        {/* Performance Preview */}
        <div className="grid grid-cols-4 gap-2 text-center border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">CTR</p>
            <p className="text-sm font-semibold">{performance.ctr.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CPM</p>
            <p className="text-sm font-semibold">${performance.cpm.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CPC</p>
            <p className="text-sm font-semibold">${performance.cpc.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-semibold">
              {performance.roas ? `${performance.roas.toFixed(2)}x` : 'N/A'}
            </p>
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
                    onClick={() => {
                      setSelectedVariant(variant);
                      setShowAdModal(true);
                    }}
                    className="flex-shrink-0 w-48 border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/5 hover:border-primary transition-all cursor-pointer"
                  >
                    {variant.creative_url && (
                      <div className="aspect-square rounded overflow-hidden bg-muted relative">
                        <img 
                          src={variant.creative_url} 
                          alt={variant.headline || 'Ad creative'} 
                          className="w-full h-full object-cover"
                        />
                        {/* Watermark Badge for Free Users */}
                        {userPlan === 'free' && hasWatermark && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-1 px-2">
                            <p className="text-white text-[10px] font-semibold text-center">
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
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ad Preview</span>
              <div className="flex items-center gap-2">
                {selectedVariant && (
                  <Badge variant="outline">{selectedVariant.variant_type}</Badge>
                )}
                {!isEditingAd ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditAd}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
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
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-2 px-4">
                      <p className="text-white text-sm font-semibold text-center">
                        Powered by xiXoi™
                      </p>
                    </div>
                  )}
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
                <div>
                  <Label htmlFor="body-copy" className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Body Copy
                  </Label>
                  {isEditingAd ? (
                    <Textarea
                      id="body-copy"
                      value={editedBodyCopy}
                      onChange={(e) => setEditedBodyCopy(e.target.value)}
                      placeholder="Enter body copy"
                      rows={4}
                      className="resize-none"
                    />
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
                <div className="border-t pt-4">
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
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
