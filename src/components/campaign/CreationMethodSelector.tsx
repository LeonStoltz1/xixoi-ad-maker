import { Link2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CreationMethodSelectorProps {
  onSelectMethod: (method: 'url' | 'scratch') => void;
}

export const CreationMethodSelector = ({ onSelectMethod }: CreationMethodSelectorProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">How would you like to start?</h2>
        <p className="text-muted-foreground text-lg">Choose the fastest path to your perfect ad</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* URL Import Option */}
        <Card
          className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary bg-card"
          onClick={() => onSelectMethod('url')}
        >
          <div className="p-8 space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Link2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-3 text-center">
              <h3 className="text-2xl font-bold">Start with a URL</h3>
              <p className="text-muted-foreground">
                Paste your website or product page. We'll extract images, content, and details automatically.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Auto-extract images & content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>AI generates ad copy from your site</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Launch in under 60 seconds</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="px-4 py-2 bg-primary/5 rounded-lg text-center font-medium text-primary">
                Fastest Method →
              </div>
            </div>
          </div>
        </Card>

        {/* Create from Scratch Option */}
        <Card
          className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary bg-card"
          onClick={() => onSelectMethod('scratch')}
        >
          <div className="p-8 space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-3 text-center">
              <h3 className="text-2xl font-bold">Create from Scratch</h3>
              <p className="text-muted-foreground">
                Upload your own image, video, or text. Full creative control with AI assistance.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Upload custom media</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>AI-powered copywriting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Complete creative flexibility</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="px-4 py-2 bg-secondary/50 rounded-lg text-center font-medium">
                Full Control →
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};