import { ArrowDown } from "lucide-react";

export const ChannelsSection = () => {
  const channels = ['META', 'TIKTOK', 'GOOGLE', 'LINKEDIN'];

  return (
    <section className="flex items-center justify-center bg-background px-6 py-16">
      <div className="container mx-auto max-w-4xl text-center space-y-12">
        <div className="flex flex-wrap justify-center gap-6">
          {channels.map((channel, index) => (
            <div
              key={channel}
              className="border-2 border-foreground rounded-full px-8 py-4 text-lg md:text-xl font-bold hover:bg-foreground hover:text-background transition-all cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {channel}
            </div>
          ))}
        </div>

        <p className="text-xl md:text-2xl font-medium">
          Choose where your ad goes.
        </p>

        <div className="flex justify-center pt-8">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
