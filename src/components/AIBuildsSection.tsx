import { TrendingUp, ArrowDown } from "lucide-react";

export const AIBuildsSection = () => {
  return (
    <section className="flex items-center justify-center bg-background px-6 py-section">
      <div className="w-full max-w-content mx-auto text-center space-y-element">
        <div className="flex justify-center pt-arrow pb-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>

        <div className="grid grid-cols-2 gap-element">
          <div className="border border-foreground p-6 aspect-square flex flex-col justify-center items-center">
            <div className="w-full h-24 border-t-4 border-foreground mb-4"></div>
            <div className="space-y-2 w-full">
              <div className="h-2 bg-foreground"></div>
              <div className="h-2 bg-foreground w-4/5"></div>
            </div>
            <div className="mt-4 text-xs font-medium">Static Image Ad</div>
          </div>
          
          <div className="border border-foreground p-6 aspect-square flex flex-col justify-center items-center">
            <div className="w-16 h-16 border-l-2 border-foreground rounded-full animate-spin mb-4"></div>
            <div className="text-xs font-medium">Video Frame</div>
          </div>
          
          <div className="border border-foreground p-6 aspect-square flex flex-col justify-center items-center">
            <div className="w-full h-24 border-t-4 border-foreground mb-4"></div>
            <div className="space-y-2 w-full">
              <div className="h-2 bg-foreground w-3/4"></div>
              <div className="h-2 bg-foreground w-full"></div>
            </div>
            <div className="mt-4 text-xs font-medium">UGC-Style Frame</div>
          </div>
          
          <div className="border border-foreground p-6 aspect-square flex flex-col justify-center items-center">
            <TrendingUp className="w-12 h-12 mb-2 stroke-[1.5]" />
            <p className="text-3xl font-bold">3.2×</p>
            <p className="text-xs font-medium mt-1">ROAS</p>
          </div>
        </div>

        <p className="text-lg md:text-xl font-medium">
          xiXoi™ builds intelligent ad variants automatically.
        </p>

        <div className="flex justify-center pt-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
