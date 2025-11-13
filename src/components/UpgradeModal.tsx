import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

export const UpgradeModal = ({ isOpen, onClose, campaignId }: UpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'unlimited'>('single');
  const { createCheckoutSession, loading } = useStripeCheckout();

  if (!isOpen) return null;

  const handleContinueToPayment = async () => {
    const priceType = selectedPlan === 'single' ? 'branding_removal' : 'pro_subscription';
    await createCheckoutSession(priceType, campaignId, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-background w-full max-w-[560px] border border-foreground p-8 md:p-10 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground hover:opacity-70 transition-opacity"
        >
          <X className="w-6 h-6 stroke-[1]" />
        </button>

        {/* Title */}
        <div className="space-y-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            Remove the watermark. Publish instantly.
          </h2>
          <p className="text-sm md:text-base">
            Upgrade to xiXoi™ Pro to launch this ad without the "Powered By xiXoi™" tag, and unlock full-speed publishing.
          </p>
        </div>

        {/* Pricing Options */}
        <div className="space-y-4 mb-6">
          {/* Single Publish Option */}
          <button
            onClick={() => setSelectedPlan('single')}
            className={`w-full border text-left transition-all ${
              selectedPlan === 'single'
                ? 'border-[2px] border-foreground'
                : 'border border-foreground'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1">PUBLISH PRO</div>
                  <div className="text-2xl font-bold">$29 per ad set</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedPlan === 'single' ? 'border-foreground' : 'border-foreground'
                }`}>
                  {selectedPlan === 'single' && (
                    <div className="w-3 h-3 rounded-full bg-foreground" />
                  )}
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li>• Remove "Powered By xiXoi™" watermark</li>
                <li>• Publish this ad instantly</li>
                <li>• 4 AI ad variants included</li>
                <li>• ROAS prediction for this ad set</li>
              </ul>
            </div>
          </button>

          {/* Unlimited Option */}
          <button
            onClick={() => setSelectedPlan('unlimited')}
            className={`w-full border text-left transition-all ${
              selectedPlan === 'unlimited'
                ? 'border-[2px] border-foreground'
                : 'border border-foreground'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1">UNLIMITED PRO</div>
                  <div className="text-2xl font-bold">$99/month</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedPlan === 'unlimited' ? 'border-foreground' : 'border-foreground'
                }`}>
                  {selectedPlan === 'unlimited' && (
                    <div className="w-3 h-3 rounded-full bg-foreground" />
                  )}
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li>• Remove watermark on ALL ads</li>
                <li>• Unlimited publishes</li>
                <li>• Priority generation speed</li>
                <li>• Best for active stores & agencies</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Disclaimer Text */}
        <p className="text-xs text-center mb-6 opacity-70">
          You can cancel anytime. Your ad spend is still billed by Meta/Google/TikTok.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base md:text-lg py-6"
            onClick={handleContinueToPayment}
            disabled={loading}
          >
            {loading ? "Processing..." : (
              <>
                Continue to Payment
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <button
            onClick={onClose}
            className="w-full text-sm hover:opacity-70 transition-opacity py-2"
          >
            Keep my ad as a draft
          </button>
        </div>

        {/* Trust Text */}
        <p className="text-[11px] text-center opacity-60 mt-6">
          Secure checkout powered by Stripe. xiXoi™ never touches your ad spend.
        </p>
      </div>
    </div>
  );
};
