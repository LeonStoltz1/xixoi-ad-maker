import { Image, Video, FileText } from "lucide-react";

export const UploadSection = () => {
  return (
    <section id="upload-section" className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <div className="container mx-auto max-w-4xl text-center space-y-12">
        <div className="border-2 border-foreground rounded-2xl p-16 md:p-24 transition-all hover:border-foreground/50">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <Image className="w-12 h-12 md:w-16 md:h-16" />
              <span className="text-sm md:text-base">Image</span>
            </div>
            <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Video className="w-12 h-12 md:w-16 md:h-16" />
              <span className="text-sm md:text-base">Video</span>
            </div>
            <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <FileText className="w-12 h-12 md:w-16 md:h-16" />
              <span className="text-sm md:text-base">Text</span>
            </div>
          </div>
        </div>
        
        <p className="text-xl md:text-2xl font-medium">Upload anything.</p>
      </div>
    </section>
  );
};
