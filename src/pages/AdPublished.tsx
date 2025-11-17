import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Header } from "@/components/Header";

const AdPublished = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: campaignId } = useParams();
  const hasPaid = searchParams.get('paid') === 'true';
  const [campaign, setCampaign] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const { createCheckoutSession, loading: stripeLoading } = useStripeCheckout();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) {
        setIsLoading(false);
        return;
      }
      
      try {
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

        // Get user plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();
          setUserPlan(profile?.plan || 'free');
        }
        
        setCampaign(campaignData);
        setSelectedVariant(variants?.[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaign();
  }, [campaignId]);

  const handlePublish = async () => {
    if (!selectedVariant?.id) {
      toast.error('No ad variant found');
      return;
    }

    setIsPublishing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to publish');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('publish-ad', {
        body: { variantId: selectedVariant.id }
      });

      if (error) {
        // Handle rate limit errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('Service temporarily unavailable. Please try again in a moment.');
          return;
        }
        
        // Check if it's a payment required error (402) or credits exhausted
        if (error.message?.includes('requiresPayment') || data?.requiresPayment) {
          // Redirect to Stripe checkout
          if (data?.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            toast.error('Payment required but no checkout URL provided');
          }
        } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
          toast.error('AI service credits exhausted. Please contact support at support@xixoi.com');
        } else {
          throw error;
        }
      } else if (data?.requiresPayment && data?.checkoutUrl) {
        // Watermark was tampered - redirect to payment
        toast.info('Watermark removed. Redirecting to payment...');
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1000);
      } else {
        // Success - ad published with watermark
        toast.success('Ad published successfully!');
        
        // Upsell triggers based on plan
        if (userPlan === 'free') {
          setTimeout(() => {
            toast.info('Want unlimited ads? Upgrade to Pro →', {
              action: {
                label: 'Go Pro',
                onClick: () => navigate('/pricing')
              }
            });
          }, 2000);
        }
        
        // Optionally redirect to analytics or dashboard
        setTimeout(() => {
          navigate(`/analytics/${campaignId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Failed to publish ad');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemoveWatermark = async () => {
    if (!campaignId) {
      toast.error('No campaign found');
      return;
    }

    try {
      await createCheckoutSession('branding_removal', campaignId, false);
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedVariant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Ad not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 relative pt-40">
      <Header />
      <div className="max-w-2xl mx-auto text-center space-y-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Ad Preview Card */}
        <div className="border border-foreground bg-background p-8 mx-auto max-w-md relative">
          {/* Free Preview Badge */}
          {!hasPaid && (
            <div className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-xs font-bold">
              FREE PREVIEW
            </div>
          )}
          
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
              <div className="text-right text-[14px] opacity-60">
                Powered By xiXoi™
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Your ad is ready to publish
          </h1>
          <p className="text-muted-foreground text-lg">
            {!hasPaid ? 'Free with xiXoi™ credit. Remove watermark for $29.' : 'Connect to your ad platforms to launch this campaign.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg py-6 px-12 border-foreground"
              onClick={handlePublish}
              disabled={isPublishing || hasPaid}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Free'
              )}
            </Button>
            
            {!hasPaid && (
              <Button
                size="lg"
                className="text-base md:text-lg py-6 px-12"
                onClick={handleRemoveWatermark}
                disabled={stripeLoading || isPublishing}
              >
                Remove Watermark – $29
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="ghost"
              className="text-base"
              onClick={() => navigate(`/analytics/${campaignId}`)}
            >
              View Demo Analytics
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-base"
              onClick={() => navigate("/create-campaign")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Another Ad
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdPublished;
