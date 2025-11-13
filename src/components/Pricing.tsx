import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    price: "$0",
    features: [
      "Build up to 3 ads/day",
      '"Powered By xiXoi™" watermark',
      "Basic AI generation",
      "Auto-targeting suggestions",
      "Publish to Meta/TikTok/Google/LinkedIn",
      "Perfect for creators & small shops",
    ],
    cta: "Start Free",
  },
  {
    name: "PUBLISH PRO",
    price: "$29",
    subtitle: "per ad set",
    altPrice: "$99/mo unlimited",
    features: [
      'Remove "Powered By xiXoi™" watermark',
      "Publish instantly",
      "4 AI ad variants per upload",
      "ROAS predictions",
      "Advanced targeting",
      "Multi-channel publishing",
      "Priority generation speed",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "SCALE ELITE",
    price: "$199",
    subtitle: "/month + 5% of ad spend",
    features: [
      "Everything in Publish Pro",
      "Autonomous AI optimizer",
      "Auto-pause bad ads",
      "Auto-increase winning ads",
      "Predictive bidding",
      "Custom avatars/UGC styles",
      "Affiliate dashboard (earn 20%)",
    ],
    cta: "Become Elite",
  },
  {
    name: "AGENCY WHITE-LABEL",
    price: "$999",
    subtitle: "/month",
    features: [
      "Everything in Scale Elite",
      "White-label xiXoi™ platform",
      "Team seats",
      "Client billing",
      "API access",
      "Unlimited AI variants",
      "Agency-grade performance",
    ],
    cta: "Contact Sales",
  },
];

export const Pricing = () => {
  const { createCheckoutSession, loading } = useStripeCheckout();
  const navigate = useNavigate();

  const handlePlanClick = (planName: string) => {
    if (planName === "FREE") {
      navigate('/auth');
    } else if (planName === "PUBLISH PRO") {
      navigate('/auth?plan=pro');
    } else if (planName === "SCALE ELITE") {
      navigate('/auth?plan=elite');
    } else if (planName === "AGENCY WHITE-LABEL") {
      navigate('/auth?plan=agency');
    }
  };

  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-grid space-y-tight">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Simple Pricing
          </h2>
          <p className="text-base">
            Pure simplicity. No clutter. No noise.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-element">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border ${
                plan.popular ? 'border-[2px] border-foreground' : 'border border-foreground'
              } p-6`}
            >
              <div className="mb-6 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide">{plan.name}</h3>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{plan.price}</div>
                  {plan.subtitle && (
                    <p className="text-xs">{plan.subtitle}</p>
                  )}
                  {plan.altPrice && (
                    <p className="text-xs font-medium">or {plan.altPrice}</p>
                  )}
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className={`w-full mb-6 text-xs ${!plan.popular ? 'border-foreground' : ''}`}
                size="sm"
                onClick={() => handlePlanClick(plan.name)}
                disabled={loading}
              >
                {loading ? "Processing..." : `${plan.cta} →`}
              </Button>

              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 stroke-[1.5]" />
                    <span className="text-xs leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
