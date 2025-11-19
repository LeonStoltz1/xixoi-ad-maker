import { Button } from "@/components/ui/button";
import { Upload, Target, DollarSign, CreditCard, CheckCircle } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload anything.",
    description: "Image, video, or text. xiXoi builds ad variants for every platform.",
  },
  {
    number: 2,
    icon: Target,
    title: "Choose where it runs.",
    description: "Meta, TikTok, Google, LinkedIn, and X.",
  },
  {
    number: 3,
    icon: DollarSign,
    title: "Set budget once.",
    description: "Tell us your daily or weekly budget. xiXoi auto-targets everything else.",
  },
  {
    number: 4,
    icon: CreditCard,
    title: "Pick your plan.",
    description: "Free for previews, Quick-Start if you don't have ad accounts, Pro/Elite/Agency if you do.",
  },
  {
    number: 5,
    icon: CheckCircle,
    title: "Your ad is live.",
    description: "Start free. It takes under 60 seconds.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-section px-6 bg-background border-t border-foreground">
      <div className="w-full max-w-content mx-auto">
        <div className="text-center mb-grid space-y-tight">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            How It Works
          </h2>
          <p className="text-base opacity-70">
            Five steps. Under 60 seconds.
          </p>
        </div>

        <div className="space-y-element">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="border border-foreground p-6 bg-background"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 border border-foreground flex items-center justify-center">
                    <span className="text-xl font-bold">{step.number}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 stroke-[1.5]" />
                      <h3 className="text-lg font-bold">{step.title}</h3>
                    </div>
                    <p className="text-sm opacity-70">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-grid text-center">
          <Button
            size="lg"
            className="text-base px-8 py-3"
            onClick={() => window.location.href = '/auth?mode=signup'}
          >
            Start Free →
          </Button>
        </div>
      </div>
    </section>
  );
};
