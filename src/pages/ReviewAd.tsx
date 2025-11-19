import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Editable fields
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
      
      // Get the first variant
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
          platforms: ['meta'], // Currently only Meta is active
          adContent: {
            headline: editedHeadline,
            body_copy: editedBody,
            cta_text: editedCta,
          }
        }
      });

      if (error) throw error;

      console.log('Moderation result:', data);

      if (data.approved) {
        setIsApproved(true);
        toast.success("Your ad meets all platform guidelines!");
        
        // Update the variant with edited content if changes were made
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
        setComplianceIssues(data.issues || []);
        toast.error("Your ad needs some changes to meet guidelines");
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
      toast.error("Failed to check ad compliance");
    } finally {
      setChecking(false);
      setIsEditing(false);
    }
  };

  const handlePublish = () => {
    if (!isApproved) {
      toast.error("Please check compliance before publishing");
      return;
    }
    navigate(`/campaign-publish?id=${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!campaign || !variant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Campaign not found</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const imageUrl = campaign.campaign_assets?.[0]?.asset_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="w-full max-w-content mx-auto px-6 pt-[150px] pb-section">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium hidden md:inline">Create Campaign</span>
          </div>
          
          <div className="w-8 md:w-12 h-[2px] bg-foreground"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-sm font-medium hidden md:inline">Review Targeting</span>
          </div>
          
          <div className="w-8 md:w-12 h-[2px] bg-foreground"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-sm font-medium hidden md:inline">Preview</span>
          </div>
          
          <div className="w-8 md:w-12 h-[2px] bg-border"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-border text-muted-foreground flex items-center justify-center font-bold">
              4
            </div>
            <span className="text-sm text-muted-foreground hidden md:inline">Publish</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Preview Your Ad</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Review and edit your ad before publishing
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Ad Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ad Preview</h3>
            <Card className="border-2 border-border overflow-hidden">
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Ad creative" 
                  className="w-full aspect-square object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <h4 className="font-bold text-foreground">{editedHeadline}</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{editedBody}</p>
                <Button className="w-full" variant="default">
                  {editedCta}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Powered by xiXoi™
                </p>
              </div>
            </Card>
          </div>

          {/* Edit Form */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ad Content</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={editedHeadline}
                  onChange={(e) => {
                    setEditedHeadline(e.target.value);
                    setIsEditing(true);
                    setIsApproved(false);
                  }}
                  placeholder="Enter headline"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedHeadline.length} characters
                </p>
              </div>

              <div>
                <Label htmlFor="body">Body Copy</Label>
                <Textarea
                  id="body"
                  value={editedBody}
                  onChange={(e) => {
                    setEditedBody(e.target.value);
                    setIsEditing(true);
                    setIsApproved(false);
                  }}
                  placeholder="Enter body copy"
                  rows={6}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedBody.length} characters
                </p>
              </div>

              <div>
                <Label htmlFor="cta">Call-to-Action</Label>
                <Input
                  id="cta"
                  value={editedCta}
                  onChange={(e) => {
                    setEditedCta(e.target.value);
                    setIsEditing(true);
                    setIsApproved(false);
                  }}
                  placeholder="Enter CTA text"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedCta.length} characters
                </p>
              </div>

              {/* Compliance Issues */}
              {complianceIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Compliance Issues Found:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {complianceIssues.map((issue, idx) => (
                        <li key={idx} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Approval Status */}
              {isApproved && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Your ad meets all platform guidelines and is ready to publish!
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCheckCompliance}
                  disabled={checking}
                  className="w-full"
                  variant={isApproved ? "outline" : "default"}
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Compliance...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Check Compliance
                    </>
                  )}
                </Button>

                <Button
                  onClick={handlePublish}
                  disabled={!isApproved}
                  className="w-full"
                  variant="default"
                >
                  Continue to Publish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate(`/targeting/${campaignId}`)}
          >
            ← Back to Targeting
          </Button>
        </div>
      </div>
    </div>
  );
}
