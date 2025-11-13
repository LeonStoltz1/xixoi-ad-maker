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

        <div className="border border-foreground rounded-xl p-8 max-w-md mx-auto animate-scale-in">
          <div className="aspect-square bg-foreground/5 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-foreground rounded"></div>
            <div className="h-4 bg-foreground/50 rounded"></div>
            <div className="h-4 bg-foreground/50 rounded w-3/4"></div>
            <div className="mt-4 border border-foreground rounded py-2 px-4 text-sm font-medium">
              LEARN MORE
            </div>
          </div>
        </div>

        <p className="text-xl md:text-2xl font-medium">
          Choose where your ad goes.
        </p>
      </div>
    </section>
  );
};
