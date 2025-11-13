import { Upload, Sparkles, Rocket } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Drop",
    description: "Upload your text, photo, or video. That's your idea.",
  },
  {
    icon: Sparkles,
    title: "Pay",
    description: "AI generates stunning ads. Choose free with branding or pay to remove it.",
  },
  {
    icon: Rocket,
    title: "Publish",
    description: "Launch directly to Meta, TikTok, Google, or LinkedIn. Done.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Three steps to instant advertising
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="bg-card rounded-2xl p-8 border border-border hover:border-accent transition-all duration-300 hover:shadow-lg h-full">
                <div className="bg-accent/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
