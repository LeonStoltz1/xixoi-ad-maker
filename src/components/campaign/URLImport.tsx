import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, Sparkles, Image as ImageIcon, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { supabase } from "@/integrations/supabase/client";

interface URLImportProps {
  onContentExtracted: (data: {
    url: string;
    images: string[];
    selectedImage: string | null;
    content: string;
    title: string;
  }) => void;
  onBack: () => void;
}

export const URLImport = ({ onContentExtracted, onBack }: URLImportProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    images: string[];
    content: string;
    title: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleExtractContent = async () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a website URL",
        variant: "destructive"
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'process-url-content',
        { url }
      );

      if (error) throw error;

      if (data && data.images && data.content) {
        setExtractedData({
          images: data.images || [],
          content: data.content,
          title: data.title || 'Untitled'
        });

        // Auto-select first image if available
        if (data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }

        toast({
          title: "✨ Content extracted",
          description: `Found ${data.images.length} images and page content`
        });
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      toast({
        title: "Extraction failed",
        description: error.message || "Could not extract content from URL",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!extractedData?.content) return;

    setGeneratingImage(true);

    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'generate-image-from-description',
        { 
          description: extractedData.content.slice(0, 500),
          title: extractedData.title
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        // Add generated image to the list
        setExtractedData(prev => prev ? {
          ...prev,
          images: [data.imageUrl, ...prev.images]
        } : null);
        setSelectedImage(data.imageUrl);

        toast({
          title: "✨ Image generated",
          description: "AI created a custom image for your ad"
        });
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate image",
        variant: "destructive"
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleContinue = () => {
    if (!extractedData) return;

    onContentExtracted({
      url,
      images: extractedData.images,
      selectedImage,
      content: extractedData.content,
      title: extractedData.title
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Method Selection
        </Button>
      </div>

      <Card className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Import from URL</h3>
              <p className="text-muted-foreground">We'll extract images and content automatically</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="url">Website or Product Page URL *</Label>
            <div className="flex gap-3">
              <Input
                id="url"
                type="url"
                placeholder="https://yourwebsite.com/product"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExtractContent()}
                className="flex-1"
                disabled={loading}
              />
              <Button 
                onClick={handleExtractContent}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {extractedData && (
          <div className="space-y-6 pt-6 border-t">
            <div>
              <h4 className="font-semibold mb-3">Extracted Content</h4>
              <Alert>
                <AlertDescription className="text-sm line-clamp-3">
                  {extractedData.content}
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Select Image ({extractedData.images.length} found)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>

              {extractedData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {extractedData.images.map((img, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedImage === img ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <img
                          src={img}
                          alt={`Option ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                        {selectedImage === img && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <ImageIcon className="w-4 h-4" />
                  <AlertDescription>
                    No images found on this page. You can generate one with AI.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!selectedImage}
              className="w-full"
              size="lg"
            >
              Continue with Selected Content
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};