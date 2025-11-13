import { Image, Video, FileText, ArrowDown } from "lucide-react";

export const UploadSection = () => {
  return (
    <section id="upload-section" className="flex items-center justify-center bg-background px-6 py-section">
      <div className="w-full max-w-content mx-auto text-center space-y-element">
        <div className="flex justify-center pt-arrow pb-arrow">
          <ArrowDown className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col items-center gap-3">
            <Image className="w-12 h-12 md:w-16 md:h-16 stroke-[1]" />
            <span className="text-sm">Image</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Video className="w-12 h-12 md:w-16 md:h-16 stroke-[1]" />
            <span className="text-sm">Video</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 md:w-16 md:h-16 stroke-[1]" />
            <span className="text-sm">Text</span>
          </div>
        </div>
        
        <p className="text-lg md:text-xl font-medium">Upload anything.</p>
      </div>
    </section>
  );
};
