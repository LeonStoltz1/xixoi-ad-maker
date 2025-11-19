import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeWithRetry } from "@/lib/retryWithBackoff";

export default function EditCampaign() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, campaign_assets(*)')
        .eq('id', campaignId)
        .single();
      
      if (campaignError) throw campaignError;
      if (!campaignData) {
        toast.error('Campaign not found');
        navigate('/dashboard');
        return;
      }

      setCampaignName(campaignData.name);
      const asset = campaignData.campaign_assets?.[0];
      setCampaignDescription(asset?.asset_text || '');
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaignName.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!campaignDescription.trim()) {
      toast.error('Campaign description is required');
      return;
    }

    setSaving(true);
    try {
      // Update campaign asset temporarily
      const { error: tempUpdateError } = await supabase
        .from('campaign_assets')
        .update({ asset_text: campaignDescription.trim() })
        .eq('campaign_id', campaignId);

      if (tempUpdateError) throw tempUpdateError;

      // Validate content against all platforms
      const { data: moderation, error: moderationError } = await invokeWithRetry(
        supabase,
        'moderate-ad-content',
        {
          campaignId: campaignId,
          platforms: ['meta', 'tiktok', 'google', 'linkedin', 'x']
        },
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      if (moderationError) {
        if (moderationError.message?.includes('429') || moderationError.message?.includes('rate limit')) {
          toast.error('AI service temporarily unavailable. Please try again in a moment.');
          return;
        } else if (moderationError.message?.includes('402') || moderationError.message?.includes('credits exhausted')) {
          toast.error('AI service credits exhausted. Please contact support at support@xixoi.com');
          return;
        }
        
        toast.error('Failed to validate content. Please try again.');
        return;
      }

      // Check for violations
      if (!moderation.approved) {
        const violationMessages = moderation.violations
          .map((v: any) => `${v.platform}: ${v.issue}`)
          .join('\n');
        
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Campaign description violates advertising policies:</p>
            <pre className="text-xs whitespace-pre-wrap">{violationMessages}</pre>
            <p className="text-sm">Please remove discriminatory or prohibited content.</p>
          </div>,
          { duration: 10000 }
        );
        return;
      }

      // Update campaign name
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ name: campaignName.trim() })
        .eq('id', campaignId);

      if (campaignError) throw campaignError;

      // Regenerate targeting
      toast.success('Campaign updated! Regenerating targeting...');
      
      navigate(`/targeting/${campaignId}`);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Edit Campaign</h1>
              <p className="text-muted-foreground">
                Update your campaign description to fix content policy issues. Make sure to remove any discriminatory language, illegal content, or misleading claims.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campaign-description">Campaign Description</Label>
                <Textarea
                  id="campaign-description"
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Describe your product or service"
                  rows={12}
                  className="resize-none text-base"
                />
              </div>

              <div className="bg-muted/50 p-4 border border-foreground/10 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">✅ Good description includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Clear product/service details</li>
                    <li>Key features and benefits</li>
                    <li>Pricing information</li>
                    <li>Target audience (without discrimination)</li>
                    <li>Contact information or call-to-action</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-destructive mb-2">❌ Avoid:</p>
                  <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                    <li>Discriminatory language (race, gender, religion, etc.)</li>
                    <li>Illegal products or services</li>
                    <li>Misleading or deceptive claims</li>
                    <li>Prohibited content</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/targeting/${campaignId}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving || !campaignName.trim() || !campaignDescription.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving & Regenerating...
                  </>
                ) : (
                  'Save & Regenerate Targeting'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
