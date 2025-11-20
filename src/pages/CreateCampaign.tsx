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
  const [generatingTargeting, setGeneratingTargeting] = useState(false);
  const [useCustomCopy, setUseCustomCopy] = useState(false);
  const [customHeadline, setCustomHeadline] = useState("");
  const [customBodyCopy, setCustomBodyCopy] = useState("");
  const [customCtaText, setCustomCtaText] = useState("Learn More");
  
  // Campaign ID
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  
  // Targeting & Budget
  const [targetLocation, setTargetLocation] = useState('');
  const [dailyBudget, setDailyBudget] = useState(20);
  const [targetingOptions, setTargetingOptions] = useState<Array<{
    audienceSummary: string;
    reasoning: string;
    recommendedChannels: string;
    suggestedLocation: string;
    suggestedBudget: number;
    confidence: number;
  }>>([]);
  const [selectedTargetingIndex, setSelectedTargetingIndex] = useState<number | null>(null);
  const [metaSubPlatforms, setMetaSubPlatforms] = useState<{
    facebook: boolean;
    instagram: boolean;
  }>({
    facebook: true,
    instagram: true
  });
  const [manualOverrides, setManualOverrides] = useState({
    location: false,
    budget: false,
    audience: false
  });
  const [customAudience, setCustomAudience] = useState('');
  const [undoSnapshot, setUndoSnapshot] = useState<{
    location: string;
    budget: number;
    audience: string;
    overrides: { location: boolean; budget: boolean; audience: boolean };
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-generate targeting when product description changes
  useEffect(() => {
    if (!productDescription || productDescription.trim().length < 10) return;
    
    const timeoutId = setTimeout(() => {
      generateAITargeting();
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [productDescription]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const generateAITargeting = async () => {
    if (!productDescription || productDescription.trim().length < 10) return;
    
    setGeneratingTargeting(true);
    
    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'generate-targeting',
        { productDescription }
      );
      
      if (error) {
        console.error('AI targeting generation failed:', error);
        toast({
          title: "Targeting generation failed",
          description: error.message || "Could not generate targeting suggestions",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.options && data.options.length === 3) {
        setTargetingOptions(data.options);
        setSelectedTargetingIndex(0); // Auto-select highest confidence option
        
        // Apply first option's values
        setTargetLocation(data.options[0].suggestedLocation);
        setDailyBudget(data.options[0].suggestedBudget);
        setCustomAudience(data.options[0].audienceSummary);
        
        // Reset manual overrides
        setManualOverrides({ location: false, budget: false, audience: false });
        
        toast({
          title: "✨ 3 Targeting Strategies Generated",
          description: "Choose your preferred audience approach"
        });
      }
    } catch (error) {
      console.error('AI targeting generation error:', error);
    } finally {
      setGeneratingTargeting(false);
    }
  };

  // Auto-generate targeting when product description changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productDescription && productDescription.trim().length >= 10 && targetingOptions.length === 0) {
        generateAITargeting();
      }
    }, 1500); // Debounce 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [productDescription]);

  const handleSelectTargeting = (index: number) => {
    setSelectedTargetingIndex(index);
    const selected = targetingOptions[index];
    
    // Only update fields that haven't been manually overridden
    if (!manualOverrides.location) {
      setTargetLocation(selected.suggestedLocation);
    }
    if (!manualOverrides.budget) {
      setDailyBudget(selected.suggestedBudget);
    }
    if (!manualOverrides.audience) {
      setCustomAudience(selected.audienceSummary);
    }
  };

  const handleLocationChange = (value: string) => {
    // Validate location input (max 100 chars, basic sanitization)
    const sanitized = value.trim().slice(0, 100);
    setTargetLocation(sanitized);
    setManualOverrides(prev => ({ ...prev, location: true }));
  };

  const handleBudgetChange = (value: number) => {
    // Validate budget is within allowed range
    const validated = Math.max(5, Math.min(500, value));
    setDailyBudget(validated);
    setManualOverrides(prev => ({ ...prev, budget: true }));
  };

  const handleAudienceChange = (value: string) => {
    // Validate audience input (max 100 chars, basic sanitization)
    const sanitized = value.trim().slice(0, 100);
    setCustomAudience(sanitized);
    setManualOverrides(prev => ({ ...prev, audience: true }));
  };

  const resetToAISuggestion = (field: 'location' | 'budget' | 'audience') => {
    if (selectedTargetingIndex === null) return;
    const selected = targetingOptions[selectedTargetingIndex];
    
    switch (field) {
      case 'location':
        setTargetLocation(selected.suggestedLocation);
        setManualOverrides(prev => ({ ...prev, location: false }));
        break;
      case 'budget':
        setDailyBudget(selected.suggestedBudget);
        setManualOverrides(prev => ({ ...prev, budget: false }));
        break;
      case 'audience':
        setCustomAudience(selected.audienceSummary);
        setManualOverrides(prev => ({ ...prev, audience: false }));
        break;
    }
  };

  const resetAllToAI = () => {
    if (selectedTargetingIndex === null) return;
    const selected = targetingOptions[selectedTargetingIndex];
    
    // Save current state for undo
    setUndoSnapshot({
      location: targetLocation,
      budget: dailyBudget,
      audience: customAudience,
      overrides: { ...manualOverrides }
    });
    
    // Reset to AI values
    setTargetLocation(selected.suggestedLocation);
    setDailyBudget(selected.suggestedBudget);
    setCustomAudience(selected.audienceSummary);
    setManualOverrides({ location: false, budget: false, audience: false });
    
    const { dismiss } = toast({
      title: "Reset to AI suggestions",
      description: "All fields restored to AI-recommended values",
      action: (
        <button
          onClick={() => {
            handleUndo();
            dismiss();
          }}
          className="px-3 py-1.5 text-sm font-medium bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors"
        >
          Undo
        </button>
      )
    });
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;
    
    setTargetLocation(undoSnapshot.location);
    setDailyBudget(undoSnapshot.budget);
    setCustomAudience(undoSnapshot.audience);
    setManualOverrides(undoSnapshot.overrides);
    setUndoSnapshot(null);
    
    toast({
      title: "✓ Undo successful",
      description: "Manual edits restored"
    });
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

    if (!metaSubPlatforms.facebook && !metaSubPlatforms.instagram) {
      toast({
        title: "Platform required",
        description: "Please select at least one Meta platform (Facebook or Instagram)",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Auto-generate campaign name if not provided
      let finalCampaignName = campaignName.trim();
      if (!finalCampaignName) {
        const { data: nameData, error: nameError } = await invokeWithRetry(
          supabase,
          'suggest-campaign-name',
          { productDescription }
        );
        if (!nameError && nameData?.suggestedName) {
          finalCampaignName = nameData.suggestedName;
          setCampaignName(finalCampaignName);
        } else {
          finalCampaignName = 'Untitled Campaign';
        }
      }

      // Generate AI targeting if not already done
      if (targetingOptions.length === 0 && productDescription) {
        await generateAITargeting();
      }

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
          name: finalCampaignName,
          primary_goal: primaryGoal,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          landing_url: landingUrl,
          target_location: targetLocation || 'United States',
          target_audience: customAudience || (selectedTargetingIndex !== null && targetingOptions[selectedTargetingIndex] 
            ? targetingOptions[selectedTargetingIndex].audienceSummary 
            : 'General'),
          daily_budget: dailyBudget,
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
      <div className="flex flex-row items-start justify-center gap-8 xl:gap-16">
        {/* Left column – Controls */}
        <div className="w-[375px] shrink-0">
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-3 w-full overflow-hidden">
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
                      {uploadType === 'image' ? 'JPG or PNG up to 5MB' : 'MP4 or MOV up to 200MB'}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {uploadType === 'video' && previewUrl ? (
                      <video src={previewUrl} controls className="w-full rounded-lg" />
                    ) : previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
                    ) : null}
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleReplaceImage}>
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
              <div className="space-y-3">
                <div>
                  <Label htmlFor="campaign-name-text">Ad Header (Required)</Label>
                  <Input
                    id="campaign-name-text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="description-text">Product/Service Description *</Label>
                  <Textarea
                    id="description-text"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe what you're advertising..."
                    rows={6}
                  />
                </div>
              </div>
            )}
          </Card>

            {/* Campaign Details - Only show for image/video uploads */}
            {uploadType !== 'text' && (
              <Card className="p-3 space-y-2 w-full overflow-hidden">
                <div>
                  <Label htmlFor="campaign-name">Ad Header (Required)</Label>
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
            )}

            {/* Contact Section */}
            <Card className="p-3 w-full overflow-hidden">
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
              <Card className="p-3 space-y-2 w-full overflow-hidden">
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
        </div>

        {/* Right column – Live Preview */}
        <div className="w-[375px] shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Live Preview</h2>
                  <p className="text-sm text-muted-foreground">See your ad as you build it</p>
                </div>
                <Button
                  type="button"
                  variant={useCustomCopy ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCustomCopy(!useCustomCopy)}
                  className="shrink-0"
                >
                  {useCustomCopy ? "Using Custom" : "Use My Copy"}
                </Button>
              </div>
              
              {/* Custom copy editor */}
              {useCustomCopy && (
                <Card className="p-3 mb-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom-headline" className="text-xs">Headline</Label>
                    <Input
                      id="custom-headline"
                      value={customHeadline}
                      onChange={(e) => setCustomHeadline(e.target.value)}
                      placeholder="Your custom headline..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-body" className="text-xs">Body Copy</Label>
                    <Textarea
                      id="custom-body"
                      value={customBodyCopy}
                      onChange={(e) => setCustomBodyCopy(e.target.value)}
                      placeholder="Your custom ad copy..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-cta" className="text-xs">CTA Button</Label>
                    <Input
                      id="custom-cta"
                      value={customCtaText}
                      onChange={(e) => setCustomCtaText(e.target.value)}
                      placeholder="e.g., Shop Now"
                      className="text-sm"
                    />
                  </div>
                </Card>
              )}
            </div>
            
            {/* Instagram-style preview */}
            <Card className="w-full overflow-hidden border-2">
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
              
              {/* Image/Video */}
              {(previewUrl || assetUrl) && (
                <div className="relative w-full aspect-square bg-muted">
                  {uploadType === 'video' ? (
                    <video
                      src={previewUrl || assetUrl || ''}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={previewUrl || assetUrl || ''}
                      alt="Ad creative"
                      className="w-full h-full object-cover"
                    />
                  )}
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
                    {useCustomCopy 
                      ? (customHeadline || "Your custom headline...") 
                      : (headline || "Your headline will appear here")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {useCustomCopy 
                      ? (customBodyCopy || "Your custom ad copy...") 
                      : (bodyCopy || productDescription || "Your ad copy will appear here as you type...")}
                  </p>
                </div>
                <div className="pt-1">
                  <Button size="sm" className="w-full h-9 text-sm font-semibold">
                    {useCustomCopy ? customCtaText : ctaText}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* AI Targeting Suggestions - outside sticky wrapper */}
          {productDescription && productDescription.trim().length >= 10 && (
            <Card className="p-3 space-y-3 w-full overflow-hidden border border-black mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-black">AI Targeting</h3>
                  {(() => {
                    const overrideCount = Object.values(manualOverrides).filter(Boolean).length;
                    if (overrideCount > 0) {
                      return (
                        <>
                          <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-600 text-yellow-800 text-xs font-medium rounded">
                            {overrideCount} edited
                          </span>
                          <button
                            type="button"
                            onClick={resetAllToAI}
                            className="px-2 py-0.5 bg-black text-white text-xs font-medium rounded hover:bg-black/80 transition-colors"
                          >
                            Reset
                          </button>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
                {generatingTargeting && (
                  <div className="flex items-center gap-2 text-xs text-black/60">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                )}
              </div>
              
              {/* AI Targeting Strategies */}
              {targetingOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-black">Strategies</div>
                  {targetingOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectTargeting(index)}
                      className={`w-full border p-2 text-left transition-all ${
                        selectedTargetingIndex === index 
                          ? 'border-black bg-black text-white' 
                          : 'border-black bg-white text-black hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-semibold">
                          #{index + 1}
                        </div>
                        <div className={`text-xs ${
                          selectedTargetingIndex === index ? 'text-white' : 'text-black'
                        }`}>
                          {Math.round(option.confidence * 100)}%
                        </div>
                      </div>
                      <div className={`text-xs ${
                        selectedTargetingIndex === index ? 'text-white' : 'text-black'
                      }`}>
                        {option.audienceSummary}
                      </div>
                      <div className={`text-xs mt-1 ${
                        selectedTargetingIndex === index ? 'text-white/90' : 'text-black/70'
                      }`}>
                        ${option.suggestedBudget}/day • {option.suggestedLocation}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="target-location" className="text-black text-xs">Location</Label>
                  {manualOverrides.location && selectedTargetingIndex !== null && (
                    <button
                      type="button"
                      onClick={() => resetToAISuggestion('location')}
                      className="text-xs text-black/60 hover:text-black underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <Input
                  id="target-location"
                  value={targetLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="e.g., United States"
                  className={`border-black text-black text-sm ${manualOverrides.location ? 'bg-yellow-50' : ''}`}
                  maxLength={100}
                />
                {manualOverrides.location && (
                  <div className="text-xs text-black/60 mt-1">✏️ Edited</div>
                )}
              </div>

              {/* Audience */}
              {selectedTargetingIndex !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="custom-audience" className="text-black text-xs">Audience</Label>
                    {manualOverrides.audience && (
                      <button
                        type="button"
                        onClick={() => resetToAISuggestion('audience')}
                        className="text-xs text-black/60 hover:text-black underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <Textarea
                    id="custom-audience"
                    value={customAudience}
                    onChange={(e) => handleAudienceChange(e.target.value)}
                    placeholder="Describe your target audience..."
                    rows={2}
                    className={`border-black text-black text-xs ${manualOverrides.audience ? 'bg-yellow-50' : ''}`}
                    maxLength={300}
                  />
                  {manualOverrides.audience && (
                    <div className="text-xs text-black/60 mt-1">✏️ Edited</div>
                  )}
                </div>
              )}

              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="daily-budget" className="text-black text-xs">Daily Budget</Label>
                  {manualOverrides.budget && selectedTargetingIndex !== null && (
                    <button
                      type="button"
                      onClick={() => resetToAISuggestion('budget')}
                      className="text-xs text-black/60 hover:text-black underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    id="daily-budget"
                    min="5"
                    max="500"
                    step="5"
                    value={dailyBudget}
                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                    className={`w-full h-1 appearance-none cursor-pointer ${
                      manualOverrides.budget ? 'bg-yellow-600' : 'bg-black'
                    }`}
                    style={{
                      accentColor: manualOverrides.budget ? '#ca8a04' : '#000000'
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium ${manualOverrides.budget ? 'text-yellow-700' : 'text-black'}`}>
                      ${dailyBudget}/day
                    </div>
                    {manualOverrides.budget && (
                      <div className="text-xs text-black/60">✏️ Edited</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <Label className="text-black text-xs">Platform</Label>
                <div className="mt-2 p-2 border border-black rounded">
                  <div className="font-semibold text-xs mb-2">Meta</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="facebook"
                        checked={metaSubPlatforms.facebook}
                        onChange={(e) => setMetaSubPlatforms(prev => ({...prev, facebook: e.target.checked}))}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <label htmlFor="facebook" className="text-xs cursor-pointer">Facebook</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="instagram"
                        checked={metaSubPlatforms.instagram}
                        onChange={(e) => setMetaSubPlatforms(prev => ({...prev, instagram: e.target.checked}))}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <label htmlFor="instagram" className="text-xs cursor-pointer">Instagram</label>
                    </div>
                    {!metaSubPlatforms.facebook && !metaSubPlatforms.instagram && (
                      <p className="text-xs text-destructive">Select at least one</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
