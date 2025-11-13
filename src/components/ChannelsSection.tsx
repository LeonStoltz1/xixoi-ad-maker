import { ArrowDown } from "lucide-react";

export const ChannelsSection = () => {
  const channels = ['META', 'TIKTOK', 'GOOGLE', 'LINKEDIN'];

  return (
    <section className="flex items-center justify-center bg-background px-6 py-section">
      <div className="w-full max-w-content mx-auto text-center space-y-element">
        <div className="flex justify-center pt-arrow pb-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {channels.map((channel) => (
            <div
              key={channel}
              className="border border-foreground px-6 py-4 text-sm font-bold hover:bg-foreground hover:text-background transition-all cursor-pointer"
            >
              {channel}
            </div>
          ))}
        </div>

        <p className="text-lg md:text-xl font-medium">
          Choose where your ad goes.
        </p>

        <div className="flex justify-center pt-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
