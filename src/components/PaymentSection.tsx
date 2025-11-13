import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface PaymentSectionProps {
  campaignId?: string;
}

export const PaymentSection = ({ campaignId }: PaymentSectionProps) => {
  const [isPaid, setIsPaid] = useState(false);
  const { createCheckoutSession, loading } = useStripeCheckout();

  const handlePayment = async () => {
    if (!campaignId) {
      // If no campaign ID, assume they want Pro subscription
      await createCheckoutSession('pro_subscription');
    } else {
      // If campaign ID provided, it's for branding removal
      await createCheckoutSession('branding_removal', campaignId);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="container mx-auto max-w-md text-center space-y-16">
        <div className="border border-foreground rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Remove Watermark</h3>
            <p className="text-muted-foreground">
              Publish your ads without the "Powered By xiXoi™" watermark
            </p>
            <div className="text-4xl font-bold">$5</div>
            <p className="text-sm text-muted-foreground">One-time payment per campaign</p>
          </div>

          <Button 
            size="lg" 
            className="w-full text-lg py-6"
            onClick={handlePayment}
            disabled={loading || isPaid}
          >
            {loading ? "Processing..." : isPaid ? "Payment Confirmed" : "Confirm & Pay $5"}
          </Button>

          {isPaid && (
            <div className="flex items-center justify-center gap-2 text-foreground animate-fade-in">
              <Check className="w-6 h-6" />
              <span className="font-medium">Payment Confirmed</span>
            </div>
          )}
        </div>

        <p className="text-xl md:text-2xl font-medium">
          Publish without the watermark. Instant activation.
        </p>
      </div>
    </section>
  );
};
