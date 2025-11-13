import { Button } from "@/components/ui/button";

export const LiveAdSection = () => {
  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="border border-foreground p-8 max-w-md mx-auto mb-grid">
          <div className="space-y-6">
            <div className="bg-foreground text-background p-4">
              <h3 className="text-lg font-bold">YOUR PRODUCT</h3>
            </div>
            
            <div className="space-y-2 text-left">
              <div className="h-2 bg-foreground"></div>
              <div className="h-2 bg-foreground w-5/6"></div>
              <div className="h-2 bg-foreground w-4/6"></div>
            </div>

            <div className="border border-foreground py-3 px-6 inline-block font-bold text-xs">
              SHOP NOW
            </div>

            <div className="text-right text-[22px] opacity-70">
              Powered By xiXoi™
            </div>
          </div>
        </div>

        <div className="space-y-tight mb-element">
          <p className="text-2xl font-bold">
            Your ad is live.
          </p>
          <p className="text-base">
            Start free. It takes under 60 seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="text-base px-8 py-3 w-full sm:w-auto" onClick={() => window.location.href = '/auth'}>
            Start Free
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 py-3 w-full sm:w-auto border-foreground" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            How It Works
          </Button>
        </div>
      </div>
    </section>
  );
};
