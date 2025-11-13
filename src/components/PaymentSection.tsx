import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

export const PaymentSection = () => {
  const [isPaid, setIsPaid] = useState(false);

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="container mx-auto max-w-md text-center space-y-16">
        <div className="border border-foreground rounded-2xl p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium uppercase tracking-wide block text-left">Card Number</label>
            <input 
              type="text" 
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wide block text-left">Expiry</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wide block text-left">CVC</label>
              <input 
                type="text" 
                placeholder="123"
                className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
              />
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full text-lg py-6"
            onClick={() => setIsPaid(true)}
          >
            Confirm & Pay $29
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
