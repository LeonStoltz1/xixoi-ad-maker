import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, Video as VideoIcon, FileText, X, Loader2, Sparkles, RefreshCw, AlertCircle, Info, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { AppLayout } from "@/components/layout/AppLayout";
import { CampaignContactSection } from "@/components/CampaignContactSection";
import { useEffectiveTier } from "@/hooks/useEffectiveTier";
import { getMinimumDailySpend } from "@/lib/spendEngine";
import { CreationMethodSelector } from "@/components/campaign/CreationMethodSelector";
import { URLImport } from "@/components/campaign/URLImport";
import { URLAdReview } from "@/components/campaign/URLAdReview";
import { FreeUpgradeModal } from "@/components/FreeUpgradeModal";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { tier: effectiveTier } = useEffectiveTier();
  
  // Creation method selection
  const [creationMethod, setCreationMethod] = useState<'select' | 'url' | 'scratch' | 'url-review'>('select');
  const [urlReviewData, setUrlReviewData] = useState<{
    selectedImage: string;
    headline: string;
    bodyCopy: string;
    ctaText: string;
    sourceUrl: string;
    businessName: string;
    targeting: {
      suggestedLocation: string;
      suggestedBudget: number;
      audienceSummary: string;
    };
  } | null>(null);
  
  // Free upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalAdData, setUpgradeModalAdData] = useState<any>(null);
  
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
  
  // Mobile preview visibility (default true - visible on mobile)
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  
  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<{
    recommendedCTA: string;
    headline: string;
    bodyCopy: string;
    suggestedURL: string;
    reasoning: string;
  } | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  
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

  // Generate AI content suggestions
  const generateAISuggestions = async () => {
    if (!productDescription || productDescription.trim().length < 20) return;
    
    setGeneratingSuggestions(true);
    
    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'suggest-ad-content',
        { 
          productDescription,
          currentCTA: primaryGoal,
          mediaUrl: previewUrl || assetUrl,
          mediaType: uploadType,
          textContent: uploadType === 'text' ? textContent : null
        }
      );
      
      if (error) {
        console.error('AI content suggestion failed:', error);
        return;
      }
      
      if (data) {
        setAiSuggestions(data);
        
        // Auto-fill fields if they're empty
        if (!headline && data.headline) {
          setHeadline(data.headline);
        }
        if (!bodyCopy && data.bodyCopy) {
          setBodyCopy(data.bodyCopy);
        }
        if (!landingUrl && data.suggestedURL && primaryGoal === 'website') {
          setLandingUrl(data.suggestedURL);
        }
        
        toast({
          title: "✨ AI suggestions ready",
          description: data.reasoning || "Content suggestions generated"
        });
      }
    } catch (error) {
      console.error('AI suggestion generation error:', error);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  // Auto-generate content suggestions when product description or media changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productDescription && productDescription.trim().length >= 20) {
        generateAISuggestions();
      }
    }, 2000); // Debounce 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [productDescription, uploadedFile, textContent, previewUrl]);

  // Auto-generate targeting when product description changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productDescription && productDescription.trim().length >= 10 && targetingOptions.length === 0) {
        generateAITargeting();
      }
    }, 1500); // Debounce 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [productDescription]);

  // Auto-generate ad when user completes required fields
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-generate if:
      // 1. Description has sufficient content
      // 2. Required files are uploaded (unless text mode)
      // 3. At least one platform is selected
      // 4. At least one contact method provided (phone, email, or URL)
      // 5. Ad hasn't been generated yet
      // 6. Not currently generating
      const hasValidDescription = productDescription && productDescription.trim().length >= 20;
      const hasRequiredUpload = uploadType === 'text' || uploadedFile !== null;
      const hasPlatformSelected = metaSubPlatforms.facebook || metaSubPlatforms.instagram;
      const hasContactInfo = contactPhone || contactEmail || landingUrl;
      
      if (hasValidDescription && hasRequiredUpload && hasPlatformSelected && hasContactInfo && !hasGenerated && !generating) {
        console.log('Auto-triggering ad generation - all required fields complete');
        handleGenerateAd();
      }
    }, 2000); // Wait 2 seconds after user stops typing/interacting

    return () => clearTimeout(timer);
  }, [
    productDescription, 
    uploadedFile, 
    uploadType, 
    metaSubPlatforms, 
    contactPhone,
    contactEmail,
    landingUrl,
    hasGenerated, 
    generating
  ]);

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
    const sanitized = value.slice(0, 100);
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
    // Validate Campaign Name
    if (!campaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for your campaign",
        variant: "destructive"
      });
      return;
    }

    // Validate Headline (required by Meta)
    if (!headline.trim()) {
      toast({
        title: "Headline required",
        description: "Please enter a headline for your ad (required by Meta)",
        variant: "destructive"
      });
      return;
    }

    // Validate Body Copy (required by Meta)
    if (!bodyCopy.trim()) {
      toast({
        title: "Body copy required",
        description: "Please enter the ad description (required by Meta)",
        variant: "destructive"
      });
      return;
    }

    // Validate Product Description
    if (!productDescription.trim()) {
      toast({
        title: "Description required",
        description: "Please describe your product or service",
        variant: "destructive"
      });
      return;
    }

    // Validate Landing URL when website goal is selected
    if (primaryGoal === 'website' && !landingUrl?.trim()) {
      toast({
        title: "Landing URL required",
        description: "Please enter your website URL (required by Meta)",
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
          meta_sub_platforms: metaSubPlatforms, // CRITICAL: Store platform selections to prevent fund mismanagement
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

  const handleTogglePreview = () => {
    const newShowPreview = !showMobilePreview;
    setShowMobilePreview(newShowPreview);
    
    // If showing preview, scroll to it smoothly after a brief delay to allow render
    if (newShowPreview && previewRef.current) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  // Handle URL import data
  const handleUrlImportComplete = async (data: {
    url: string;
    images: string[];
    selectedImage: string | null;
    content: string;
    title: string;
    generatedAd?: {
      headline: string;
      bodyCopy: string;
      ctaText: string;
    };
    targeting?: {
      suggestedLocation: string;
      suggestedBudget: number;
      audienceSummary: string;
    };
  }) => {
    if (data.generatedAd && data.targeting && data.selectedImage) {
      // Create campaign in database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Upload selected image to storage
        const timestamp = Date.now();
        const imageResponse = await fetch(data.selectedImage);
        const imageBlob = await imageResponse.blob();
        const fileName = `campaign-${timestamp}-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-assets')
          .upload(`${user.id}/${fileName}`, imageBlob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-assets')
          .getPublicUrl(uploadData.path);

        // Create campaign
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            name: data.title,
            user_id: user.id,
            status: 'draft',
            landing_url: data.url,
            target_location: data.targeting.suggestedLocation,
            daily_budget: data.targeting.suggestedBudget
          })
          .select()
          .single();

        if (campaignError) throw campaignError;

        // Store image as campaign asset
        await supabase.from('campaign_assets').insert({
          campaign_id: campaign.id,
          asset_type: 'image',
          asset_url: publicUrl
        });

        // Set state for review screen
        setCampaignId(campaign.id);
        setAssetUrl(publicUrl);
        setUrlReviewData({
          selectedImage: publicUrl,
          headline: data.generatedAd.headline,
          bodyCopy: data.generatedAd.bodyCopy,
          ctaText: data.generatedAd.ctaText,
          sourceUrl: data.url,
          businessName: data.title,
          targeting: data.targeting
        });
        setCreationMethod('url-review');
      } catch (error) {
        console.error('Error creating campaign:', error);
        toast({
          title: "Failed to create campaign",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    } else {
      // Fallback to scratch flow (shouldn't happen)
      setCreationMethod('scratch');
    }
  };

  return (
    <AppLayout>
      <section className="space-y-6 px-4 lg:px-8">
        
        {/* Initial Method Selection */}
        {creationMethod === 'select' && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-center">Create Campaign</h1>
            <CreationMethodSelector onSelectMethod={(method) => setCreationMethod(method)} />
          </>
        )}

        {/* URL Import Flow */}
        {creationMethod === 'url' && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Import from URL</h1>
            <URLImport
              onContentExtracted={handleUrlImportComplete}
              onBack={() => setCreationMethod('select')}
            />
          </>
        )}

        {/* URL Ad Review Flow */}
        {creationMethod === 'url-review' && urlReviewData && (
          <URLAdReview
            campaignId={campaignId || ''}
            selectedImage={urlReviewData.selectedImage}
            headline={urlReviewData.headline}
            bodyCopy={urlReviewData.bodyCopy}
            ctaText={urlReviewData.ctaText}
            sourceUrl={urlReviewData.sourceUrl}
            businessName={urlReviewData.businessName}
            targeting={urlReviewData.targeting}
            onBack={() => setCreationMethod('url')}
            onPublish={(publishData) => {
              // Navigate to campaign publish with all data
              navigate(`/campaign-publish/${campaignId}`, {
                state: {
                  headline: publishData.headline,
                  bodyCopy: publishData.bodyCopy,
                  ctaText: publishData.ctaText,
                  destinationType: publishData.destinationType,
                  destination: publishData.destination,
                  location: publishData.location,
                  dailyBudget: publishData.dailyBudget,
                  platforms: publishData.platforms
                }
              });
            }}
          />
        )}

        {/* Standard Creation Flow */}
        {creationMethod === 'scratch' && (
          <>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Create Campaign</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreationMethod('select')}
          >
            ← Start Over
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1400px] mx-auto">
          {/* Left column – All Controls and Targeting */}
          <div className="w-full lg:w-1/2 lg:flex-shrink-0">
            <Card className="w-full p-6">
              <div className="space-y-6">
            {/* Meta Requirements Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Meta Requirements:</strong> Campaign Name, Headline, Body Copy, and Landing URL are required by Meta to publish your ad. Product Description helps our AI understand your offering.
              </AlertDescription>
            </Alert>

            {/* Upload Section */}
            <div>
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
                  <Label htmlFor="campaign-name-text">Campaign Name *</Label>
                  <Input
                    id="campaign-name-text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Summer Sale 2024"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Internal name for your campaign</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="headline-text">Headline *</Label>
                    {aiSuggestions?.headline && headline !== aiSuggestions.headline && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setHeadline(aiSuggestions.headline)}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use AI
                      </Button>
                    )}
                  </div>
                  <Input
                    id="headline-text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Live your life unapologetically"
                    maxLength={40}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">{headline.length}/40 characters - Main headline shown to customers</p>
                  {aiSuggestions?.headline && headline !== aiSuggestions.headline && (
                    <button
                      type="button"
                      onClick={() => setHeadline(aiSuggestions.headline)}
                      className="text-xs text-primary hover:text-primary/80 mt-1 text-left transition-colors cursor-pointer underline decoration-dotted"
                    >
                      💡 AI suggests: "{aiSuggestions.headline}" — Click to use
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="body-copy-text">Body Copy *</Label>
                    {aiSuggestions?.bodyCopy && bodyCopy !== aiSuggestions.bodyCopy && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBodyCopy(aiSuggestions.bodyCopy)}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use AI
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="body-copy-text"
                    value={bodyCopy}
                    onChange={(e) => setBodyCopy(e.target.value)}
                    placeholder="e.g., Discover our latest collection designed for modern living..."
                    maxLength={125}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bodyCopy.length}/125 characters - Description shown with your ad</p>
                  {aiSuggestions?.bodyCopy && bodyCopy !== aiSuggestions.bodyCopy && (
                    <button
                      type="button"
                      onClick={() => setBodyCopy(aiSuggestions.bodyCopy)}
                      className="text-xs text-primary hover:text-primary/80 mt-1 text-left transition-colors cursor-pointer underline decoration-dotted"
                    >
                      💡 AI suggests: "{aiSuggestions.bodyCopy}" — Click to use
                    </button>
                  )}
                </div>

                <div>
                  <Label htmlFor="description-text">Tell us what your product or service does for your audience and how much it costs if you want to let your audience know</Label>
                  <Textarea
                    id="description-text"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe what you're advertising..."
                    rows={6}
                  />
                  {generatingSuggestions && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      AI is analyzing your description...
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

            {/* Campaign Details - Only show for image/video uploads */}
            {uploadType !== 'text' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Summer Sale 2024"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Internal name for your campaign</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="headline">Headline *</Label>
                    {aiSuggestions?.headline && headline !== aiSuggestions.headline && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setHeadline(aiSuggestions.headline)}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use AI
                      </Button>
                    )}
                  </div>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Live your life unapologetically"
                    maxLength={40}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">{headline.length}/40 characters - Main headline shown to customers</p>
                  {aiSuggestions?.headline && headline !== aiSuggestions.headline && (
                    <button
                      type="button"
                      onClick={() => setHeadline(aiSuggestions.headline)}
                      className="text-xs text-primary hover:text-primary/80 mt-1 text-left transition-colors cursor-pointer underline decoration-dotted"
                    >
                      💡 AI suggests: "{aiSuggestions.headline}" — Click to use
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="body-copy">Body Copy *</Label>
                    {aiSuggestions?.bodyCopy && bodyCopy !== aiSuggestions.bodyCopy && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBodyCopy(aiSuggestions.bodyCopy)}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use AI
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="body-copy"
                    value={bodyCopy}
                    onChange={(e) => setBodyCopy(e.target.value)}
                    placeholder="e.g., Discover our latest collection designed for modern living..."
                    maxLength={125}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bodyCopy.length}/125 characters - Description shown with your ad</p>
                  {aiSuggestions?.bodyCopy && bodyCopy !== aiSuggestions.bodyCopy && (
                    <button
                      type="button"
                      onClick={() => setBodyCopy(aiSuggestions.bodyCopy)}
                      className="text-xs text-primary hover:text-primary/80 mt-1 text-left transition-colors cursor-pointer underline decoration-dotted"
                    >
                      💡 AI suggests: "{aiSuggestions.bodyCopy}" — Click to use
                    </button>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Tell us what your product or service does for your audience and how much it costs if you want to let your audience know</Label>
                  <Textarea
                    id="description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe what you're advertising..."
                    rows={4}
                />
                {generatingSuggestions && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI is analyzing your description...
                  </div>
                )}
              </div>
            </div>
            )}

            {/* AI CTA Recommendation */}
            {aiSuggestions?.recommendedCTA && (
              <Alert className="bg-primary/5 border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      🎯 AI recommends: {aiSuggestions.recommendedCTA === 'website' ? 'Visit my website' : 
                         aiSuggestions.recommendedCTA === 'calls' ? 'Call my phone' :
                         aiSuggestions.recommendedCTA === 'email' ? 'Send me an email' :
                         aiSuggestions.recommendedCTA === 'messages' ? 'Message me' : 'Fill out lead form'}
                    </p>
                    <p className="text-xs text-muted-foreground">{aiSuggestions.reasoning}</p>
                    {primaryGoal !== aiSuggestions.recommendedCTA && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPrimaryGoal(aiSuggestions.recommendedCTA)}
                        className="h-7 text-xs mt-2"
                      >
                        Use this recommendation
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Contact Section */}
            <div>
            <CampaignContactSection
              primaryGoal={primaryGoal}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              landingUrl={landingUrl}
              suggestedUrl={aiSuggestions?.suggestedURL}
              onPrimaryGoalChange={setPrimaryGoal}
              onContactPhoneChange={setContactPhone}
              onContactEmailChange={setContactEmail}
              onLandingUrlChange={setLandingUrl}
            />
            </div>

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
              <div className="space-y-2">
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
                onClick={() => {
                  // Check if user is on free tier
                  if (effectiveTier === 'free') {
                    setUpgradeModalAdData({
                      image: previewUrl || assetUrl || '',
                      headline,
                      bodyCopy,
                      ctaText
                    });
                    setShowUpgradeModal(true);
                    return;
                  }
                  // Proceed with normal publish for paid users
                  navigate(`/targeting/${campaignId}`);
                }}
                className="w-full"
                size="lg"
              >
                Continue to Publishing →
              </Button>
              </div>
            )}
            
            {/* AI Targeting Section - moved from right column */}
            {productDescription && productDescription.trim().length >= 10 && (
              <div className="space-y-3 pt-6 border-t">
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
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-medium ${manualOverrides.budget ? 'text-yellow-700' : 'text-black'}`}>
                          ${dailyBudget}/day
                        </div>
                        {manualOverrides.budget && (
                          <div className="text-xs text-black/60">✏️ Edited</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-black/60">
                        <span>Weekly: ${(dailyBudget * 7).toFixed(0)}</span>
                        <span>Monthly: ${(dailyBudget * 30).toFixed(0)}</span>
                      </div>
                      {(() => {
                        const selectedPlatforms: Array<'meta'> = [];
                        if (metaSubPlatforms.facebook || metaSubPlatforms.instagram) {
                          selectedPlatforms.push('meta');
                        }
                        const minDaily = getMinimumDailySpend(selectedPlatforms);
                        return dailyBudget < minDaily && selectedPlatforms.length > 0 ? (
                          <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>Meta requires ${minDaily}/day minimum. You can still proceed, but ads may not deliver optimally.</span>
                          </div>
                        ) : null;
                      })()}
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
                      <Alert className="mt-3 bg-muted/50 border-muted-foreground/20">
                        <div className="flex gap-2 items-start">
                          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Meta uses a unified budget system—you'll pay the same daily rate whether you advertise on Facebook only, Instagram only, or both. We recommend keeping both checked for maximum reach at no extra cost.
                          </p>
                        </div>
                      </Alert>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
          </div>

        {/* Right column – Live Preview Only */}
        <div 
          ref={previewRef}
          className={`w-full lg:w-1/2 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start transition-all duration-300 ${showMobilePreview ? 'block animate-fade-in' : 'hidden'} lg:block`}
        >
          <Card className="w-full p-6">
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
                      className="w-full h-full object-contain"
                      controls
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={previewUrl || assetUrl || ''}
                      alt="Ad creative"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {effectiveTier === 'free' && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">
                      Powered by xiXoi™
                    </div>
                  )}
                </div>
              )}
              
              {/* Content - Editable */}
              <div className="p-3 space-y-3 bg-background">
                <div>
                  <Label htmlFor="preview-headline" className="text-xs text-muted-foreground mb-1 block">Headline</Label>
                  <Input
                    id="preview-headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Your headline will appear here"
                    className="font-semibold text-sm h-auto py-1 px-2 border-dashed"
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{headline.length}/40</p>
                </div>
                <div>
                  <Label htmlFor="preview-body" className="text-xs text-muted-foreground mb-1 block">Body Copy</Label>
                  <Textarea
                    id="preview-body"
                    value={bodyCopy}
                    onChange={(e) => setBodyCopy(e.target.value)}
                    placeholder="Your ad copy will appear here..."
                    className="text-sm min-h-[60px] border-dashed resize-none"
                    maxLength={125}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bodyCopy.length}/125</p>
                </div>
                <div className="pt-1">
                  <Label htmlFor="preview-cta" className="text-xs text-muted-foreground mb-1 block">Call-to-Action</Label>
                  <Input
                    id="preview-cta"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Learn More"
                    className="text-center font-semibold border-dashed h-9"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{ctaText.length}/20</p>
                </div>
              </div>
            </Card>
          </Card>
        </div>
      </div>

      {/* Mobile Preview Toggle FAB */}
      <Button
        onClick={handleTogglePreview}
        className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-transform hover:scale-110"
        size="icon"
      >
        {showMobilePreview ? (
          <EyeOff className="h-6 w-6" />
        ) : (
          <Eye className="h-6 w-6" />
        )}
      </Button>
          </>
        )}

        {/* Free Upgrade Modal */}
        <FreeUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          campaignId={campaignId || ''}
          adData={upgradeModalAdData || { image: '', headline: '', bodyCopy: '', ctaText: '' }}
        />
      </section>
    </AppLayout>
  );
}
