import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    price: "$0",
    features: [
      "Build up to 1 ad/day",
      '"Powered By xiXoi™" watermark',
      "Basic AI generation",
      "Auto-targeting suggestions",
      "Publish to Meta/TikTok/Google/",
      "LinkedIn",
    ],
    cta: "Start Free",
  },
  {
    name: "PUBLISH PRO",
    price: "$29",
    subtitle: "per ad set",
    altPrice: "or $99/mo unlimited",
    features: [
      "Remove watermark",
      "Publish instantly",
      "4 AI variants",
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
    subtitle: "/mo + 5% ad spend",
    features: [
      "Everything in Publish Pro",
      "Autonomous AI optimizer",
      "Auto-pause bad ads",
      "Auto-scale winning ads",
      "Predictive bidding",
      "Custom avatars/UGC styles",
      "Affiliate dashboard (earn 20%)",
    ],
    cta: "Become Elite",
  },
  {
    name: "AGENCY WHITE-LABEL",
    price: "$999",
    subtitle: "/mo",
    features: [
      "Everything in Scale Elite",
      "White-label xiXoi™",
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
    <section className="py-[120px] md:py-[120px] sm:py-16 px-6 bg-background">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Simple Pricing
          </h2>
          <p className="text-base text-foreground/80">
            Pure simplicity. No clutter. No noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border bg-background flex flex-col ${
                plan.popular 
                  ? 'border-[2px] border-foreground shadow-[0_2px_0_#000]' 
                  : 'border border-foreground'
              } p-6 md:p-8 text-left md:text-left`}
            >
              <div className="mb-6 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px]">{plan.name}</h3>
                <div className="space-y-1">
                  <div className="text-[36px] md:text-[48px] font-bold leading-none">{plan.price}</div>
                  {plan.subtitle && (
                    <p className="text-sm text-foreground/70">{plan.subtitle}</p>
                  )}
                  {plan.altPrice && (
                    <p className="text-sm text-foreground/70">{plan.altPrice}</p>
                  )}
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className={`w-full h-12 mb-6 text-sm font-medium ${
                  plan.popular 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'border-foreground hover:bg-foreground hover:text-background'
                }`}
                onClick={() => handlePlanClick(plan.name)}
                disabled={loading}
              >
                {loading ? "Processing..." : `${plan.cta} →`}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-left">
                    <span className="text-foreground flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-sm leading-[1.6]">
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
