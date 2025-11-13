import { ArrowDown } from "lucide-react";

export const PaymentSection = () => {
  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="border border-foreground p-8 mb-grid">
          <div className="space-y-element">
            <div className="space-y-tight">
              <h3 className="text-xl font-bold">Remove Watermark (Optional)</h3>
              <p className="text-sm">
                Free users keep the watermark. Pay once to remove it for this campaign.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">PUBLISH PRO — $29 per ad set</p>
              <p className="text-xs">or $99/mo unlimited</p>
            </div>

            <div className="border border-foreground py-3 px-6 text-sm font-bold">
              Continue to Payment →
            </div>
          </div>
        </div>

        <p className="text-lg md:text-xl font-medium">
          Publish without the watermark. Instant activation.
        </p>

        <div className="flex justify-center mt-arrow pt-arrow mb-[50px]">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1] animate-bounce" />
        </div>
      </div>
    </section>
  );
};
