import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, Sparkles, Image as ImageIcon, ChevronRight, Save, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { supabase } from "@/integrations/supabase/client";
import { SavedImagesLibrary } from "@/components/SavedImagesLibrary";

interface URLImportProps {
  onContentExtracted: (data: {
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
  const [showSavedLibrary, setShowSavedLibrary] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

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
        const extractedImages = data.images || [];
        
        setExtractedData({
          images: extractedImages,
          content: data.content,
          title: data.title || 'Untitled'
        });

        // Auto-select first image if available
        if (extractedImages.length > 0) {
          setSelectedImage(extractedImages[0]);
        }

        toast({
          title: "✨ Content extracted",
          description: `Found ${extractedImages.length} images. Generating 2 AI variants...`
        });

        // Automatically generate 2 AI images
        setGeneratingImage(true);
        const generatedImages: string[] = [];

        for (let i = 0; i < 2; i++) {
          try {
            const { data: imageData, error: imageError } = await invokeWithRetry(
              supabase,
              'generate-image-from-description',
              { 
                description: data.content.slice(0, 500),
                title: data.title
              }
            );

            if (imageError) throw imageError;
            if (imageData?.imageUrl) {
              generatedImages.push(imageData.imageUrl);
            }
          } catch (err) {
            console.error(`Failed to generate AI image ${i + 1}:`, err);
          }
        }

        setGeneratingImage(false);

        if (generatedImages.length > 0) {
          setExtractedData(prev => prev ? {
            ...prev,
            images: [...generatedImages, ...extractedImages]
          } : null);
          
          // Auto-select first generated image if no extracted images
          if (extractedImages.length === 0) {
            setSelectedImage(generatedImages[0]);
          }

          toast({
            title: "✨ Ready to publish",
            description: `${extractedImages.length + generatedImages.length} images ready. Select your favorite!`
          });
        }
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
      setGeneratingImage(false);
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

  const handleSaveImage = async (imageUrl: string, prompt: string) => {
    setSavingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save images",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('saved_images')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          image_type: 'ai_generated',
          prompt_used: prompt
        });

      if (error) throw error;

      toast({
        title: "✓ Image saved",
        description: "Added to your library for future use"
      });
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Save failed",
        description: "Could not save image to library",
        variant: "destructive"
      });
    } finally {
      setSavingImage(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedImage || !extractedData) return;
    
    setLoading(true);
    
    try {
      // Call AI generation functions in parallel
      const [variantsResult, targetingResult] = await Promise.all([
        invokeWithRetry(supabase, 'generate-ad-variants', {
          productDescription: extractedData.content,
          mediaUrl: selectedImage,
          mediaType: 'image'
        }),
        invokeWithRetry(supabase, 'generate-targeting', {
          productDescription: extractedData.content
        })
      ]);

      if (variantsResult.error) throw new Error(variantsResult.error.message);
      if (targetingResult.error) throw new Error(targetingResult.error.message);

      const variant = variantsResult.data?.variants?.[0];
      const targeting = targetingResult.data?.options?.[0];

      if (!variant || !targeting) {
        throw new Error('Failed to generate ad content');
      }

      // Pass generated data back to parent
      onContentExtracted({
        url,
        images: extractedData.images,
        selectedImage,
        content: extractedData.content,
        title: extractedData.title,
        generatedAd: {
          headline: variant.headline || 'Your headline',
          bodyCopy: variant.body_copy || 'Your ad copy',
          ctaText: variant.cta_text || 'Learn More'
        },
        targeting: {
          suggestedLocation: targeting.suggestedLocation,
          suggestedBudget: targeting.suggestedBudget,
          audienceSummary: targeting.audienceSummary
        }
      });
    } catch (error) {
      console.error('Error generating ad:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate ad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavedLibrary(true)}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    My Library
                  </Button>
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
              </div>

              {extractedData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {extractedData.images.map((img, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all hover:shadow-lg group protected-image ${
                        selectedImage === img ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <img
                          src={img}
                          alt={`Option ${idx + 1}`}
                          className="w-full h-full object-cover select-none pointer-events-none"
                          draggable="false"
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                        {selectedImage === img && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                        {/* Save button for AI-generated images */}
                        {idx < 2 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveImage(img, extractedData.content);
                            }}
                            disabled={savingImage}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
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
              disabled={!selectedImage || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Your Ad...
                </>
              ) : (
                <>
                  Continue with Selected Content
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Saved Images Library Modal */}
      <SavedImagesLibrary
        isOpen={showSavedLibrary}
        onClose={() => setShowSavedLibrary(false)}
        onSelectImage={(imageUrl) => {
          setSelectedImage(imageUrl);
          setExtractedData(prev => prev ? {
            ...prev,
            images: [imageUrl, ...prev.images]
          } : null);
        }}
      />
    </div>
  );
};