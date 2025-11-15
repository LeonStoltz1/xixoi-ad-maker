import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export const Hero = () => {
  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-[300px] pb-section flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="space-y-tight">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight font-heading">
            Your Ad.<br />Already Done.
          </h1>
          <p className="text-lg md:text-xl pt-tight">
            Upload once. xiXoi™ handles the rest.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-element">
          <Button size="lg" className="text-base px-8 py-3 w-full sm:w-auto" onClick={() => window.location.href = '/auth'}>
            Start Free
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 py-3 w-full sm:w-auto border-foreground" onClick={scrollToUpload}>
            How It Works
          </Button>
        </div>

        <div className="flex justify-center pt-arrow mt-arrow mb-[50px]">
          <button 
            onClick={scrollToUpload}
            className="animate-bounce"
            aria-label="Scroll to upload section"
          >
            <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1]" />
          </button>
        </div>
      </div>
    </section>
  );
};
