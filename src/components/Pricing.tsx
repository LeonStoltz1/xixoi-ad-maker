import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying XIXOI",
    features: [
      "Unlimited campaigns",
      "AI-generated ads",
      "All platforms (Meta, TikTok, Google, LinkedIn)",
      '"Powered By XIXOI" branding on ads',
      "Basic analytics",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For serious advertisers",
    features: [
      "Everything in Free",
      "Remove branding on ALL ads",
      "Premium AI variations",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export const Pricing = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                plan.popular
                  ? "neon-border holographic scale-105"
                  : "glass-panel border-border/50 hover:border-accent/50 rim-light"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(15,98,254,0.5)]">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 font-heading">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold font-heading">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </div>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full mb-6"
                size="lg"
              >
                {plan.cta}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            You can also remove branding per campaign for a one-time fee
          </p>
        </div>
      </div>
    </section>
  );
};
