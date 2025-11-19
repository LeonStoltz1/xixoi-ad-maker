import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ReviewAd() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [variant, setVariant] = useState<any>(null);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [hasWatermark, setHasWatermark] = useState(true);
  const [editedHeadline, setEditedHeadline] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [editedCta, setEditedCta] = useState("");

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      const { data: campaignData, error } = await supabase
        .from('campaigns')
        .select('*, campaign_assets(*), ad_variants(*)')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      setCampaign(campaignData);
      setHasWatermark(campaignData.has_watermark ?? true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        setUserPlan(profile?.plan || 'free');
      }
      
      const firstVariant = campaignData.ad_variants?.[0];
      if (firstVariant) {
        setVariant(firstVariant);
        setEditedHeadline(firstVariant.headline || "");
        setEditedBody(firstVariant.body_copy || "");
        setEditedCta(firstVariant.cta_text || "");
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCompliance = async () => {
    if (!variant) return;

    setChecking(true);
    setComplianceIssues([]);
    setIsApproved(false);

    try {
      const { data, error } = await supabase.functions.invoke('moderate-ad-content', {
        body: {
          campaignId,
          platforms: ['meta'],
          adContent: {
            headline: editedHeadline,
            body_copy: editedBody,
            cta_text: editedCta,
          }
        }
      });

      if (error) throw error;

      if (data.approved) {
        setIsApproved(true);
        toast.success("Your ad meets all platform guidelines!");
        
        if (isEditing) {
          await supabase
            .from('ad_variants')
            .update({
              headline: editedHeadline,
              body_copy: editedBody,
              cta_text: editedCta,
            })
            .eq('id', variant.id);
        }
      } else {
        setIsApproved(false);
        setComplianceIssues(data.violations || []);
        toast.error("Ad has compliance issues. Please review and edit.");
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
      toast.error("Failed to check compliance");
    } finally {
      setChecking(false);
    }
  };

  const handlePublish = () => {
    if (!isApproved) {
      toast.error("Please check compliance before publishing");
      return;
    }
    navigate(`/campaign-publish/${campaignId}`);
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

  if (!campaign) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Campaign not found</p>
        </div>
      </AppLayout>
    );
  }

  const imageUrl = campaign.campaign_assets?.[0]?.asset_url;

  return (
    <AppLayout
      title="Review & Edit Your Ad"
      subtitle="Preview your ad and make final adjustments before publishing"
      showBack
      backTo={`/targeting/${campaignId}`}
      backLabel="Targeting"
    >
      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ad Preview</h2>
          <div className="space-y-4">
            {imageUrl && (
              <div className="relative w-full aspect-video bg-muted overflow-hidden rounded-lg">
                <img src={imageUrl} alt="Ad creative" className="w-full h-full object-cover" />
                {hasWatermark && userPlan === 'free' && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Powered by xiXoi™
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Headline</p>
                <p className="font-semibold">{editedHeadline}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Body</p>
                <p className="text-sm">{editedBody}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Call-to-Action</p>
                <Button size="sm" variant="default" className="mt-1">{editedCta}</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit Ad Content</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? (<><Check className="w-4 h-4 mr-2" />Done Editing</>) : (<><Pencil className="w-4 h-4 mr-2" />Edit</>)}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" value={editedHeadline} onChange={(e) => setEditedHeadline(e.target.value)} disabled={!isEditing} maxLength={40} />
              <p className="text-xs text-muted-foreground">{editedHeadline.length}/40 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body Copy</Label>
              <Textarea id="body" value={editedBody} onChange={(e) => setEditedBody(e.target.value)} disabled={!isEditing} rows={4} maxLength={125} />
              <p className="text-xs text-muted-foreground">{editedBody.length}/125 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call-to-Action</Label>
              <Input id="cta" value={editedCta} onChange={(e) => setEditedCta(e.target.value)} disabled={!isEditing} maxLength={30} />
              <p className="text-xs text-muted-foreground">{editedCta.length}/30 characters</p>
            </div>
          </div>
        </Card>

        {complianceIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Compliance Issues Found:</p>
              <ul className="list-disc list-inside space-y-1">
                {complianceIssues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue.platform}: {issue.issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {isApproved && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>Your ad meets all platform guidelines and is ready to publish!</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCheckCompliance} disabled={checking} className="flex-1">
            {checking ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>) : 'Check Compliance'}
          </Button>
          <Button onClick={handlePublish} disabled={!isApproved} className="flex-1">Continue to Publish</Button>
        </div>
      </div>
    </AppLayout>
  );
}
