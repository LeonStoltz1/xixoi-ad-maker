import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Image as ImageIcon, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffectiveTier } from "@/hooks/useEffectiveTier";

interface SavedImage {
  id: string;
  image_url: string;
  prompt_used: string | null;
  created_at: string;
  usage_count: number;
}

interface SavedImagesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string) => void;
}

export function SavedImagesLibrary({ isOpen, onClose, onSelectImage }: SavedImagesLibraryProps) {
  const { toast } = useToast();
  const { tier } = useEffectiveTier();
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSavedImages();
    }
  }, [isOpen]);

  const fetchSavedImages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedImages(data || []);
    } catch (error) {
      console.error('Error fetching saved images:', error);
      toast({
        title: "Failed to load images",
        description: "Could not retrieve your saved images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('saved_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setSavedImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Image deleted",
        description: "Image removed from your library"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete image",
        variant: "destructive"
      });
    }
  };

  const handleSelectImage = async (imageUrl: string, imageId: string) => {
    // Check if user has subscription
    if (tier === 'free') {
      toast({
        title: "Subscription required",
        description: "Upgrade to use saved images in your campaigns",
        variant: "destructive"
      });
      return;
    }

    // Update usage count
    try {
      await supabase
        .from('saved_images')
        .update({ 
          usage_count: savedImages.find(img => img.id === imageId)!.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', imageId);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }

    if (onSelectImage) {
      onSelectImage(imageUrl);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Your Saved Images
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No saved images yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Save AI-generated images during campaign creation
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {savedImages.map((img) => (
              <Card 
                key={img.id}
                className={`relative group cursor-pointer transition-all hover:shadow-lg protected-image ${
                  selectedImage === img.image_url ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedImage(img.image_url)}
              >
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img
                    src={img.image_url}
                    alt="Saved image"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  
                  {/* Screenshot protection overlay */}
                  {tier === 'free' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-semibold">Subscription Required</span>
                    </div>
                  )}

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(img.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Usage count badge */}
                  {img.usage_count > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Used {img.usage_count}x
                    </div>
                  )}
                </div>

                {img.prompt_used && (
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {img.prompt_used}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {selectedImage && onSelectImage && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const img = savedImages.find(i => i.image_url === selectedImage);
                if (img) handleSelectImage(selectedImage, img.id);
              }}
            >
              Use This Image →
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
