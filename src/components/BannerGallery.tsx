import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Banner {
  id: string;
  size: string;
  image_url: string;
  is_featured: boolean;
  created_at: string;
}

export function BannerGallery() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      // Fetch featured banners and recent banners
      const { data, error } = await supabase
        .from('affiliate_banners')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case '1200x628':
        return 'Social Banner';
      case '1080x1080':
        return 'Instagram Square';
      case '1080x1920':
        return 'Story Format';
      default:
        return size;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Banner Gallery</CardTitle>
          <CardDescription>Examples from our affiliate community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (banners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Banner Gallery</CardTitle>
          <CardDescription>Examples from our affiliate community</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No banners yet. Be the first to generate and inspire others!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner Gallery</CardTitle>
        <CardDescription>Get inspired by banners created by our affiliate community</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="relative group">
              <div className="border border-border rounded-lg overflow-hidden bg-muted">
                <img
                  src={banner.image_url}
                  alt={`${getSizeLabel(banner.size)} example`}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {getSizeLabel(banner.size)}
                </Badge>
                {banner.is_featured && (
                  <Badge variant="default" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
