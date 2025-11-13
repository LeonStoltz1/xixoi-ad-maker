import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdPublished = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: campaignId } = useParams();
  const hasPaid = searchParams.get('paid') === 'true';
  const [campaign, setCampaign] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*, campaign_assets(*)')
        .eq('id', campaignId)
        .single();
      
      const { data: variants } = await supabase
        .from('ad_variants')
        .select('*')
        .eq('campaign_id', campaignId)
        .limit(1);
      
      setCampaign(campaignData);
      setSelectedVariant(variants?.[0]);
    };
    
    fetchCampaign();
  }, [campaignId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        {/* Ad Preview Card */}
        <div className="border border-foreground bg-background p-8 mx-auto max-w-md">
          <div className="space-y-6">
            {/* Show uploaded image if available */}
            {selectedVariant?.creative_url && (
              <div className="w-full aspect-square bg-muted overflow-hidden">
                <img 
                  src={selectedVariant.creative_url} 
                  alt="Campaign creative" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Headline Bar */}
            <div className="bg-foreground text-background px-4 py-3">
              <div className="text-sm font-bold">
                {selectedVariant?.headline || 'YOUR PRODUCT'}
              </div>
            </div>

            {/* Body Text */}
            <div className="space-y-2">
              <p className="text-sm">
                {selectedVariant?.body_copy || 'Your ad copy will appear here'}
              </p>
            </div>

            {/* CTA Button Outline */}
            <div className="border-2 border-foreground py-3 px-6 text-center">
              <span className="font-bold">
                {selectedVariant?.cta_text || 'SHOP NOW'}
              </span>
            </div>

            {/* Watermark for free users only */}
            {!hasPaid && (
              <div className="text-right text-[9px] opacity-60">
                Powered By xiXoi™
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Your ad is live.
          </h1>
          <p className="text-muted-foreground text-lg">
            xiXoi™ has published your campaign. You can track performance inside your ad platform.
          </p>
        </div>

        {/* Create Another Button */}
        <Button
          size="lg"
          className="text-lg py-6 px-12"
          onClick={() => navigate("/create-campaign")}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Another Ad
        </Button>
      </div>
    </div>
  );
};

export default AdPublished;
