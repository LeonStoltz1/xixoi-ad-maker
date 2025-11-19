import { ArrowDown } from "lucide-react";

export const ChannelsSection = () => {
  const channels = ['META']; // TODO: Re-enable other platforms: 'TIKTOK', 'GOOGLE', 'LINKEDIN', 'X'

  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto text-center">
        <div className="grid grid-cols-2 gap-tight mb-grid">
          {channels.map((channel) => (
            <div
            key={channel}
            className="border border-foreground px-6 py-4 text-xs md:text-sm font-bold hover:bg-foreground hover:text-background transition-all cursor-pointer"
          >
              {channel}
            </div>
          ))}
        </div>

        <p className="text-lg md:text-xl font-medium">
          Choose where your ad goes.
        </p>

        <div className="flex justify-center mt-arrow pt-arrow mb-[50px]">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 stroke-[1] animate-bounce" />
        </div>
      </div>
    </section>
  );
};
