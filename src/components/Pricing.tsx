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
    price: "$5",
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
      "Autonomous AI optimizer",
      "Auto-pause bad ads",
      "Auto-increase winning ads",
      "Predictive bidding",
      "Custom avatars/UGC styles",
      "Affiliate dashboard (earn 20%)",
      "VIP support",
    ],
    cta: "Become Elite",
  },
  {
    name: "AGENCY WHITE-LABEL",
    price: "$999",
    subtitle: "/month",
    features: [
      "White-label xiXoi™ platform",
      "Team seats",
      "Client billing",
      "API access",
      "Unlimited AI variants",
      "No watermark",
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
      // Redirect to auth page with plan parameter
      navigate('/auth?plan=pro');
    } else if (planName === "SCALE ELITE") {
      navigate('/auth?plan=elite');
    } else if (planName === "AGENCY WHITE-LABEL") {
      navigate('/auth?plan=agency');
    }
  };

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
            Simple Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Pure simplicity. No clutter. No noise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border-2 ${
                plan.popular ? 'border-foreground' : 'border-foreground/30'
              } rounded-2xl p-8 transition-all hover:border-foreground`}
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold uppercase tracking-wide mb-4">{plan.name}</h3>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{plan.price}</div>
                  {plan.subtitle && (
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  )}
                  {plan.altPrice && (
                    <p className="text-sm font-medium">or {plan.altPrice}</p>
                  )}
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-6"
                size="lg"
                onClick={() => handlePlanClick(plan.name)}
                disabled={loading}
              >
                {loading ? "Processing..." : `${plan.cta} →`}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed whitespace-pre-line">
                      {feature.includes('/LinkedIn') 
                        ? feature.replace('/LinkedIn', '/\nLinkedIn')
                        : feature}
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
