import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Image, Video, FileText, ShieldCheck, AlertCircle, CheckCircle2, Info, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/UpgradeModal";
import { detectAdCategory, checkHousingCompliance, checkEmploymentCompliance, checkCreditCompliance, getComplianceGuide, type ComplianceIssue } from "@/utils/adCompliance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtor } from "@/contexts/RealtorContext";
import { RealEstateDetailsForm } from "@/components/real-estate/RealEstateDetailsForm";
import { buildRealEstateFeatureSummary, buildHousingFooter } from "@/lib/realEstatePrompt";
import type { RealEstateDetailsFormValues } from "@/schema/realEstate";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { NoAdAccountsBanner } from "@/components/NoAdAccountsBanner";
import { AppLayout } from "@/components/layout/AppLayout";
import { CampaignContactSection } from "@/components/CampaignContactSection";

export default function CreateCampaign() {
  const { realtorProfile, isLoading: realtorLoading, viewMode } = useRealtor();
  const [user, setUser] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [suggestingName, setSuggestingName] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'text'>('image');
  const [textContent, setTextContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enableABTesting, setEnableABTesting] = useState(false);
  
  // Progress tracking
  const [currentStep, setCurrentStep] = useState<'upload' | 'generate' | 'publish'>('upload');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [mediaRightsConfirmed, setMediaRightsConfirmed] = useState(false);
  
  // Real Estate Mode (only available for realtors)
  const [realEstateMode, setRealEstateMode] = useState(false);
  const [realEstateDetails, setRealEstateDetails] = useState<RealEstateDetailsFormValues | null>(null);
  
  // CTA / Contact fields
  const [primaryGoal, setPrimaryGoal] = useState<string | null>('website');
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [landingUrl, setLandingUrl] = useState<string | null>(null);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    meta: { selected: boolean; budget: number };
    tiktok: { selected: boolean; budget: number };
    google: { selected: boolean; budget: number };
    linkedin: { selected: boolean; budget: number };
    x: { selected: boolean; budget: number };
  }>({
    meta: { selected: true, budget: 20 },
    tiktok: { selected: false, budget: 20 },
    google: { selected: false, budget: 20 },
    linkedin: { selected: false, budget: 20 },
    x: { selected: false, budget: 20 },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Character limits for each platform
  const platformLimits = {
    meta: 125,
    linkedin: 150,
    tiktok: 100,
    google: 90,
    x: 280
  };

  // Get the strictest character limit based on selected platforms
  const getCharacterLimit = () => {
    const selected = Object.entries(selectedPlatforms)
      .filter(([_, data]) => data.selected)
      .map(([platform, _]) => platformLimits[platform as keyof typeof platformLimits]);
    
    return selected.length > 0 ? Math.min(...selected) : 125;
  };

  const characterLimit = getCharacterLimit();
  const characterCount = textContent.length;
  const isOverLimit = characterCount > characterLimit;
  const isNearLimit = characterCount > characterLimit * 0.9;

  // Compliance checking
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [adCategory, setAdCategory] = useState<string>('standard');

  // Check compliance whenever text content changes
  useEffect(() => {
    if (!textContent.trim()) {
      setComplianceIssues([]);
      setAdCategory('standard');
      return;
    }

    const category = detectAdCategory(textContent);
    setAdCategory(category);

    let issues: ComplianceIssue[] = [];
    
    if (category === 'housing') {
      issues = checkHousingCompliance({
        bodyCopy: textContent,
        contactInfo: {}
      });
    } else if (category === 'employment') {
      issues = checkEmploymentCompliance({ bodyCopy: textContent });
    } else if (category === 'credit') {
      issues = checkCreditCompliance({ bodyCopy: textContent });
    }

    setComplianceIssues(issues);
  }, [textContent]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Increased limits: 500MB for videos (TikTok max is 287.6MB), 10MB for images
    const maxSize = uploadType === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: uploadType === 'video' 
          ? "Video must be under 500MB" 
          : "Image must be under 10MB",
        variant: "destructive"
      });
      return;
    }

    // Expanded video MIME types to support all iPhone/smartphone formats
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const validVideoTypes = [
      'video/mp4',
      'video/quicktime',           // Standard MOV
      'video/x-quicktime',          // Alternative MOV
      'video/x-m4v',                // iPhone specific
      'application/octet-stream'    // Fallback for unknown types
    ];
    
    const isValidMimeType = uploadType === 'image' 
      ? validImageTypes.includes(file.type)
      : validVideoTypes.includes(file.type);
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const validVideoExtensions = ['mp4', 'mov', 'm4v'];
    
    const isValidExtension = uploadType === 'image'
      ? validImageExtensions.includes(fileExtension || '')
      : validVideoExtensions.includes(fileExtension || '');

    // Accept if EITHER MIME type OR extension is valid (more permissive)
    if (!isValidMimeType && !isValidExtension) {
      console.log('Rejected file:', { 
        name: file.name, 
        type: file.type, 
        extension: fileExtension,
        uploadType 
      });
      toast({
        title: "Invalid file type",
        description: uploadType === 'video'
          ? "Please upload MP4 or MOV video files"
          : "Please upload JPG, PNG, GIF, or WebP images",
        variant: "destructive"
      });
      return;
    }

    // Warn if video is larger than TikTok's limit
    if (uploadType === 'video' && file.size > 287.6 * 1024 * 1024) {
      toast({
        title: "Large video file",
        description: "This video is larger than TikTok's 287MB limit. It may not work on all platforms.",
        variant: "default"
      });
    }

    console.log('Accepted file:', { 
      name: file.name, 
      type: file.type, 
      extension: fileExtension,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    setUploadedFile(file);
    
    if (uploadType === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (uploadType === 'video') {
      const videoUrl = URL.createObjectURL(file);
      setPreviewUrl(videoUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSuggestCampaignName = async () => {
    if (!textContent.trim()) {
      toast({
        title: "Add description first",
        description: "Please add a product/service description before generating a campaign name.",
        variant: "default"
      });
      return;
    }

    setSuggestingName(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-campaign-name', {
        body: { 
          description: textContent,
          productType: adCategory 
        }
      });

      if (error) throw error;

      if (data?.suggestedName) {
        setCampaignName(data.suggestedName);
        toast({
          title: "Campaign name suggested",
          description: "You can edit the name if needed.",
        });
      }
    } catch (error: any) {
      console.error('Error suggesting campaign name:', error);
      toast({
        title: "Couldn't generate name",
        description: error.message || "Please try again or enter a name manually.",
        variant: "destructive"
      });
    } finally {
      setSuggestingName(false);
    }
  };

  const handleCreateCampaign = async () => {
    console.log('Button clicked! User:', user, 'TextContent:', textContent, 'UploadType:', uploadType, 'File:', uploadedFile);
    
    if (!user) {
      console.log('No user found, returning');
      return;
    }

    // Auto-suggest campaign name if empty
    if (!campaignName.trim() && textContent.trim()) {
      console.log('Campaign name empty, auto-suggesting...');
      setSuggestingName(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-campaign-name', {
          body: { 
            description: textContent,
            productType: adCategory 
          }
        });

        if (error) {
          console.error('Error auto-suggesting name:', error);
          toast({
            title: "Campaign name required",
            description: "Please enter a campaign name before continuing.",
            variant: "destructive"
          });
          setSuggestingName(false);
          return;
        }

        if (data?.suggestedName) {
          setCampaignName(data.suggestedName);
          toast({
            title: "Campaign name auto-generated",
            description: "AI created a searchable name based on your description.",
          });
        }
      } catch (error: any) {
        console.error('Error auto-suggesting campaign name:', error);
        toast({
          title: "Campaign name required",
          description: "Please enter a campaign name before continuing.",
          variant: "destructive"
        });
        setSuggestingName(false);
        return;
      } finally {
        setSuggestingName(false);
      }
    }

    // Validate campaign name is present
    if (!campaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Every campaign must have a name for easy searching and organization.",
        variant: "destructive"
      });
      return;
    }

    // Check user plan and enforce tier limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';

    // Check if user is admin (bypass limits for testing)
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

    // FREE TIER: 1 ad per day limit (skip for admins)
    if (userPlan === 'free' && !isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAds } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (todayAds && todayAds.length >= 1) {
        toast({
          variant: "destructive",
          title: "Daily limit reached",
          description: "Free tier: 1 ad per day. Upgrade to Pro for unlimited ads.",
        });
        return;
      }
    }

    setLoading(true);
    setCurrentStep('generate');
    try {
      // CRITICAL: Only free tier gets watermark
      // Paid tiers (quickstart, pro, elite, agency) get no watermark
      const hasWatermark = userPlan === 'free';
      
      // Create campaign with media rights confirmation and optional real estate data
      const campaignData: any = {
        user_id: user.id,
        name: campaignName.trim(), // Name is now guaranteed to exist
        status: 'draft',
        has_watermark: hasWatermark,
        media_rights_confirmed_at: new Date().toISOString(),
        primary_goal: primaryGoal,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        landing_url: landingUrl,
      };

      // Add real estate data if in Real Estate Mode
      if (realEstateMode && realEstateDetails) {
        campaignData.real_estate_mode = true;
        campaignData.property_details = {
          propertyType: realEstateDetails.propertyType,
          city: realEstateDetails.city,
          stateOrRegion: realEstateDetails.stateOrRegion,
          neighborhood: realEstateDetails.neighborhood,
          price: realEstateDetails.price,
          bedrooms: realEstateDetails.bedrooms,
          bathrooms: realEstateDetails.bathrooms,
          squareFeet: realEstateDetails.squareFeet,
          keyFeatures: realEstateDetails.keyFeatures,
          nearbyHighlights: realEstateDetails.nearbyHighlights,
          realtorName: realEstateDetails.realtorName,
          brokerageName: realEstateDetails.brokerageName,
          includeEHO: realEstateDetails.includeEHO,
        };
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Upload file if present
      let assetUrl = null;
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${campaign.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-assets')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-assets')
          .getPublicUrl(fileName);
        
        assetUrl = publicUrl;
      }

      // Create asset with description and file URL
      const { error: assetError } = await supabase
        .from('campaign_assets')
        .insert({
          campaign_id: campaign.id,
          asset_type: uploadType,
          asset_text: textContent, // Always save description
          asset_url: assetUrl,
        });

      if (assetError) throw assetError;

      console.log('Campaign and asset created, calling generate-ad-variants...');

      // Trigger AI generation with retry logic (A/B testing creates 2 sets if enabled)
      const { error: generateError } = await invokeWithRetry(
        supabase,
        'generate-ad-variants',
        { campaignId: campaign.id, enableABTesting },
        { maxRetries: 3, initialDelayMs: 1000 }
      );

      if (generateError) {
        console.error('Ad generation failed:', generateError);

        // This now works reliably because we normalized it in retryWithBackoff
        if (
          generateError?.code === 'POLITICAL_UPGRADE_REQUIRED' ||
          generateError?.details?.error === 'POLITICAL_UPGRADE_REQUIRED'
        ) {
          toast({
            title: "Political Ads Require Verification",
            description: generateError?.details?.message || generateError?.message || "Upgrade your account to run political or advocacy ads.",
            variant: "destructive",
            duration: 8000,
          });

          setLoading(false);
          return;
        }

        // Handle rate limit errors
        if (generateError?.code === 'RATE_LIMIT' || generateError?.message?.includes('429') || generateError?.message?.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Rate limit reached",
            description: "AI service temporarily unavailable. Please try again in a moment."
          });
          setLoading(false);
          return;
        }

        // Handle credits exhausted
        if (generateError?.code === 'CREDITS_EXHAUSTED' || generateError?.message?.includes('402') || generateError?.message?.includes('credits exhausted')) {
          toast({
            variant: "destructive",
            title: "Credits exhausted",
            description: "AI service credits exhausted. Please contact support at support@xixoi.com"
          });
          setLoading(false);
          return;
        }

        // Generic error handling
        toast({
          title: "Failed to generate ad variants",
          description: generateError?.message || "Please try again or contact support if the problem persists.",
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      console.log('AI generation complete, fetching variants...');

      // Fetch generated variants
      const { data: variants, error: variantsError } = await supabase
        .from('ad_variants')
        .select('*')
        .eq('campaign_id', campaign.id);

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
      }

      console.log('Fetched variants:', variants);

      setCreatedCampaignId(campaign.id);
      setGeneratedVariants(variants || []);
      setUploadedAssetUrl(assetUrl);
      
      // Redirect to AI targeting screen
      navigate(`/targeting/${campaign.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Create New Campaign" showBack backTo="/dashboard">
      {/* No Ad Accounts Banner */}
      <div className="max-w-2xl mx-auto mb-6">
        <NoAdAccountsBanner />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* Step 1: Upload */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
              currentStep === 'upload' 
                ? 'border-foreground bg-foreground text-background' 
                : generatedVariants.length > 0
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-muted-foreground text-muted-foreground'
            }`}>
              {generatedVariants.length > 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="text-sm font-bold">1</span>
              )}
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'upload' ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Upload
            </span>
          </div>

          {/* Connector Line */}
          <div className={`w-12 h-0.5 ${
            generatedVariants.length > 0 ? 'bg-foreground' : 'bg-muted-foreground'
          }`} />

          {/* Step 2: Generate */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
              currentStep === 'generate'
                ? 'border-foreground bg-foreground text-background'
                : generatedVariants.length > 0 && showPlatformSelection
                  ? 'border-foreground bg-foreground text-background'
                  : generatedVariants.length > 0
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-muted-foreground text-muted-foreground'
            }`}>
              {generatedVariants.length > 0 && showPlatformSelection ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="text-sm font-bold">2</span>
              )}
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'generate' || generatedVariants.length > 0 ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Generate
            </span>
          </div>

          {/* Connector Line */}
          <div className={`w-12 h-0.5 ${
            showPlatformSelection ? 'bg-foreground' : 'bg-muted-foreground'
          }`} />

          {/* Step 3: Publish */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
              currentStep === 'publish'
                ? 'border-foreground bg-foreground text-background'
                : showPlatformSelection
                  ? 'border-foreground text-foreground'
                  : 'border-muted-foreground text-muted-foreground'
            }`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'publish' || showPlatformSelection ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Publish
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-center mb-6">Upload your content and let AI do the rest</p>

          <div className="border border-foreground p-8 space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-wide">Campaign Name *</label>
              <div className="flex gap-2">
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="My Product Campaign"
                  className="border-foreground flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSuggestCampaignName}
                  disabled={suggestingName || !textContent.trim()}
                  className="whitespace-nowrap"
                >
                  {suggestingName ? "Suggesting..." : "✨ AI Suggest"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required. If left empty, AI will auto-generate a searchable name based on your description (Format: Date | Category | Keywords)
              </p>
            </div>

            {/* A/B Testing Toggle */}
            <div className="flex items-center justify-between p-4 border border-border bg-card">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-sm font-medium">A/B Testing</label>
                  <p className="text-xs text-muted-foreground">
                    Generate 2 versions to test which performs better
                  </p>
                </div>
              </div>
              <Switch
                checked={enableABTesting}
                onCheckedChange={setEnableABTesting}
              />
            </div>

            {/* Content Input - Always show description */}
            <div className="space-y-4">
              {/* Real Estate Mode Toggle (only for realtors in realtor view mode) */}
              {realtorProfile?.isRealtor && viewMode === 'realtor' && (
                <div className="flex items-center justify-between p-4 border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-primary" />
                    <div>
                      <label className="text-sm font-medium">Real Estate Mode</label>
                      <p className="text-xs text-muted-foreground">
                        Use structured property details with automatic Fair Housing compliance
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={realEstateMode}
                    onCheckedChange={setRealEstateMode}
                  />
                </div>
              )}

              {/* Show Real Estate Form or Regular Textarea */}
              {realEstateMode && realtorProfile?.isRealtor && viewMode === 'realtor' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wide">Property Details</label>
                  <RealEstateDetailsForm
                    defaultValues={{
                      realtorName: realtorProfile.realtorName || '',
                      brokerageName: realtorProfile.brokerageName || '',
                      includeEHO: true,
                      propertyType: '',
                      city: '',
                      stateOrRegion: '',
                    }}
                    onChange={(values) => {
                      setRealEstateDetails(values);
                      // Build summary for AI if we have required fields
                      if (values.propertyType && values.city && values.stateOrRegion && values.realtorName && values.brokerageName) {
                        const summary = buildRealEstateFeatureSummary({
                          propertyType: values.propertyType,
                          city: values.city,
                          stateOrRegion: values.stateOrRegion,
                          neighborhood: values.neighborhood,
                          price: values.price,
                          bedrooms: values.bedrooms,
                          bathrooms: values.bathrooms,
                          squareFeet: values.squareFeet,
                          realtorName: values.realtorName,
                          brokerageName: values.brokerageName,
                          includeEHO: values.includeEHO,
                          keyFeatures: values.keyFeatures?.split(',').map(f => f.trim()).filter(Boolean),
                          nearbyHighlights: values.nearbyHighlights?.split(',').map(h => h.trim()).filter(Boolean),
                        });
                        setTextContent(summary);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wide">Product/Service Description *</label>
                  <p className="text-xs text-muted-foreground">
                    Describe what you're advertising: key features, benefits, price, target audience, and contact info. AI will optimize for each platform.
                  </p>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Example: Premium noise-canceling headphones with 40hr battery, $299. Perfect for commuters. Shop now at AudioPro.com or call 555-1234."
                    className="border-foreground min-h-[120px] placeholder:opacity-40"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <p className="text-muted-foreground">
                      ✓ Meta: 125 • TikTok: 100 • Google: 90 • LinkedIn: 150 • X: 140
                    </p>
                    <p className={`font-medium ${
                      isOverLimit 
                        ? 'text-destructive' 
                        : isNearLimit 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                    }`}>
                      {characterCount} / {characterLimit}
                      {isOverLimit && ' ⚠️'}
                    </p>
                  </div>
                </div>
              )}

              {/* Ad Category & Compliance Alerts */}
              {adCategory !== 'standard' && textContent.trim() && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {adCategory === 'housing' && 'Housing/Real Estate Ad Detected'}
                      {adCategory === 'employment' && 'Employment Ad Detected'}
                      {adCategory === 'credit' && 'Credit/Financial Ad Detected'}
                      {adCategory === 'health' && 'Health Ad Detected'}
                      {adCategory === 'political' && 'Political Ad Detected'}
                    </span>
                    <span className="text-muted-foreground">
                      (Special Category - Extra Review)
                    </span>
                  </div>

                  {/* Compliance Issues */}
                  {complianceIssues.length > 0 && (
                    <div className="space-y-2">
                      {complianceIssues.map((issue, idx) => (
                        <Alert 
                          key={idx}
                          variant={issue.severity === 'error' ? 'destructive' : 'default'}
                          className={
                            issue.severity === 'error' 
                              ? 'border-destructive' 
                              : issue.severity === 'warning'
                                ? 'border-foreground'
                                : 'border-foreground'
                          }
                        >
                          <div className="flex items-start gap-2">
                            {issue.severity === 'error' && <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />}
                            {issue.severity === 'warning' && <AlertCircle className="w-4 h-4 mt-0.5" />}
                            {issue.severity === 'info' && <Info className="w-4 h-4 mt-0.5" />}
                            <AlertDescription className="text-xs">
                              <span className="font-semibold">{issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}:</span> {issue.message}
                              <div className="text-xs text-muted-foreground mt-1">
                                Platforms: {issue.platforms.join(', ')}
                              </div>
                            </AlertDescription>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Compliance passed */}
                  {complianceIssues.filter(i => i.severity === 'error').length === 0 && (
                    <Alert className="border-foreground bg-background">
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        <span className="font-semibold">No critical compliance issues detected.</span>
                        {complianceIssues.filter(i => i.severity === 'warning').length > 0 && ' Review warnings above for optimal results.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Compliance Guide */}
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-primary hover:underline">
                      View {adCategory} Ad Requirements
                    </summary>
                    <div className="mt-2 space-y-1 pl-4 text-muted-foreground">
                      {getComplianceGuide(adCategory as any).map((guideline, idx) => (
                        <div key={idx}>{guideline}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Upload Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wide">Upload Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setUploadType('image')}
                  className={`border-2 p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'image' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm font-medium">Image</span>
                </button>
                
                <button
                  onClick={() => setUploadType('video')}
                  className={`border-2 p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'video' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <Video className="w-8 h-8" />
                  <span className="text-sm font-medium">Video</span>
                </button>
                
                <button
                  onClick={() => setUploadType('text')}
                  className={`border-2 p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'text' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <FileText className="w-8 h-8" />
                  <span className="text-sm font-medium">Text</span>
                </button>
              </div>
            </div>

            {(uploadType === 'image' || uploadType === 'video') && (
              <div className="space-y-2">
                <label className="text-sm font-medium uppercase tracking-wide">
                  Upload {uploadType === 'image' ? 'Image' : 'Video'}
                </label>
                {uploadType === 'image' && (
                  <p className="text-xs text-muted-foreground">
                    Formats: JPG, JPEG, PNG • Max size: 5MB • Recommended: 1080x1080px or larger
                  </p>
                )}
                {uploadType === 'video' && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Formats: MP4, MOV (iPhone videos supported) • Max size: 500MB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 9:16 (vertical), 1:1 (square), or 16:9 (landscape) • Min 720p • Under 287MB for TikTok
                    </p>
                  </div>
                )}
                <div 
                  onClick={handleUploadClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-foreground bg-foreground/5' 
                      : 'border-foreground/20 hover:border-foreground/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={uploadType === 'image' ? 'image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png' : 'video/mp4,video/quicktime,.mp4,.mov'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl && uploadType === 'image' ? (
                    <div className="space-y-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 mx-auto object-contain border border-foreground/20"
                      />
                      <div className="space-y-2">
                        <p className="text-foreground text-sm font-medium">{uploadedFile?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB`}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                        >
                          Replace Image
                        </Button>
                      </div>
                    </div>
                  ) : previewUrl && uploadType === 'video' ? (
                    <div className="space-y-3">
                      <video 
                        src={previewUrl} 
                        controls
                        className="max-h-48 mx-auto border border-foreground/20"
                      />
                      <div className="space-y-2">
                        <p className="text-foreground text-sm font-medium">{uploadedFile?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB`}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                        >
                          Replace Video
                        </Button>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-foreground" />
                      <p className="text-foreground font-medium">{uploadedFile.name}</p>
                      <p className="text-muted-foreground text-xs">Click or drag to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isDragging ? `Drop ${uploadType} here` : `Click or drag ${uploadType} to upload`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA / Contact Section */}
            <div className="border-t pt-6">
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
            </div>

            {/* Media Rights Confirmation */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/30 border">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="media-rights" 
                      checked={mediaRightsConfirmed}
                      onCheckedChange={(checked) => setMediaRightsConfirmed(checked as boolean)}
                      className="mt-1"
                    />
                    <label 
                      htmlFor="media-rights" 
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      <span className="font-semibold">I confirm that I own or have full legal rights to use this content for advertising purposes.</span>
                      <span className="block mt-1 text-muted-foreground">
                        By checking this box, I certify that all media, text, logos, and other content I'm uploading does not infringe on any copyright, trademark, or intellectual property rights. I understand that I am solely responsible for any legal claims arising from unauthorized use of content.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleCreateCampaign}
              disabled={
                loading || 
                !textContent || 
                !mediaRightsConfirmed || 
                ((uploadType === 'image' || uploadType === 'video') && !uploadedFile) ||
                !primaryGoal ||
                (primaryGoal === 'website' && !landingUrl) ||
                (primaryGoal === 'calls' && !contactPhone) ||
                (primaryGoal === 'email' && !contactEmail)
              }
            >
              {loading ? "Generating..." : 
               !mediaRightsConfirmed ? "Confirm content rights to continue" : 
               !textContent ? "Fill description to continue" : 
               ((uploadType === 'image' || uploadType === 'video') && !uploadedFile) ? `Upload ${uploadType} to continue` :
               !primaryGoal ? "Select CTA goal to continue" :
               (primaryGoal === 'website' && !landingUrl) ? "Enter landing URL to continue" :
               (primaryGoal === 'calls' && !contactPhone) ? "Enter phone number to continue" :
               (primaryGoal === 'email' && !contactEmail) ? "Enter email to continue" :
               "Let me see..."}
            </Button>
            
            {/* Helper text */}
            {(!textContent || !mediaRightsConfirmed || ((uploadType === 'image' || uploadType === 'video') && !uploadedFile)) && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {!mediaRightsConfirmed && "⚠️ Please confirm you own the rights to this content"}
                {mediaRightsConfirmed && !textContent && "⚠️ Product description required"}
                {mediaRightsConfirmed && textContent && ((uploadType === 'image' || uploadType === 'video') && !uploadedFile) && `⚠️ ${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} upload required`}
              </p>
            )}
          </div>
        </div>

      {/* Platform Selection Modal */}
      {showPlatformSelection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-background border-2 border-foreground max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Choose Your Platforms</h2>
                <p className="text-muted-foreground">Select platforms and set daily budget for each</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'meta', name: 'Meta (Facebook & Instagram)', icon: '📘' },
                  { key: 'tiktok', name: 'TikTok', icon: '🎵' },
                  { key: 'google', name: 'Google Ads', icon: '🔍' },
                  { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
                  { key: 'x', name: 'X (Twitter)', icon: '𝕏' }
                ].map(platform => (
                  <div 
                    key={platform.key}
                    className={`border-2 p-6 transition-all ${
                      selectedPlatforms[platform.key as keyof typeof selectedPlatforms].selected
                        ? 'border-foreground bg-foreground/5'
                        : 'border-foreground/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms[platform.key as keyof typeof selectedPlatforms].selected}
                        onChange={(e) => {
                          setSelectedPlatforms(prev => ({
                            ...prev,
                            [platform.key]: {
                              ...prev[platform.key as keyof typeof selectedPlatforms],
                              selected: e.target.checked
                            }
                          }));
                        }}
                        className="w-5 h-5 mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{platform.icon}</span>
                          <span className="font-bold">{platform.name}</span>
                        </div>
                        
                        {selectedPlatforms[platform.key as keyof typeof selectedPlatforms].selected && (
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Daily Budget (USD)
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min="5"
                                max="500"
                                value={selectedPlatforms[platform.key as keyof typeof selectedPlatforms].budget}
                                onChange={(e) => {
                                  setSelectedPlatforms(prev => ({
                                    ...prev,
                                    [platform.key]: {
                                      ...prev[platform.key as keyof typeof selectedPlatforms],
                                      budget: parseInt(e.target.value)
                                    }
                                  }));
                                }}
                                className="flex-1"
                              />
                              <span className="font-bold min-w-[60px]">
                                ${selectedPlatforms[platform.key as keyof typeof selectedPlatforms].budget}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPlatformSelection(false)}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button 
                  onClick={() => {
                    const selectedCount = Object.values(selectedPlatforms).filter(p => p.selected).length;
                    if (selectedCount === 0) {
                      toast({
                        variant: "destructive",
                        title: "Platform Required",
                        description: "Please select at least one platform",
                      });
                      return;
                    }
                    setShowPlatformSelection(false);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {createdCampaignId && (
        <UpgradeModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          campaignId={createdCampaignId}
          onPublishFree={() => {
            toast({
              title: "Publishing with watermark",
              description: "Your ad is being published with the xiXoi™ watermark!",
            });
            navigate(`/ad-published/${createdCampaignId}?paid=false`);
          }}
        />
      )}
    </AppLayout>
  );
}
