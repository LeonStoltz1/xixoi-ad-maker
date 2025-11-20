import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export const Hero = () => {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      const headerOffset = 128;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="pt-[300px] pb-section flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="space-y-tight">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight font-heading">
            Paid Advertising<br />for Every Humanoid.
          </h1>
          <p className="text-lg md:text-xl pt-tight opacity-70">
            And soon, robots too.
          </p>
          <p className="text-base md:text-lg pt-2">
            Launch ads instantly on Meta, TikTok, Google, LinkedIn, and X.<br />
            No ad account required. No skills needed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-element">
          <Button size="lg" className="text-base px-8 py-3 w-full sm:w-auto" onClick={() => window.location.href = '/auth?mode=signup'}>
            Start Free
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 py-3 w-full sm:w-auto border-foreground" onClick={scrollToHowItWorks}>
            How It Works
          </Button>
        </div>

        <div className="flex justify-center pt-arrow mt-arrow mb-[50px]">
          <button 
            onClick={scrollToHowItWorks}
            className="animate-bounce"
            aria-label="Scroll to how it works section"
          >
            <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1]" />
          </button>
        </div>
      </div>
    </section>
  );
};
