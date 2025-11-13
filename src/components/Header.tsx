import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-black border-b border-white/20">
      <div className="container mx-auto max-w-content px-6 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold font-heading flex items-center gap-2 text-white">
              <video 
                src="/xiXoiLogo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-16 h-16 object-contain"
              />
              xiXoi™
            </a>
            <nav className="hidden md:flex gap-6">
              <a href="#how-it-works" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                FAQ
              </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
            <Button size="sm" className="bg-white text-black hover:bg-white/90" onClick={() => window.location.href = '/auth'}>
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
