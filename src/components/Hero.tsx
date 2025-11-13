import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export const Hero = () => {
  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-background px-6 pt-20 pb-8">
      <div className="container mx-auto max-w-4xl text-center space-y-8">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-heading">
            Your Ad.<br />Already Done.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Upload once. xiXoi™ handles everything.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto" onClick={() => window.location.href = '/auth'}>
            Start Free
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto" onClick={scrollToUpload}>
            How It Works
          </Button>
        </div>

        <div className="flex justify-center pt-8">
          <button 
            onClick={scrollToUpload}
            className="animate-bounce"
            aria-label="Scroll to upload section"
          >
            <ArrowDown className="w-12 h-12 md:w-16 md:h-16" />
          </button>
        </div>
      </div>
    </section>
  );
};
