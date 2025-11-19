import { X, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG } from "@/lib/plan-config";

interface QuickStartCapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpend: number;
  requestedAmount: number;
}

export const QuickStartCapModal = ({ 
  isOpen, 
  onClose, 
  currentSpend, 
  requestedAmount 
}: QuickStartCapModalProps) => {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Redirect to Stripe checkout for Pro tier with return to connect-platforms
    const checkoutUrl = `/auth?plan=pro&price=${PLAN_CONFIG.pro}&redirect=/connect-platforms`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-background w-full max-w-[640px] border-2 border-foreground p-8 md:p-12 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground hover:opacity-70 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="inline-block bg-foreground text-background px-4 py-1 text-xs font-bold">
            WEEKLY LIMIT REACHED
          </div>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            You've hit your $300/week Quick-Start cap.
          </h2>
          <p className="text-base opacity-80">
            You've spent <span className="font-bold">${currentSpend.toFixed(2)}</span> of your $300 weekly limit. 
            Trying to add <span className="font-bold">${requestedAmount.toFixed(2)}</span> more.
          </p>
        </div>

        {/* Pro Benefits */}
        <div className="border-2 border-foreground p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" />
            <h3 className="text-xl font-bold">Upgrade to PUBLISH PRO</h3>
          </div>
          <div className="text-2xl font-bold mb-4">$149/month</div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Unlimited ad spend</strong> — No weekly caps, ever</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>0% service fees</strong> — Keep 100% of your budget</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Your own ad accounts</strong> — Full control via OAuth</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Political ads enabled</strong> — FEC-compliant campaigns</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Priority support</strong> — Dedicated assistance</span>
            </li>
          </ul>

          <div className="bg-foreground/5 border border-foreground/20 p-4 text-sm">
            <p className="font-bold mb-1">What happens after upgrade?</p>
            <p className="opacity-80">
              1. Subscribe to Pro tier ($149/mo)<br/>
              2. Connect your Meta, Google, TikTok, LinkedIn accounts via OAuth<br/>
              3. Your campaigns transfer to your accounts with zero downtime<br/>
              4. Spend unlimited amounts with 0% fees
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base py-6"
            onClick={handleUpgrade}
          >
            Upgrade to Pro Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <button
            onClick={onClose}
            className="w-full text-sm hover:opacity-70 transition-opacity py-2"
          >
            Stay on Quick-Start (wait for weekly reset)
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center opacity-60 mt-6">
          Weekly limit resets every Monday. Your next reset is in {7 - new Date().getDay()} days.
        </p>
      </div>
    </div>
  );
};
