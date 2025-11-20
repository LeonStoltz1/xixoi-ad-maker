import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomizeBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size: string;
  onGenerated: (imageUrl: string) => void;
}

export function CustomizeBannerModal({ open, onOpenChange, size, onGenerated }: CustomizeBannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [headline, setHeadline] = useState("xiXoi™ Affiliate Program");
  const [subheadline, setSubheadline] = useState("Earn 20% Lifetime Commission");

  const getSizeLabel = (sizeStr: string) => {
    switch (sizeStr) {
      case '1200x628': return 'Social Banner (1200x628)';
      case '1080x1080': return 'Instagram Square (1080x1080)';
      case '1080x1920': return 'Story Format (1080x1920)';
      default: return sizeStr;
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-affiliate-banner', {
        body: { 
          size,
          customHeadline: headline,
          customSubheadline: subheadline
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        onGenerated(data.imageUrl);
        toast.success('Custom banner generated!');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error generating custom banner:', error);
      toast.error('Failed to generate banner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Your Banner</DialogTitle>
          <DialogDescription>
            Create a personalized {getSizeLabel(size)} while keeping the xiXoi™ logo and brand guidelines intact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="xiXoi™ Affiliate Program"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">{headline.length}/40 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subheadline">Subheadline</Label>
            <Input
              id="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="Earn 20% Lifetime Commission"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">{subheadline.length}/50 characters</p>
          </div>

          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <p className="font-semibold">Brand Guidelines:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>xiXoi™ logo will remain unchanged</li>
              <li>Black/white color scheme with purple accent</li>
              <li>Minimalist, high-contrast design</li>
              <li>Professional tech-forward aesthetic</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !headline.trim() || !subheadline.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Banner'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
