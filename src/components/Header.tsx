import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50 rim-light">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/" className="text-2xl font-bold font-heading flex items-center gap-2">
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
              <a href="#how-it-works" className="text-sm font-medium hover:text-accent transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-accent transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium hover:text-accent transition-colors">
                FAQ
              </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button variant="hero" size="sm">
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
