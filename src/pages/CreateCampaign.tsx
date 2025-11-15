import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Image, Video, FileText, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function CreateCampaign() {
  const [user, setUser] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'text'>('image');
  const [textContent, setTextContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [mediaRightsConfirmed, setMediaRightsConfirmed] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    meta: { selected: boolean; budget: number };
    tiktok: { selected: boolean; budget: number };
    google: { selected: boolean; budget: number };
    linkedin: { selected: boolean; budget: number };
  }>({
    meta: { selected: true, budget: 20 },
    tiktok: { selected: false, budget: 20 },
    google: { selected: false, budget: 20 },
    linkedin: { selected: false, budget: 20 },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Character limits for each platform
  const platformLimits = {
    meta: 125,
    linkedin: 150,
    tiktok: 100,
    google: 90
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

  const handleCreateCampaign = async () => {
    console.log('Button clicked! User:', user, 'TextContent:', textContent, 'UploadType:', uploadType, 'File:', uploadedFile);
    
    if (!user) {
      console.log('No user found, returning');
      return;
    }

    // Check user plan and enforce tier limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';

    // FREE TIER: 1 ad per day limit
    if (userPlan === 'free') {
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
    try {
      // Create campaign with media rights confirmation
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: campaignName || 'Untitled Campaign',
          status: 'draft',
          media_rights_confirmed_at: new Date().toISOString(),
        })
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

      // Trigger AI generation
      const { error: generateError } = await supabase.functions.invoke('generate-ad-variants', {
        body: { campaignId: campaign.id }
      });

      if (generateError) {
        console.error('AI generation error:', generateError);
        throw generateError;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/20 bg-black">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-white hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <video 
              src="/xiXoiLogo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-xl md:text-2xl font-bold text-white">xiXoi™</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">Create New Campaign</h2>
            <p className="text-muted-foreground">Upload your content and let AI do the rest</p>
          </div>

          <div className="border border-foreground rounded-2xl p-8 space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-wide">Campaign Name</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="My Product Campaign"
                className="border-foreground"
              />
            </div>

            {/* Upload Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wide">Upload Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setUploadType('image')}
                  className={`border-2 rounded-xl p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'image' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm font-medium">Image</span>
                </button>
                
                <button
                  onClick={() => setUploadType('video')}
                  className={`border-2 rounded-xl p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'video' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <Video className="w-8 h-8" />
                  <span className="text-sm font-medium">Video</span>
                </button>
                
                <button
                  onClick={() => setUploadType('text')}
                  className={`border-2 rounded-xl p-6 flex flex-col items-center gap-3 transition-all ${
                    uploadType === 'text' ? 'border-foreground bg-foreground/5' : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  <FileText className="w-8 h-8" />
                  <span className="text-sm font-medium">Text</span>
                </button>
              </div>
            </div>

            {/* Content Input - Always show description */}
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-wide">Product/Service Description *</label>
              <p className="text-xs text-muted-foreground">
                Include: What you're selling, key features, price (if applicable), target audience, and how to contact you. AI will optimize this for each platform's character limits.
              </p>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Sunlit 23sqm studio, $2500/mo. Modern, bright, and steps from Miami cafés + shoreline. Call 555-321-7788. Alex Rivera, Realtor®, OceanGate Realty."
                className="border-foreground min-h-[120px] placeholder:opacity-40"
              />
              <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">
                  ✓ Meta: 125 chars • TikTok: 100 chars • Google: 90 chars • LinkedIn: 150 chars
                </p>
                <p className={`font-medium ${
                  isOverLimit 
                    ? 'text-destructive' 
                    : isNearLimit 
                      ? 'text-yellow-600 dark:text-yellow-500' 
                      : 'text-muted-foreground'
                }`}>
                  {characterCount} / {characterLimit}
                  {isOverLimit && ' ⚠️'}
                </p>
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
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
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
                    <div className="space-y-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 mx-auto object-contain"
                      />
                      <p className="text-foreground text-sm font-medium">{uploadedFile?.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB`} • Click or drag to change
                      </p>
                    </div>
                  ) : previewUrl && uploadType === 'video' ? (
                    <div className="space-y-2">
                      <video 
                        src={previewUrl} 
                        controls
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-muted-foreground text-xs">
                        {uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB`} • Click or drag to change
                      </p>
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

            {/* Media Rights Confirmation */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
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
              disabled={loading || !textContent || !mediaRightsConfirmed || ((uploadType === 'image' || uploadType === 'video') && !uploadedFile)}
            >
              {loading ? "Generating..." : !mediaRightsConfirmed ? "Confirm content rights to continue" : !textContent ? "Fill description to continue" : ((uploadType === 'image' || uploadType === 'video') && !uploadedFile) ? `Upload ${uploadType} to continue` : "Let me see..."}
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
      </main>

      {/* Preview Modal */}
      {showPreview && createdCampaignId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-background border border-foreground max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold">Here's what xiXoi™ created</h2>
                <p className="text-muted-foreground">
                  {generatedVariants.length === 1 
                    ? "AI generated 1 platform-optimized variant (free tier)" 
                    : `AI generated ${generatedVariants.length} platform-optimized variants`}
                </p>
                {generatedVariants.length > 1 && (
                  <p className="text-xs text-muted-foreground">Select one variant to publish</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedVariants.map((variant, index) => (
                  <div 
                    key={variant.id} 
                    className={`border-2 bg-background p-6 space-y-4 cursor-pointer transition-all ${
                      generatedVariants.length > 1 
                        ? (selectedVariantId === variant.id 
                            ? 'border-foreground shadow-lg' 
                            : 'border-foreground/20 hover:border-foreground/50')
                        : 'border-foreground'
                    }`}
                    onClick={() => {
                      if (generatedVariants.length > 1) {
                        setSelectedVariantId(variant.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">{variant.variant_type}</span>
                      <div className="flex items-center gap-2">
                        {generatedVariants.length > 1 && selectedVariantId === variant.id && (
                          <span className="text-xs font-bold bg-foreground text-background px-2 py-1">SELECTED</span>
                        )}
                        <span className="text-xs text-muted-foreground">ROAS: {variant.predicted_roas}x</span>
                      </div>
                    </div>
                    
                    {/* Show uploaded image from creative_url */}
                    {variant.creative_url && (
                      <div className="w-full aspect-square bg-muted overflow-hidden">
                        <img 
                          src={variant.creative_url} 
                          alt="Campaign creative" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="bg-foreground text-background px-4 py-3">
                      <div className="text-sm font-bold">{variant.headline}</div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">{variant.body_copy}</p>
                    </div>

                    <div className="border-2 border-foreground py-2 px-4 text-center">
                      <span className="font-bold text-sm">{variant.cta_text || 'LEARN MORE'}</span>
                    </div>

                    <div className="text-right text-[14px] opacity-60">
                      Powered By xiXoi™
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button 
                  onClick={() => {
                    if (generatedVariants.length > 1 && !selectedVariantId) {
                      toast({
                        variant: "destructive",
                        title: "Selection Required",
                        description: "Please select one variant to continue",
                      });
                      return;
                    }
                    setShowPreview(false);
                    setShowPlatformSelection(true);
                  }}
                  className="flex-1"
                >
                  Choose Platforms
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
