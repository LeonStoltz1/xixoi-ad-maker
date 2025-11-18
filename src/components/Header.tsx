import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { useRealtor } from "@/contexts/RealtorContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const navigate = useNavigate();
  const { realtorProfile, viewMode, setViewMode } = useRealtor();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        loadUserPlan(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        loadUserPlan(session.user.id);
      } else {
        setUserPlan('free');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserPlan = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    
    if (profile) {
      setUserPlan(profile.plan || 'free');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const logoDestination = isAuthenticated ? "/dashboard" : "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-32 bg-black border-b border-white/20">
      <div className="mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo - Left Side */}
        <Link to={logoDestination} className="flex items-center gap-3 text-white group">
          <video 
            src="/xiXoiLogo.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-32 h-32 object-contain"
          />
          <div className="hidden md:flex flex-col justify-center border-l border-white/20 pl-3">
            <span className="text-xs text-white/40 uppercase tracking-wider font-mono">
              Pronounced
            </span>
            <span className="text-sm text-white/60 font-mono tracking-wide">
              ZEE-ZOY
            </span>
          </div>
        </Link>
        
        {/* User Controls - Right Side */}
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
              {/* Realtor Mode Toggle - Only shown for realtors */}
              {realtorProfile?.isRealtor && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/20">
                  <Label htmlFor="view-mode" className="text-xs text-white/70 cursor-pointer">
                    General
                  </Label>
                  <Switch
                    id="view-mode"
                    checked={viewMode === 'realtor'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'realtor' : 'general')}
                  />
                  <Label htmlFor="view-mode" className="text-xs text-white/70 cursor-pointer">
                    Realtor
                  </Label>
                </div>
              )}
              
              {/* Connected Accounts Link - Only for Pro/Agency users */}
              {(userPlan === 'pro' || userPlan === 'elite' || userPlan === 'agency') && (
                <button 
                  onClick={() => navigate('/connect-platforms')}
                  className="px-3 py-1.5 border border-white/20 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Connected Accounts
                </button>
              )}

              {/* Plan Badge */}
              <div className="px-3 py-1.5 border border-white/20 text-sm">
                <span className="text-white uppercase tracking-wide">
                  {userPlan === 'pro' ? 'PRO' : userPlan === 'elite' ? 'ELITE' : userPlan === 'agency' ? 'AGENCY' : 'FREE'}
                </span>
              </div>
              
              {/* Upgrade Link */}
              <button 
                onClick={() => navigate('/', { state: { scrollToPricing: true } })}
                className="text-white hover:text-white/80 transition-colors text-sm"
              >
                Upgrade
              </button>
              
              {/* External Link Icon */}
              <ExternalLink className="w-5 h-5 text-white" />
              
              {/* Sign Out */}
              <button 
                onClick={handleSignOut}
                className="text-white hover:text-white/80 transition-colors text-sm"
              >
                Sign Out
              </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/auth?mode=login')}
              className="text-white hover:text-white/80 transition-colors text-sm px-3 py-1.5"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-white text-black hover:bg-white/90 transition-colors text-sm px-4 py-2 border border-black"
            >
              Start Free
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
