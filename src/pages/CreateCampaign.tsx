import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Video as VideoIcon, FileText, X, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { AppLayout } from "@/components/layout/AppLayout";
import { CampaignContactSection } from "@/components/CampaignContactSection";
import { useEffectiveTier } from "@/hooks/useEffectiveTier";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tier: effectiveTier } = useEffectiveTier();
  
  // Upload state
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'text'>('image');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Campaign fields
  const [campaignName, setCampaignName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  
  // Contact/CTA fields
  const [primaryGoal, setPrimaryGoal] = useState<string | null>('website');
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [landingUrl, setLandingUrl] = useState<string | null>(null);
  
  // AI Generated content
  const [headline, setHeadline] = useState("");
  const [bodyCopy, setBodyCopy] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Campaign ID
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = uploadType === 'video' ? 200 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: uploadType === 'video' ? "Videos must be under 200MB" : "Images must be under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    
    if (uploadType !== 'text') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleGenerateAd = async () => {
    if (!productDescription.trim()) {
      toast({
        title: "Description required",
        description: "Please describe your product or service",
        variant: "destructive"
      });
      return;
    }

    if (uploadType !== 'text' && !uploadedFile) {
      toast({
        title: "Upload required",
        description: "Please upload an image or video",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create campaign
      let uploadedAssetUrl = null;
      
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-assets')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-assets')
          .getPublicUrl(fileName);
        
        uploadedAssetUrl = publicUrl;
        setAssetUrl(publicUrl);
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: campaignName || 'Untitled Campaign',
          primary_goal: primaryGoal,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          landing_url: landingUrl,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;
      setCampaignId(campaign.id);

      // Save asset
      if (uploadedAssetUrl) {
        await supabase.from('campaign_assets').insert({
          campaign_id: campaign.id,
          asset_type: uploadType,
          asset_url: uploadedAssetUrl
        });
      } else if (textContent) {
        await supabase.from('campaign_assets').insert({
          campaign_id: campaign.id,
          asset_type: 'text',
          asset_text: textContent
        });
      }

      // Generate AI variants
      const { data: variantData, error: variantError } = await invokeWithRetry(
        supabase,
        'generate-ad-variants',
        {
          campaignId: campaign.id,
          uploadType,
          productDescription,
          textContent: textContent || null,
          imageUrl: uploadedAssetUrl,
          enableABTesting: false
        }
      );

      if (variantError) throw variantError;

      if (variantData?.variants && variantData.variants.length > 0) {
        const firstVariant = variantData.variants[0];
        setHeadline(firstVariant.headline || "");
        setBodyCopy(firstVariant.body_copy || "");
        setCtaText(firstVariant.cta_text || "Learn More");
        setHasGenerated(true);
      }

      toast({
        title: "Ad generated!",
        description: "Your ad has been created. Edit it below or publish."
      });

    } catch (error) {
      console.error('Error generating ad:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout title="Create Campaign">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="p-3">
            <Label className="text-sm font-semibold mb-2 block">Upload Your Content</Label>
            
            {/* Upload Type Selector */}
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={uploadType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadType('image')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                type="button"
                variant={uploadType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadType('video')}
              >
                <VideoIcon className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button
                type="button"
                variant={uploadType === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadType('text')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>

            {/* Upload Area */}
            {uploadType !== 'text' ? (
              <div>
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-xs font-medium mb-1">Drop your {uploadType} here or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadType === 'video' ? 'MP4, MOV (max 200MB)' : 'JPG, PNG (max 5MB)'}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {uploadType === 'image' && previewUrl && (
                      <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
                    )}
                    {uploadType === 'video' && previewUrl && (
                      <video src={previewUrl} controls className="w-full rounded-lg" />
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button type="button" variant="outline" size="sm" onClick={handleReplaceImage} className="flex-1">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadType === 'video' ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png'}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your ad text here..."
                rows={6}
              />
            )}
          </Card>

          {/* Campaign Details */}
          <Card className="p-3 space-y-2">
            <div>
              <Label htmlFor="campaign-name">Campaign Name (Optional)</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Summer Sale 2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Product/Service Description *</Label>
              <Textarea
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe what you're advertising..."
                rows={4}
              />
            </div>
          </Card>

          {/* Contact Section */}
          <Card className="p-3">
            <CampaignContactSection
              primaryGoal={primaryGoal}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              landingUrl={landingUrl}
              onPrimaryGoalChange={setPrimaryGoal}
              onContactPhoneChange={setContactPhone}
              onContactEmailChange={setContactEmail}
              onLandingUrlChange={setLandingUrl}
            />
          </Card>

          {/* Generate Button */}
          {!hasGenerated && (
            <Button
              onClick={handleGenerateAd}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Ad
                </>
              )}
            </Button>
          )}

          {/* Edit Section (after generation) */}
          {hasGenerated && (
            <Card className="p-3 space-y-2">
              <Label className="text-sm font-semibold">Edit Your Ad</Label>
              
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={40}
                />
                <p className="text-xs text-muted-foreground mt-1">{headline.length}/40 characters</p>
              </div>

              <div>
                <Label htmlFor="body">Body Copy</Label>
                <Textarea
                  id="body"
                  value={bodyCopy}
                  onChange={(e) => setBodyCopy(e.target.value)}
                  rows={4}
                  maxLength={125}
                />
                <p className="text-xs text-muted-foreground mt-1">{bodyCopy.length}/125 characters</p>
              </div>

              <div>
                <Label htmlFor="cta">Call-to-Action Button</Label>
                <Input
                  id="cta"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground mt-1">{ctaText.length}/30 characters</p>
              </div>

              <Button
                onClick={() => navigate(`/targeting/${campaignId}`)}
                className="w-full"
                size="lg"
              >
                Continue to Publishing →
              </Button>
            </Card>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Live Preview</h2>
            <p className="text-sm text-muted-foreground">See your ad as you build it</p>
          </div>
          
          {/* Instagram-style preview */}
          <div className="mx-auto" style={{ maxWidth: '375px' }}>
            <Card className="overflow-hidden border-2">
              {/* Instagram header */}
              <div className="p-3 flex items-center gap-2 border-b bg-background">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                  Ad
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {campaignName || 'Your Ad'}
                  </p>
                  <p className="text-xs text-muted-foreground">Sponsored</p>
                </div>
              </div>
              
              {/* Image */}
              {(previewUrl || assetUrl) && (
                <div className="relative w-full aspect-square bg-muted">
                  <img
                    src={previewUrl || assetUrl || ''}
                    alt="Ad creative"
                    className="w-full h-full object-cover"
                  />
                  {effectiveTier === 'free' && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">
                      Powered by xiXoi™
                    </div>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-3 space-y-2 bg-background">
                <div>
                  <p className="font-semibold text-sm leading-tight">
                    {headline || "Your headline will appear here"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {bodyCopy || "Your ad copy will appear here as you type..."}
                  </p>
                </div>
                <div className="pt-1">
                  <Button size="sm" className="w-full h-9 text-sm font-semibold">
                    {ctaText}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
