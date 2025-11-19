import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { AppLayout } from "@/components/layout/AppLayout";

export default function EditCampaign() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [landingUrl, setLandingUrl] = useState("");

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
      setContactPhone(campaignData.contact_phone || '');
      setContactEmail(campaignData.contact_email || '');
      setLandingUrl(campaignData.landing_url || '');
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
      const { error: tempUpdateError } = await supabase
        .from('campaign_assets')
        .update({ asset_text: campaignDescription.trim() })
        .eq('campaign_id', campaignId);

      if (tempUpdateError) throw tempUpdateError;

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

      if (!moderation.approved) {
        const violationMessages = moderation.violations
          .map((v: any) => `${v.platform}: ${v.issue}`)
          .join('\n');
        
        toast.error(
          <div className="space-y-2">
            <p className="font-bold">Content still has policy violations:</p>
            <pre className="text-xs whitespace-pre-wrap">{violationMessages}</pre>
          </div>,
          { duration: 8000 }
        );
        return;
      }

      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({
          name: campaignName.trim(),
          contact_phone: contactPhone.trim() || null,
          contact_email: contactEmail.trim() || null,
          landing_url: landingUrl.trim() || null,
        })
        .eq('id', campaignId);

      if (campaignUpdateError) throw campaignUpdateError;

      toast.success('Campaign updated successfully!');
      navigate(`/targeting/${campaignId}`);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast.error(error.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Edit Campaign"
      subtitle="Update your campaign description to fix content policy issues. Make sure to remove any discriminatory language, illegal content, or misleading claims."
      showBack
      backTo="/dashboard"
      backLabel="Dashboard"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Summer Sale 2024"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Campaign Description *</Label>
          <Textarea
            id="description"
            value={campaignDescription}
            onChange={(e) => setCampaignDescription(e.target.value)}
            placeholder="Describe your product or service..."
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This description will be used to generate ad copy. Be specific about what you're promoting.
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Call-to-Action Destinations</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g., +1 (555) 123-4567"
              />
              <p className="text-xs text-muted-foreground">For "Call Now" buttons</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g., hello@example.com"
              />
              <p className="text-xs text-muted-foreground">For "Contact" buttons</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="e.g., https://example.com"
              />
              <p className="text-xs text-muted-foreground">For "Learn More" or "Shop Now" buttons</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 space-y-3">
          <h4 className="font-semibold text-sm">✅ Good Description Examples:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>"Sustainable yoga mats made from recycled materials. Free shipping on orders over $50."</li>
            <li>"Professional house cleaning services. Book online in 60 seconds. Satisfaction guaranteed."</li>
          </ul>
          <h4 className="font-semibold text-sm mt-3">❌ Avoid These Issues:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Discriminatory language (age, gender, religion, etc.)</li>
            <li>Unsubstantiated health claims</li>
            <li>Misleading promises ("guaranteed" weight loss, etc.)</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !campaignName.trim() || !campaignDescription.trim()}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Regenerate Targeting'
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
