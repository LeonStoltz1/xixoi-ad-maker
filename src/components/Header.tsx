import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Crown, Settings } from "lucide-react";

export const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const navigate = useNavigate();

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
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Plan Badge */}
              <div className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                userPlan !== 'free'
                  ? 'bg-white/10 border-white/30 text-white' 
                  : 'bg-white/5 border-white/20 text-white/70'
              } flex items-center gap-2`}>
                {userPlan !== 'free' && <Crown className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="font-medium uppercase">
                  {userPlan === 'pro' ? 'Pro' : userPlan === 'elite' ? 'Elite' : userPlan === 'agency' ? 'Agency' : 'Free'}
                </span>
              </div>
              
              {userPlan === 'free' && (
                <Button size="sm" onClick={() => {
                  navigate('/', { state: { scrollToPricing: true } });
                }}>
                  Upgrade
                </Button>
              )}
              
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => navigate('/auth?mode=login')}>
                Sign In
              </Button>
              <Button size="sm" className="bg-white text-black hover:bg-white/90" onClick={() => navigate('/auth?mode=signup')}>
                Start Free
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
