import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Image, Video, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";

export default function CreateCampaign() {
  const [user, setUser] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'text'>('text');
  const [textContent, setTextContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
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
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Describe your product or service so AI can create your ad..."
                className="border-foreground min-h-[120px]"
              />
            </div>

            {(uploadType === 'image' || uploadType === 'video') && (
              <div className="space-y-2">
                <label className="text-sm font-medium uppercase tracking-wide">
                  Upload {uploadType === 'image' ? 'Image' : 'Video'}
                </label>
                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-12 text-center">
                  <input
                    type="file"
                    accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {uploadedFile ? (
                      <p className="text-foreground font-medium">{uploadedFile.name}</p>
                    ) : (
                      <p className="text-muted-foreground">Click to upload {uploadType}</p>
                    )}
                  </label>
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

      {/* Payment Modal */}
      {createdCampaignId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          campaignId={createdCampaignId}
        />
      )}
    </div>
  );
}
