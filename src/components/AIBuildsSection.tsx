import { TrendingUp, ArrowDown } from "lucide-react";

export const AIBuildsSection = () => {
  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="grid grid-cols-2 gap-grid mb-grid">
          {/* Static Image Ad - More realistic mockup */}
          <div className="border border-foreground aspect-square flex flex-col overflow-hidden">
            <div className="flex-1 bg-foreground/5 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-foreground/20"></div>
              </div>
            </div>
            <div className="p-4 space-y-2 bg-background">
              <div className="h-3 bg-foreground w-full"></div>
              <div className="h-3 bg-foreground w-3/4"></div>
              <div className="mt-3 pt-3 border-t border-foreground">
                <div className="h-8 border border-foreground flex items-center justify-center">
                  <span className="text-xs font-bold">SHOP NOW</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 text-center border-t border-foreground">
              <span className="text-xs font-medium">Static Image Ad</span>
            </div>
          </div>
          
          {/* Video Frame - Play button mockup */}
          <div className="border border-foreground aspect-square flex flex-col overflow-hidden">
            <div className="flex-1 bg-foreground/5 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-foreground border-b-8 border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2 bg-background">
              <div className="h-3 bg-foreground w-full"></div>
              <div className="h-3 bg-foreground w-2/3"></div>
            </div>
            <div className="px-4 py-2 text-center border-t border-foreground">
              <span className="text-xs font-medium">Video Frame</span>
            </div>
          </div>
          
          {/* UGC-Style - Profile circle + content */}
          <div className="border border-foreground aspect-square flex flex-col overflow-hidden">
            <div className="p-3 bg-background border-b border-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 border-2 border-foreground rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-foreground w-20"></div>
                  <div className="h-2 bg-foreground/50 w-16"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-foreground/5"></div>
            <div className="p-3 bg-background space-y-2 border-t border-foreground">
              <div className="h-2 bg-foreground w-full"></div>
              <div className="h-2 bg-foreground w-4/5"></div>
            </div>
            <div className="px-4 py-2 text-center border-t border-foreground">
              <span className="text-xs font-medium">UGC-Style</span>
            </div>
          </div>
          
          {/* ROAS Prediction - Data visualization */}
          <div className="border border-foreground aspect-square flex flex-col justify-center items-center p-6">
            <TrendingUp className="w-12 h-12 mb-3 stroke-[2]" />
            <p className="text-5xl font-bold mb-1">3.2×</p>
            <p className="text-sm font-bold mb-4">ROAS</p>
            <div className="w-full space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-1 bg-foreground w-full"></div>
                <span className="text-xs whitespace-nowrap">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 bg-foreground w-3/4"></div>
                <span className="text-xs whitespace-nowrap">Med</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 bg-foreground w-1/2"></div>
                <span className="text-xs whitespace-nowrap">Low</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-lg md:text-xl font-medium">
          xiXoi™ builds intelligent ad variants automatically.
        </p>

        <div className="flex justify-center mt-arrow pt-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1] animate-bounce" />
        </div>
      </div>
    </section>
  );
};
