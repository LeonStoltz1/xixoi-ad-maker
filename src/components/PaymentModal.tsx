import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

export const PaymentModal = ({ isOpen, onClose, campaignId }: PaymentModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'unlimited'>('single');
  const { createCheckoutSession, loading } = useStripeCheckout();

  if (!isOpen) return null;

  const handleContinueToPayment = async () => {
    const priceType = selectedPlan === 'single' ? 'branding_removal' : 'pro_subscription';
    await createCheckoutSession(priceType, campaignId, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-background w-full max-w-md mx-4 border border-foreground p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground hover:opacity-70 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold">Publish with xiXoi™</h2>
          <p className="text-muted-foreground">Remove watermark + publish instantly.</p>
        </div>

        {/* Price Options */}
        <div className="space-y-4 mb-8">
          {/* Single Ad Option */}
          <button
            onClick={() => setSelectedPlan('single')}
            className={`w-full border p-6 text-left transition-all ${
              selectedPlan === 'single'
                ? 'border-foreground bg-foreground/5'
                : 'border-foreground/30 hover:border-foreground/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'single' ? 'border-foreground' : 'border-foreground/30'
              }`}>
                {selectedPlan === 'single' && (
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Publish Pro — $29 per ad set</div>
                <p className="text-sm text-muted-foreground">One-time payment for this campaign</p>
              </div>
            </div>
          </button>

          {/* Unlimited Option */}
          <button
            onClick={() => setSelectedPlan('unlimited')}
            className={`w-full border p-6 text-left transition-all ${
              selectedPlan === 'unlimited'
                ? 'border-foreground bg-foreground/5'
                : 'border-foreground/30 hover:border-foreground/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'unlimited' ? 'border-foreground' : 'border-foreground/30'
              }`}>
                {selectedPlan === 'unlimited' && (
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Unlimited Pro — $99/month</div>
                <p className="text-sm text-muted-foreground">Unlimited campaigns, no watermarks</p>
              </div>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <Button
          size="lg"
          className="w-full text-lg py-6"
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
      </div>
    </div>
  );
};
