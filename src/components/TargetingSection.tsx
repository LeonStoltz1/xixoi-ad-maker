import { Slider } from "@/components/ui/slider";

export const TargetingSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="container mx-auto max-w-2xl text-center space-y-16">
        <div className="border border-foreground rounded-2xl p-8 md:p-12 space-y-8 text-left">
          <div className="space-y-3 animate-fade-in">
            <label className="text-sm font-medium uppercase tracking-wide">Location</label>
            <input 
              type="text" 
              value="Japan" 
              readOnly
              className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
            />
          </div>

          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm font-medium uppercase tracking-wide">Audience</label>
            <input 
              type="text" 
              value="Age 25–45" 
              readOnly
              className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
            />
          </div>

          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <label className="text-sm font-medium uppercase tracking-wide">Daily Budget</label>
            <div className="space-y-4">
              <Slider defaultValue={[20]} max={100} step={1} className="py-4" />
              <p className="text-2xl font-bold">$20/day</p>
            </div>
          </div>
        </div>

        <p className="text-xl md:text-2xl font-medium">
          Set location, audience, and daily budget.
        </p>
      </div>
    </section>
  );
};
