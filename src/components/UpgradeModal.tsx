import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onPublishFree?: () => void;
}

export const UpgradeModal = ({ isOpen, onClose, campaignId, onPublishFree }: UpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'quickstart' | 'pro'>('quickstart');
  const { createCheckoutSession, loading } = useStripeCheckout();

  if (!isOpen) return null;

  const handleContinue = async () => {
    const priceType = selectedPlan === 'quickstart' ? 'quickstart_subscription' : 'pro_subscription';
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
            Publishing ads is a Pro feature.
          </h2>
          <p className="text-sm md:text-base">
            Upgrade now to launch this ad instantly. Your Meta account is already connected—just pick a plan and publish.
          </p>
        </div>

        {/* Pricing Options */}
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
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
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
              <ul className="space-y-2 text-sm">
                <li>• Publish instantly via xiXoi accounts</li>
                <li>• $300/week spend cap (5% service fee)</li>
                <li>• No watermark</li>
                <li>• AI targeting + variants</li>
                <li>• Perfect for getting started fast</li>
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
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
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
              <ul className="space-y-2 text-sm">
                <li>• Use YOUR connected ad accounts</li>
                <li>• Unlimited spend, no caps or fees</li>
                <li>• Full control over targeting</li>
                <li>• Political ads allowed (FEC compliant)</li>
                <li>• Best for power users</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Disclaimer Text */}
        <p className="text-xs text-center mb-6 opacity-70">
          Cancel anytime. Your Meta account stays connected. xiXoi never touches your ad spend.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-sm md:text-base lg:text-lg py-6"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Processing..." : (
              <>
                {selectedPlan === 'quickstart' ? 'Upgrade to Quick-Start' : 'Upgrade to Publish Pro'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <button
            onClick={onClose}
            className="w-full text-sm hover:opacity-70 transition-opacity py-2"
          >
            Cancel
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
