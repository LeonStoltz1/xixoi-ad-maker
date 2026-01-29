import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, Link2, Sparkles, Image as ImageIcon, 
  ChevronRight, Save, FolderOpen, RefreshCw, Globe, Wand2, RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRetry } from "@/lib/retryWithBackoff";
import { supabase } from "@/integrations/supabase/client";
import { SavedImagesLibrary } from "@/components/SavedImagesLibrary";

type ExtractionStep = 'idle' | 'fetching' | 'analyzing' | 'generating' | 'ready';

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

interface ImageWithMeta {
  url: string;
  isAI: boolean;
  isRecommended?: boolean;
  dimensions?: { width: number; height: number };
  style?: string;
}

interface DraftState {
  url: string;
  extractedData: {
    images: ImageWithMeta[];
    content: string;
    title: string;
  } | null;
  selectedImage: string | null;
  savedAt: number;
}

const DRAFT_KEY = 'xixoi_url_import_draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const STEP_LABELS: Record<ExtractionStep, string> = {
  idle: '',
  fetching: 'Fetching page content...',
  analyzing: 'Analyzing images...',
  generating: 'Generating AI variants...',
  ready: 'Ready!'
};

const STEP_PROGRESS: Record<ExtractionStep, number> = {
  idle: 0,
  fetching: 20,
  analyzing: 40,
  generating: 70,
  ready: 100
};

// AI image style variations for diversity
const AI_STYLE_PROMPTS = [
  "Modern, clean product photography style with soft lighting",
  "Lifestyle context showing the product in real-world use",
  "Bold, attention-grabbing ad creative with vibrant colors"
];

export const URLImport = ({ onContentExtracted, onBack }: URLImportProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractionStep, setExtractionStep] = useState<ExtractionStep>('idle');
  const [extractedData, setExtractedData] = useState<{
    images: ImageWithMeta[];
    content: string;
    title: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 2 });
  const [showSavedLibrary, setShowSavedLibrary] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);
  
  // Prefetched targeting data (generated in parallel)
  const prefetchedTargetingRef = useRef<{
    suggestedLocation: string;
    suggestedBudget: number;
    audienceSummary: string;
  } | null>(null);
  const prefetchedAdRef = useRef<{
    headline: string;
    bodyCopy: string;
    ctaText: string;
  } | null>(null);
  
  // AbortController for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        const isExpired = Date.now() - draft.savedAt > DRAFT_EXPIRY_MS;
        if (!isExpired && draft.url && draft.extractedData) {
          setHasDraft(true);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // Auto-save draft when state changes
  useEffect(() => {
    if (extractedData && url) {
      const draft: DraftState = {
        url,
        extractedData,
        selectedImage,
        savedAt: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [url, extractedData, selectedImage]);

  const restoreDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        setUrl(draft.url);
        setExtractedData(draft.extractedData);
        setSelectedImage(draft.selectedImage);
        setExtractionStep('ready');
        setHasDraft(false);
        toast({
          title: "Draft restored",
          description: "Your previous session has been recovered"
        });
      }
    } catch {
      toast({
        title: "Restore failed",
        description: "Could not restore draft",
        variant: "destructive"
      });
    }
  }, [toast]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, []);

  const handleImageError = useCallback((imageUrl: string) => {
    setImageLoadErrors(prev => new Set(prev).add(imageUrl));
  }, []);

  const handleImageLoad = useCallback((imageUrl: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setExtractedData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        images: prev.images.map(image => 
          image.url === imageUrl 
            ? { ...image, dimensions: { width: img.naturalWidth, height: img.naturalHeight } }
            : image
        )
      };
    });
  }, []);

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

    // Cancel any in-flight requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setExtractionStep('fetching');
    setImageLoadErrors(new Set());
    setGenerationProgress({ completed: 0, total: 2 });
    prefetchedTargetingRef.current = null;
    prefetchedAdRef.current = null;
    clearDraft();

    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'process-url-content',
        { url }
      );

      if (error) throw error;

      setExtractionStep('analyzing');

      if (data && data.content) {
        const extractedImages: string[] = data.images || [];
        const extractedImagesWithMeta: ImageWithMeta[] = extractedImages.map((img, idx) => ({
          url: img,
          isAI: false,
          isRecommended: idx === 0
        }));
        
        setExtractionStep('generating');

        // Generate AI images in PARALLEL with STYLE VARIETY
        const aiImageCount = extractedImages.length === 0 ? 3 : 2;
        setGenerationProgress({ completed: 0, total: aiImageCount });

        const generateImage = async (index: number): Promise<ImageWithMeta | null> => {
          try {
            const style = AI_STYLE_PROMPTS[index % AI_STYLE_PROMPTS.length];
            const { data: imageData, error: imageError } = await invokeWithRetry(
              supabase,
              'generate-image-from-description',
              { 
                description: data.content.slice(0, 500),
                title: data.title,
                style // Pass style variation
              }
            );

            if (imageError) throw imageError;
            
            setGenerationProgress(prev => ({ 
              ...prev, 
              completed: prev.completed + 1 
            }));

            return imageData?.imageUrl ? {
              url: imageData.imageUrl,
              isAI: true,
              style
            } : null;
          } catch (err) {
            console.error(`Failed to generate AI image ${index + 1}:`, err);
            setGenerationProgress(prev => ({ 
              ...prev, 
              completed: prev.completed + 1 
            }));
            return null;
          }
        };

        // PARALLEL: Generate images AND prefetch targeting/ad copy
        const imagePromises = Array.from({ length: aiImageCount }, (_, i) => generateImage(i));
        
        const prefetchTargeting = async () => {
          try {
            const { data: targetingData, error: targetingError } = await invokeWithRetry(
              supabase, 
              'generate-targeting', 
              { productDescription: data.content }
            );
            if (!targetingError && targetingData?.options?.[0]) {
              prefetchedTargetingRef.current = {
                suggestedLocation: targetingData.options[0].suggestedLocation,
                suggestedBudget: targetingData.options[0].suggestedBudget,
                audienceSummary: targetingData.options[0].audienceSummary
              };
            }
          } catch (e) {
            console.warn('Targeting prefetch failed:', e);
          }
        };

        const prefetchAdCopy = async () => {
          try {
            const { data: variantsData, error: variantsError } = await invokeWithRetry(
              supabase,
              'generate-ad-variants',
              { productDescription: data.content, mediaType: 'image' }
            );
            if (!variantsError && variantsData?.variants?.[0]) {
              prefetchedAdRef.current = {
                headline: variantsData.variants[0].headline || 'Your headline',
                bodyCopy: variantsData.variants[0].body_copy || 'Your ad copy',
                ctaText: variantsData.variants[0].cta_text || 'Learn More'
              };
            }
          } catch (e) {
            console.warn('Ad copy prefetch failed:', e);
          }
        };

        // Run ALL in parallel: images + targeting + ad copy
        const [generatedImages] = await Promise.all([
          Promise.all(imagePromises),
          prefetchTargeting(),
          prefetchAdCopy()
        ]);
        
        const successfulImages = generatedImages.filter((img): img is ImageWithMeta => img !== null);
        
        // Mark first AI image as recommended if no website images
        if (successfulImages.length > 0 && extractedImages.length === 0) {
          successfulImages[0].isRecommended = true;
        }

        // Combine AI images first, then extracted images
        const allImages = [...successfulImages, ...extractedImagesWithMeta];

        setExtractedData({
          images: allImages,
          content: data.content,
          title: data.title || 'Untitled'
        });

        // Auto-select the recommended image
        const recommendedImage = allImages.find(img => img.isRecommended);
        if (recommendedImage) {
          setSelectedImage(recommendedImage.url);
        } else if (allImages.length > 0) {
          setSelectedImage(allImages[0].url);
        }

        setExtractionStep('ready');

        const prefetchStatus = prefetchedTargetingRef.current && prefetchedAdRef.current 
          ? 'Ad copy ready!' 
          : '';
        toast({
          title: "✨ Ready to create your ad",
          description: `${allImages.length} images available. ${prefetchStatus}`
        });
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      toast({
        title: "Extraction failed",
        description: error.message || "Could not extract content from URL",
        variant: "destructive"
      });
      setExtractionStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryGeneration = async () => {
    if (!extractedData?.content) return;

    setGeneratingImage(true);
    setRetryCount(prev => prev + 1);

    try {
      const styleIndex = retryCount % AI_STYLE_PROMPTS.length;
      const style = AI_STYLE_PROMPTS[styleIndex];
      
      const { data, error } = await invokeWithRetry(
        supabase,
        'generate-image-from-description',
        { 
          description: extractedData.content.slice(0, 500),
          title: extractedData.title,
          style
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        const newImage: ImageWithMeta = {
          url: data.imageUrl,
          isAI: true,
          style
        };

        setExtractedData(prev => prev ? {
          ...prev,
          images: [newImage, ...prev.images]
        } : null);
        setSelectedImage(data.imageUrl);

        toast({
          title: "✨ New image generated",
          description: `Style: ${style.split(',')[0]}`
        });
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate image. Try again.",
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
      // Use prefetched data if available, otherwise fetch now
      let targeting = prefetchedTargetingRef.current;
      let generatedAd = prefetchedAdRef.current;

      const fetchPromises: Promise<void>[] = [];

      if (!generatedAd) {
        fetchPromises.push(
          invokeWithRetry(supabase, 'generate-ad-variants', {
            productDescription: extractedData.content,
            mediaUrl: selectedImage,
            mediaType: 'image'
          }).then(result => {
            if (result.error) throw new Error(result.error.message);
            const variant = result.data?.variants?.[0];
            if (variant) {
              generatedAd = {
                headline: variant.headline || 'Your headline',
                bodyCopy: variant.body_copy || 'Your ad copy',
                ctaText: variant.cta_text || 'Learn More'
              };
            }
          })
        );
      }

      if (!targeting) {
        fetchPromises.push(
          invokeWithRetry(supabase, 'generate-targeting', {
            productDescription: extractedData.content
          }).then(result => {
            if (result.error) throw new Error(result.error.message);
            const targetOption = result.data?.options?.[0];
            if (targetOption) {
              targeting = {
                suggestedLocation: targetOption.suggestedLocation,
                suggestedBudget: targetOption.suggestedBudget,
                audienceSummary: targetOption.audienceSummary
              };
            }
          })
        );
      }

      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
      }

      if (!generatedAd || !targeting) {
        throw new Error('Failed to generate ad content');
      }

      // Clear draft on successful continue
      localStorage.removeItem(DRAFT_KEY);

      onContentExtracted({
        url,
        images: extractedData.images.map(img => img.url),
        selectedImage,
        content: extractedData.content,
        title: extractedData.title,
        generatedAd,
        targeting
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

  const getAspectRatioBadge = (dimensions?: { width: number; height: number }) => {
    if (!dimensions) return null;
    const { width, height } = dimensions;
    const ratio = width / height;
    
    // Check for ideal ad ratios
    if (Math.abs(ratio - 1.91) < 0.1) return { label: "1.91:1", ideal: true }; // Facebook/Instagram feed
    if (Math.abs(ratio - 1) < 0.1) return { label: "1:1", ideal: true }; // Square
    if (Math.abs(ratio - 0.8) < 0.1) return { label: "4:5", ideal: true }; // Instagram portrait
    if (Math.abs(ratio - 1.78) < 0.1) return { label: "16:9", ideal: false };
    
    return { label: `${width}×${height}`, ideal: false };
  };

  const visibleImages = extractedData?.images.filter(img => !imageLoadErrors.has(img.url)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Method Selection
        </Button>
        {hasDraft && (
          <Button variant="outline" size="sm" onClick={restoreDraft}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore Previous Session
          </Button>
        )}
      </div>

      <Card className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Import from URL</h3>
              <p className="text-muted-foreground">We'll extract images and generate AI variants automatically</p>
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
                {loading && extractionStep !== 'ready' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
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

          {/* Progress Indicator */}
          {extractionStep !== 'idle' && extractionStep !== 'ready' && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{STEP_LABELS[extractionStep]}</span>
                {extractionStep === 'generating' && (
                  <span className="text-muted-foreground">
                    {generationProgress.completed}/{generationProgress.total} images
                  </span>
                )}
              </div>
              <Progress value={STEP_PROGRESS[extractionStep]} className="h-2" />
            </div>
          )}
        </div>

        {/* Skeleton placeholders while generating */}
        {extractionStep === 'generating' && !extractedData && (
          <div className="space-y-6 pt-6 border-t">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        )}

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
                <h4 className="font-semibold">Select Image ({visibleImages.length} available)</h4>
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
                    onClick={handleRetryGeneration}
                    disabled={generatingImage}
                  >
                    {generatingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate More
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {visibleImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {visibleImages.map((img, idx) => {
                    const aspectBadge = getAspectRatioBadge(img.dimensions);
                    return (
                      <Card
                        key={img.url}
                        className={`cursor-pointer transition-all hover:shadow-lg group protected-image relative ${
                          selectedImage === img.url ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedImage(img.url)}
                      >
                        <div className="aspect-square relative overflow-hidden rounded-lg">
                          <img
                            src={img.url}
                            alt={`Option ${idx + 1}`}
                            className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
                            draggable="false"
                            loading="lazy"
                            onContextMenu={(e) => e.preventDefault()}
                            onError={() => handleImageError(img.url)}
                            onLoad={(e) => handleImageLoad(img.url, e)}
                          />
                          
                          {/* Selection overlay */}
                          {selectedImage === img.url && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                ✓
                              </div>
                            </div>
                          )}

                          {/* Image source badges */}
                          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                            {img.isAI ? (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0.5 bg-primary/90">
                                <Wand2 className="w-2.5 h-2.5 mr-1" />
                                AI
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 bg-secondary/90">
                                <Globe className="w-2.5 h-2.5 mr-1" />
                                Website
                              </Badge>
                            )}
                            {img.isRecommended && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-background/90 border-primary text-primary">
                                ★ Best
                              </Badge>
                            )}
                          </div>

                          {/* Dimension/aspect ratio badge */}
                          {aspectBadge && (
                            <Badge 
                              variant={aspectBadge.ideal ? "default" : "secondary"} 
                              className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5"
                            >
                              {aspectBadge.label}
                              {aspectBadge.ideal && " ✓"}
                            </Badge>
                          )}

                          {/* Save button for AI-generated images */}
                          {img.isAI && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveImage(img.url, extractedData.content);
                              }}
                              disabled={savingImage}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}

                  {/* Generating placeholder */}
                  {generatingImage && (
                    <Card className="aspect-square flex items-center justify-center bg-muted/50">
                      <div className="text-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Generating...</p>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert>
                  <ImageIcon className="w-4 h-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>No valid images found. Generate one with AI.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryGeneration}
                      disabled={generatingImage}
                    >
                      {generatingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
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
                  {prefetchedTargetingRef.current && prefetchedAdRef.current 
                    ? 'Finalizing...' 
                    : 'Creating Your Ad...'}
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

      <SavedImagesLibrary
        isOpen={showSavedLibrary}
        onClose={() => setShowSavedLibrary(false)}
        onSelectImage={(imageUrl) => {
          setSelectedImage(imageUrl);
          if (extractedData) {
            const newImage: ImageWithMeta = { url: imageUrl, isAI: false };
            setExtractedData(prev => prev ? {
              ...prev,
              images: [newImage, ...prev.images]
            } : null);
          }
        }}
      />
    </div>
  );
};
