import { useState } from "react";
import { X, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [includeAdBudget, setIncludeAdBudget] = useState(true);
  const [dailyBudget, setDailyBudget] = useState(40); // Meta minimum $40/day
  const [adBudgetType, setAdBudgetType] = useState<'recurring' | 'onetime'>('onetime');
  const [agreedToRecurring, setAgreedToRecurring] = useState(false);
  const { createCheckoutSession, loading } = useStripeCheckout();

  if (!isOpen) return null;

  const weeklyBudget = dailyBudget * 7;
  const serviceFee = selectedPlan === 'quickstart' ? weeklyBudget * 0.05 : 0;
  const subscriptionPrice = selectedPlan === 'quickstart' ? 49 : 99;
  const totalWithAdBudget = subscriptionPrice + weeklyBudget + serviceFee;
  const totalSubscriptionOnly = subscriptionPrice;

  const canProceed = !includeAdBudget || adBudgetType === 'onetime' || (adBudgetType === 'recurring' && agreedToRecurring);

  const handleUpgrade = async () => {
    if (!canProceed) return;
    
    const priceType = selectedPlan === 'quickstart' ? 'quickstart_subscription' : 'pro_subscription';
    
    // Pass ad budget info if user wants to include it
    const adBudgetAmount = includeAdBudget ? weeklyBudget : undefined;
    const isRecurringBudget = includeAdBudget && adBudgetType === 'recurring';
    
    await createCheckoutSession(priceType, campaignId, false, undefined, adBudgetAmount, isRecurringBudget);
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
                <div className={`w-5 h-5 border-2 flex items-center justify-center mt-1 border-foreground`}>
                  {selectedPlan === 'quickstart' && <div className="w-3 h-3 bg-foreground" />}
                </div>
              </div>
              <ul className="space-y-1.5 text-xs md:text-sm">
                <li>• Publish instantly via xiXoi accounts</li>
                <li>• $300/week spend cap (5% service fee on ad budget)</li>
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
                <div className={`w-5 h-5 border-2 flex items-center justify-center mt-1 border-foreground`}>
                  {selectedPlan === 'pro' && <div className="w-3 h-3 bg-foreground" />}
                </div>
              </div>
              <ul className="space-y-1.5 text-xs md:text-sm">
                <li>• Use YOUR connected ad accounts</li>
                <li>• Unlimited spend, no caps or service fees</li>
                <li>• Full control over targeting</li>
                <li>• Political ads allowed (FEC compliant)</li>
              </ul>
            </div>
          </button>
        </div>

        {/* Ad Budget Section */}
        <div className="border border-foreground p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1">ADD AD BUDGET</div>
              <p className="text-xs opacity-70">Pre-pay your ad spend to start running ads immediately</p>
            </div>
            <button
              onClick={() => setIncludeAdBudget(!includeAdBudget)}
              className={`w-12 h-6 rounded-full transition-colors ${
                includeAdBudget ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-background transition-transform mx-0.5 ${
                includeAdBudget ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {includeAdBudget && (
            <div className="space-y-4">
              {/* Daily Budget Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Daily Budget</span>
                  <span className="text-lg font-bold">${dailyBudget}/day</span>
                </div>
                <Slider
                  value={[dailyBudget]}
                  onValueChange={([val]) => setDailyBudget(val)}
                  min={40}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs opacity-60 mt-1">
                  <span>$40/day (Meta minimum)</span>
                  <span>$300/day</span>
                </div>
              </div>

              {/* Recurring vs One-time Choice */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wide">Payment Type</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* One-time Option */}
                  <button
                    onClick={() => setAdBudgetType('onetime')}
                    className={`border p-4 text-left transition-all ${
                      adBudgetType === 'onetime' ? 'border-2 border-foreground' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-bold">One-Time Payment</div>
                      <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                        adBudgetType === 'onetime' ? 'border-foreground' : 'border-muted-foreground'
                      }`}>
                        {adBudgetType === 'onetime' && <div className="w-2 h-2 bg-foreground rounded-full" />}
                      </div>
                    </div>
                    <p className="text-xs opacity-70">
                      Pay ${weeklyBudget.toFixed(0)} for 1 week. Add more budget later when needed.
                    </p>
                  </button>

                  {/* Recurring Option */}
                  <button
                    onClick={() => setAdBudgetType('recurring')}
                    className={`border p-4 text-left transition-all ${
                      adBudgetType === 'recurring' ? 'border-2 border-foreground' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-bold">Auto-Renew Weekly</div>
                      <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                        adBudgetType === 'recurring' ? 'border-foreground' : 'border-muted-foreground'
                      }`}>
                        {adBudgetType === 'recurring' && <div className="w-2 h-2 bg-foreground rounded-full" />}
                      </div>
                    </div>
                    <p className="text-xs opacity-70">
                      Auto-charge ${weeklyBudget.toFixed(0)}/week until you cancel.
                    </p>
                  </button>
                </div>

                {/* Recurring Warning & Agreement */}
                {adBudgetType === 'recurring' && (
                  <div className="bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-amber-800">Important: Recurring Weekly Charge</div>
                        <p className="text-xs text-amber-700 mt-1">
                          By selecting auto-renew, you agree to be charged <strong>${weeklyBudget.toFixed(0)}</strong> every week 
                          {selectedPlan === 'quickstart' && <span> plus ${serviceFee.toFixed(2)} service fee (5%)</span>} until you cancel. 
                          You can cancel anytime from your dashboard.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agree-recurring"
                        checked={agreedToRecurring}
                        onCheckedChange={(checked) => setAgreedToRecurring(checked as boolean)}
                      />
                      <label htmlFor="agree-recurring" className="text-xs text-amber-800 cursor-pointer">
                        I understand and agree to be charged ${(weeklyBudget + serviceFee).toFixed(2)}/week for my ad budget until I cancel.
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Summary */}
              <div className="bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Weekly Ad Budget (7 days)</span>
                  <span className="font-medium">${weeklyBudget.toFixed(2)}</span>
                </div>
                {selectedPlan === 'quickstart' && (
                  <div className="flex justify-between text-sm">
                    <span>Service Fee (5%)</span>
                    <span className="font-medium">${serviceFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                  <span>Ad Budget Total {adBudgetType === 'recurring' ? '(per week)' : ''}</span>
                  <span>${(weeklyBudget + serviceFee).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-destructive font-medium">
                ⚠️ Weekly ad budget must be pre-paid before ads publish. Ads will not run without payment.
              </p>
            </div>
          )}

          {!includeAdBudget && (
            <p className="text-xs opacity-70">
              You can add ad budget later from your dashboard. Subscription only gets you access to publish.
            </p>
          )}
        </div>

        {/* Total Summary */}
        <div className="border-t border-foreground pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{selectedPlan === 'quickstart' ? 'Quick-Start' : 'Publish Pro'} Subscription</span>
              <span>${subscriptionPrice}/mo</span>
            </div>
            {includeAdBudget && (
              <>
                <div className="flex justify-between text-sm">
                  <span>
                    {adBudgetType === 'recurring' ? 'Weekly Ad Budget (auto-renew)' : 'First Week Ad Budget'}
                  </span>
                  <span>${weeklyBudget.toFixed(2)}{adBudgetType === 'recurring' ? '/wk' : ''}</span>
                </div>
                {selectedPlan === 'quickstart' && serviceFee > 0 && (
                  <div className="flex justify-between text-sm opacity-70">
                    <span>Service Fee (5%)</span>
                    <span>${serviceFee.toFixed(2)}{adBudgetType === 'recurring' ? '/wk' : ''}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total Due Today</span>
              <span>${includeAdBudget ? totalWithAdBudget.toFixed(2) : totalSubscriptionOnly.toFixed(2)}</span>
            </div>
            {includeAdBudget && adBudgetType === 'recurring' && (
              <p className="text-xs opacity-70 text-right">
                Then ${(weeklyBudget + serviceFee).toFixed(2)}/week for ad budget
              </p>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-sm md:text-base lg:text-lg py-6"
            onClick={handleUpgrade}
            disabled={loading || !canProceed}
          >
            {loading ? "Processing..." : (
              <>
                {includeAdBudget ? 'Subscribe & Fund Ads' : 'Subscribe Now'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          {!canProceed && (
            <p className="text-xs text-destructive text-center">
              Please agree to the recurring weekly charge terms above
            </p>
          )}
          
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