import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BannerDownloadProps {
  size: string;
  title: string;
  description: string;
}

export function BannerDownload({ size, title, description }: BannerDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generateBanner = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-affiliate-banner', {
        body: { size }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        toast.success('Banner generated! Click Download to save.');
      }
    } catch (error) {
      console.error('Error generating banner:', error);
      toast.error('Failed to generate banner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBanner = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `xixoi-affiliate-banner-${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Banner downloaded!');
  };

  return (
    <div className="p-6 bg-muted rounded-lg text-center space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      
      {imageUrl && (
        <div className="my-3 border border-border rounded overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-auto"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        {!imageUrl ? (
          <Button 
            size="sm" 
            variant="outline"
            onClick={generateBanner}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Banner'
            )}
          </Button>
        ) : (
          <>
            <Button 
              size="sm" 
              onClick={downloadBanner}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={generateBanner}
              disabled={loading}
            >
              Regenerate
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
