import { Slider } from "@/components/ui/slider";
import { ArrowDown } from "lucide-react";

export const TargetingSection = () => {
  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="border border-foreground p-8 text-left mb-grid">
          <div className="space-y-element">
            {/* Location */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wide">Location</label>
              <input 
                type="text" 
                value="Japan" 
                readOnly
                className="w-full px-4 py-3 border border-foreground bg-background text-sm"
              />
            </div>

            {/* Daily Budget */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wide">Daily Budget</label>
              <div className="space-y-3">
                <Slider defaultValue={[20]} max={500} min={5} step={1} />
                <p className="text-base md:text-lg font-bold">$20/day</p>
              </div>
            </div>

            {/* Suggested Audience */}
            <div className="space-y-3 pt-element border-t border-foreground">
              <label className="text-xs font-bold uppercase tracking-wide">Suggested Audience</label>
              
              <div className="space-y-tight">
                <div className="px-4 py-3 border border-foreground">
                  <p className="text-xs md:text-sm font-medium">Women 25–45, Engaged Shoppers</p>
                </div>
                
                <p className="text-xs opacity-70">
                  Based on your upload content and detected product category.
                </p>
                
                <div className="px-4 py-3 border border-foreground">
                  <p className="text-xs">
                    <span className="font-bold">Recommended channels:</span> Meta, TikTok, Google
                  </p>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="text-center pt-element">
              <p className="text-[11px] opacity-60">Auto-targeted by xiXoi™</p>
            </div>
          </div>
        </div>

        <p className="text-lg md:text-xl font-medium">
          Set location and budget. xiXoi™ auto-targets everything else.
        </p>

        <div className="flex justify-center mt-arrow pt-arrow mb-[50px]">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1] animate-bounce" />
        </div>
      </div>
    </section>
  );
};
