import { TrendingUp, ArrowDown } from "lucide-react";

export const AIBuildsSection = () => {
  return (
    <section className="flex items-center justify-center bg-background px-6 py-16">
      <div className="container mx-auto max-w-6xl text-center space-y-12">
        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-12 flex items-center justify-center">
          <ArrowDown className="w-16 h-16 md:w-20 md:h-20 animate-bounce" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-foreground rounded-xl p-6 animate-fade-in">
            <div className="aspect-square bg-foreground/5 rounded-lg mb-4"></div>
            <p className="text-sm font-medium">Static Image Ad</p>
          </div>
          
          <div className="border border-foreground rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="aspect-square bg-foreground/5 rounded-lg mb-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-l-2 border-foreground rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-sm font-medium">Video Frame</p>
          </div>
          
          <div className="border border-foreground rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="aspect-square bg-foreground/5 rounded-lg mb-4"></div>
            <p className="text-sm font-medium">UGC-Style Frame</p>
          </div>
          
          <div className="border border-foreground rounded-xl p-6 animate-fade-in flex flex-col justify-center" style={{ animationDelay: '0.3s' }}>
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <p className="text-2xl font-bold mb-2">3.2×</p>
            <p className="text-sm font-medium">Predicted ROAS</p>
          </div>
        </div>

        <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto">
          xiXoi™ builds intelligent ad variants automatically.
        </p>

        <div className="flex justify-center pt-8">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
