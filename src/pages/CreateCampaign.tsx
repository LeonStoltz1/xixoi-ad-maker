import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Image, Video, FileText } from "lucide-react";
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    // Validate file size
    const maxSize = uploadType === 'image' ? 5 * 1024 * 1024 : 200 * 1024 * 1024; // 5MB for images, 200MB for videos
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Maximum file size is ${uploadType === 'image' ? '5MB' : '200MB'}. Please choose a smaller file.`,
      });
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validVideoTypes = ['video/mp4', 'video/quicktime'];
    
    if (uploadType === 'image' && !validImageTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG, or PNG image.",
      });
      return;
    }

    if (uploadType === 'video' && !validVideoTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an MP4 or MOV video.",
      });
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL for images
    if (uploadType === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
    if (!user) return;

    setLoading(true);
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: campaignName || 'Untitled Campaign',
          status: 'draft',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create asset
      const { error: assetError } = await supabase
        .from('campaign_assets')
        .insert({
          campaign_id: campaign.id,
          asset_type: uploadType,
          asset_text: uploadType === 'text' ? textContent : null,
        });

      if (assetError) throw assetError;

      // Trigger AI generation
      const { error: generateError } = await supabase.functions.invoke('generate-ad-variants', {
        body: { campaignId: campaign.id }
      });

      if (generateError) {
        console.error('AI generation error:', generateError);
      }

      setCreatedCampaignId(campaign.id);
      setShowPaymentModal(true);
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
            <h1 className="text-2xl font-bold text-white">xiXoi™</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Create New Campaign</h2>
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
                placeholder="Example: Studio apartment, 23sqm, $2500/mo. Modern finishes, downtown location. Contact +1404.775.1998 Mon-Fri. Perfect for young professionals."
                className="border-foreground min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                ✓ Meta: Optimized for 125 chars • TikTok: 100 chars • Google: 90 chars • LinkedIn: 150 chars
              </p>
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
                      Formats: MP4, MOV • Max size: 200MB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 9:16 (vertical), 1:1 (square), or 16:9 (landscape) • Min 720p resolution
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
                    accept={uploadType === 'image' ? 'image/jpeg,image/jpg,image/png' : 'video/mp4,video/quicktime'}
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
                      <p className="text-muted-foreground text-xs">Click or drag to change image</p>
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

            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleCreateCampaign}
              disabled={loading || !textContent || ((uploadType === 'image' || uploadType === 'video') && !uploadedFile)}
            >
              {loading ? "Generating..." : "Pay to Publish"}
            </Button>
          </div>
        </div>
      </main>

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
