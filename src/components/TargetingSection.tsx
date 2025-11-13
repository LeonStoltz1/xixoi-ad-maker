import { Slider } from "@/components/ui/slider";
import { ArrowDown } from "lucide-react";

export const TargetingSection = () => {
  return (
    <section className="flex items-center justify-center bg-background px-6 py-16">
      <div className="container mx-auto max-w-2xl text-center space-y-12">
        <div className="border border-foreground rounded-2xl p-8 md:p-12 space-y-8 text-left">
          {/* Editable: Location */}
          <div className="space-y-3 animate-fade-in">
            <label className="text-sm font-medium uppercase tracking-wide">Location</label>
            <input 
              type="text" 
              value="Japan" 
              readOnly
              className="w-full px-4 py-3 border border-foreground rounded-lg bg-background"
            />
          </div>

          {/* Editable: Daily Budget */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm font-medium uppercase tracking-wide">Daily Budget</label>
            <div className="space-y-4">
              <Slider defaultValue={[20]} max={500} min={5} step={1} className="py-4" />
              <p className="text-2xl font-bold">$20/day</p>
            </div>
          </div>

          {/* AI-Generated Read-Only: Suggested Audience */}
          <div className="space-y-4 pt-4 border-t border-foreground/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <label className="text-sm font-medium uppercase tracking-wide">Suggested Audience</label>
            
            <div className="space-y-3">
              <div className="px-4 py-3 border border-foreground/30 rounded-lg bg-foreground/5">
                <p className="text-base font-medium">Women 25–45, Engaged Shoppers</p>
              </div>
              
              <p className="text-sm opacity-60">
                Based on your upload content and detected product category.
              </p>
              
              <div className="px-4 py-3 border border-foreground/30 rounded-lg bg-foreground/5">
                <p className="text-sm">
                  <span className="font-medium">Recommended channels:</span> Meta, TikTok, Google
                </p>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="pt-4 text-center">
            <p className="text-xs opacity-50">Auto-targeted by xiXoi™</p>
          </div>
        </div>

        <p className="text-xl md:text-2xl font-medium">
          Set location and budget. xiXoi™ handles the rest.
        </p>

        <div className="flex justify-center pt-8">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
