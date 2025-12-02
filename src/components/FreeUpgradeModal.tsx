import { useState } from "react";
import { X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface FreeUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  adData: {
    image: string;
    headline: string;
    bodyCopy: string;
    ctaText: string;
  };
}

export const FreeUpgradeModal = ({ isOpen, onClose, campaignId, adData }: FreeUpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'quickstart' | 'pro'>('quickstart');
  const { createCheckoutSession, loading } = useStripeCheckout();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const priceType = selectedPlan === 'quickstart' ? 'quickstart_subscription' : 'pro_subscription';
    await createCheckoutSession(priceType, campaignId, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-background w-full max-w-[1000px] border border-foreground p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground hover:opacity-70 transition-opacity z-10"
        >
          <X className="w-6 h-6 stroke-[1]" />
        </button>

        {/* Title */}
        <div className="space-y-2 mb-6 pr-8">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            See the difference. Publish without watermarks.
          </h2>
          <p className="text-sm md:text-base opacity-80">
            Free tier adds watermarks. Upgrade now to publish clean, professional ads.
          </p>
        </div>

        {/* Side-by-side Ad Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* FREE VERSION (with watermark) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide opacity-60">Free Version</span>
              <span className="text-xs px-2 py-1 bg-muted border border-border">Cannot Publish</span>
            </div>
            <div className="relative border border-border opacity-60">
              <div className="aspect-[1.91/1] relative overflow-hidden bg-muted">
                <img 
                  src={adData.image} 
                  alt="Ad preview" 
                  className="w-full h-full object-cover"
                />
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-background/90 px-4 py-2 border border-foreground">
                    <span className="text-xs font-bold">Powered by xiXoi™</span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm line-clamp-2">{adData.headline}</h3>
                <p className="text-xs line-clamp-3 opacity-70">{adData.bodyCopy}</p>
                <button className="w-full bg-muted text-foreground border border-border py-2 text-xs font-medium">
                  {adData.ctaText}
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs opacity-60">
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Watermark on all ads</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Cannot publish to platforms</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Preview only</span>
              </div>
            </div>
          </div>

          {/* PRO VERSION (clean, no watermark) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide">Pro Version</span>
              <span className="text-xs px-2 py-1 bg-primary text-primary-foreground">Ready to Publish</span>
            </div>
            <div className="relative border-2 border-primary shadow-lg">
              <div className="aspect-[1.91/1] relative overflow-hidden bg-muted">
                <img 
                  src={adData.image} 
                  alt="Ad preview" 
                  className="w-full h-full object-cover"
                />
                {/* No watermark - clean */}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm line-clamp-2">{adData.headline}</h3>
                <p className="text-xs line-clamp-3 opacity-70">{adData.bodyCopy}</p>
                <button className="w-full bg-primary text-primary-foreground py-2 text-xs font-medium">
                  {adData.ctaText}
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span className="font-medium">No watermark</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span className="font-medium">Publish to Meta instantly</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span className="font-medium">AI targeting + variants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="space-y-4 mb-6">
          {/* Quick-Start Option */}
          <button
            onClick={() => setSelectedPlan('quickstart')}
            className={`w-full border text-left transition-all ${
              selectedPlan === 'quickstart'
                ? 'border-[2px] border-foreground'
                : 'border border-foreground'
            }`}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1">QUICK-START</div>
                  <div className="text-xl md:text-2xl font-bold">$49/month</div>
                </div>
                <div className={`w-5 h-5 border-2 flex items-center justify-center mt-1 ${
                  selectedPlan === 'quickstart' ? 'border-foreground' : 'border-foreground'
                }`}>
                  {selectedPlan === 'quickstart' && (
                    <div className="w-3 h-3 bg-foreground" />
                  )}
                </div>
              </div>
              <ul className="space-y-1.5 text-xs md:text-sm">
                <li>• Publish instantly via xiXoi accounts</li>
                <li>• $300/week spend cap (5% service fee)</li>
                <li>• No watermark</li>
                <li>• AI targeting + variants</li>
              </ul>
            </div>
          </button>

          {/* Publish Pro Option */}
          <button
            onClick={() => setSelectedPlan('pro')}
            className={`w-full border text-left transition-all ${
              selectedPlan === 'pro'
                ? 'border-[2px] border-foreground'
                : 'border border-foreground'
            }`}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1">PUBLISH PRO</div>
                  <div className="text-xl md:text-2xl font-bold">$99/month</div>
                </div>
                <div className={`w-5 h-5 border-2 flex items-center justify-center mt-1 ${
                  selectedPlan === 'pro' ? 'border-foreground' : 'border-foreground'
                }`}>
                  {selectedPlan === 'pro' && (
                    <div className="w-3 h-3 bg-foreground" />
                  )}
                </div>
              </div>
              <ul className="space-y-1.5 text-xs md:text-sm">
                <li>• Use YOUR connected ad accounts</li>
                <li>• Unlimited spend, no caps or fees</li>
                <li>• Full control over targeting</li>
                <li>• Political ads allowed (FEC compliant)</li>
              </ul>
            </div>
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-sm md:text-base lg:text-lg py-6"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "Processing..." : (
              <>
                Upgrade & Publish Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <button
            onClick={onClose}
            className="w-full text-sm hover:opacity-70 transition-opacity py-2"
          >
            Stay on Free (Cannot Publish)
          </button>
        </div>

        {/* Trust Text */}
        <p className="text-[11px] text-center opacity-60 mt-6">
          Secure checkout powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
};
