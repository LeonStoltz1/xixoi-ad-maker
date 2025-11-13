import { Slider } from "@/components/ui/slider";
import { ArrowDown } from "lucide-react";

export const TargetingSection = () => {
  return (
    <section className="flex items-center justify-center bg-background px-6 py-section">
      <div className="w-full max-w-content mx-auto text-center space-y-element">
        <div className="flex justify-center pt-arrow pb-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>

        <div className="border border-foreground p-8 text-left space-y-element">
          {/* Editable: Location */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wide">Location</label>
            <input 
              type="text" 
              value="Japan" 
              readOnly
              className="w-full px-4 py-3 border border-foreground bg-background"
            />
          </div>

          {/* Editable: Daily Budget */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wide">Daily Budget</label>
            <div className="space-y-4">
              <Slider defaultValue={[20]} max={500} min={5} step={1} className="py-4" />
              <p className="text-xl font-bold">$20/day</p>
            </div>
          </div>

          {/* AI-Generated Read-Only: Suggested Audience */}
          <div className="space-y-3 pt-element border-t border-foreground">
            <label className="text-sm font-semibold uppercase tracking-wide">Suggested Audience</label>
            
            <div className="space-y-3">
              <div className="px-4 py-3 border border-foreground">
                <p className="text-sm font-medium">Women 25–45, Engaged Shoppers</p>
              </div>
              
              <p className="text-xs opacity-70">
                Based on your upload content and detected product category.
              </p>
              
              <div className="px-4 py-3 border border-foreground">
                <p className="text-xs">
                  <span className="font-semibold">Recommended channels:</span> Meta, TikTok, Google
                </p>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="text-center pt-element">
            <p className="text-[11px] opacity-60">Auto-targeted by xiXoi™</p>
          </div>
        </div>

        <p className="text-lg md:text-xl font-medium">
          Set location and budget. xiXoi™ auto-targets everything else.
        </p>

        <div className="flex justify-center pt-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
