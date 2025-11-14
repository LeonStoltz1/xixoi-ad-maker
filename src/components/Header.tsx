import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logoDestination = isAuthenticated ? "/dashboard" : "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-32 bg-black border-b border-white/20">
      <div className="container mx-auto max-w-content px-6 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <Link to={logoDestination} className="text-lg md:text-xl font-bold font-heading flex items-center gap-2 text-white">
              <video 
                src="/xiXoiLogo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-32 h-32 object-contain"
              />
            </Link>
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
