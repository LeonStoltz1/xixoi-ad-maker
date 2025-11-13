import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 overflow-hidden">
      {/* Background Video */}
      <video 
        src="/header-banner.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      
      {/* Navigation Content */}
      <div className="relative z-10 h-full border-b border-border/30">
        <div className="container mx-auto max-w-6xl px-6 h-full flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-12">
              <a href="/" className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
                <video 
                  src="/xiXoiLogo.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-10 h-10 object-contain"
                />
                xiXoi™
              </a>
              <nav className="hidden md:flex gap-8">
                <a href="#how-it-works" className="text-sm font-medium text-white hover:text-accent transition-colors">
                  How It Works
                </a>
                <a href="#pricing" className="text-sm font-medium text-white hover:text-accent transition-colors">
                  Pricing
                </a>
                <a href="#faq" className="text-sm font-medium text-white hover:text-accent transition-colors">
                  FAQ
                </a>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">
                Sign In
              </Button>
              <Button variant="hero" size="sm">
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
