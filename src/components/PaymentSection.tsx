import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export const PaymentSection = () => {
  return (
    <section className="flex items-center justify-center bg-background px-6 py-section">
      <div className="w-full max-w-content mx-auto text-center space-y-element">
        <div className="flex justify-center pt-arrow pb-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>

        <div className="border border-foreground p-8 space-y-element">
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-bold">Remove Watermark (Optional)</h3>
            <p className="text-sm">
              Free users keep the watermark. Pay once to remove it for this campaign.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">PUBLISH PRO — $29 per ad set</p>
            <p className="text-xs">or $99/mo unlimited</p>
          </div>

          <Button 
            size="lg" 
            className="w-full text-base py-3"
            onClick={() => window.location.href = '/auth?plan=pro'}
          >
            Continue to Payment →
          </Button>
        </div>

        <p className="text-lg md:text-xl font-medium">
          Publish without the watermark. Instant activation.
        </p>

        <div className="flex justify-center pt-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
