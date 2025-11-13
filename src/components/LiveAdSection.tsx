import { Button } from "@/components/ui/button";

export const LiveAdSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="container mx-auto max-w-4xl text-center space-y-16">
        <div className="border-2 border-foreground rounded-2xl p-8 md:p-12 max-w-2xl mx-auto animate-scale-in">
          <div className="space-y-6">
            <div className="bg-foreground text-background p-6 rounded-lg">
              <h3 className="text-2xl md:text-3xl font-bold">Your Product Here</h3>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="h-3 bg-foreground/80 rounded"></div>
              <div className="h-3 bg-foreground/60 rounded"></div>
              <div className="h-3 bg-foreground/60 rounded w-4/5"></div>
            </div>

            <div className="border border-foreground rounded-lg py-3 px-6 inline-block font-medium">
              SHOP NOW
            </div>

            <div className="text-right text-sm opacity-50 pt-4">
              Powered By xiXoi™
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-2xl md:text-3xl font-bold">
            Your ad is live.
          </p>
          <p className="text-lg md:text-xl text-muted-foreground">
            Start free. It takes under 60 seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto" onClick={() => window.location.href = '/auth'}>
            Start Free
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            How It Works
          </Button>
        </div>
      </div>
    </section>
  );
};
