import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5 pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Create Ads
              <span className="block text-accent">Instantly.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              No Experience Needed.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              Start Free
              <ArrowRight className="ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              See How It Works
            </Button>
          </div>

          <div className="pt-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-6">
              Trusted by forward-thinking brands
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
              <div className="text-2xl font-bold">META</div>
              <div className="text-2xl font-bold">TIKTOK</div>
              <div className="text-2xl font-bold">GOOGLE</div>
              <div className="text-2xl font-bold">LINKEDIN</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl -z-10" />
    </section>
  );
};
