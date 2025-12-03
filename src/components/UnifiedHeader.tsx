import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, FolderOpen, Menu, LayoutDashboard } from "lucide-react";
import { useRealtor } from "@/contexts/RealtorContext";
import { Switch } from "@/components/ui/switch";
import { SavedImagesLibrary } from "@/components/SavedImagesLibrary";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const UnifiedHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSavedLibrary, setShowSavedLibrary] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { realtorProfile, viewMode, setViewMode } = useRealtor();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        loadUserPlan(session.user.id);
      }
    });

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

    const { data: adminCheck } = await supabase.rpc('is_admin', {
      _user_id: userId
    });
    
    if (adminCheck) {
      setIsAdmin(true);
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
        {/* Logo - Left Side - EXACT MATCH TO SCREENSHOT */}
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
        
        {/* Hamburger Menu - Right Side */}
        {isAuthenticated ? (
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-white hover:bg-white/10 transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-black border-l border-white/20">
              <nav className="flex flex-col gap-4 mt-8">
                {/* Dashboard Link */}
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>

                {/* Realtor Mode Toggle - Only shown for realtors */}
                {realtorProfile?.isRealtor && (
                  <div className="flex flex-col gap-2 px-4 py-3 bg-white/5 border border-white/20">
                    <span className="text-xs text-white/60 uppercase tracking-wider">View Mode</span>
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => setViewMode('general')}
                        className={`text-sm cursor-pointer transition-all ${
                          viewMode === 'general' 
                            ? 'text-white font-bold' 
                            : 'text-white/50 hover:text-white/70'
                        }`}
                      >
                        General
                      </span>
                      <Switch
                        id="menu-view-mode"
                        checked={viewMode === 'realtor'}
                        onCheckedChange={(checked) => setViewMode(checked ? 'realtor' : 'general')}
                      />
                      <span 
                        onClick={() => setViewMode('realtor')}
                        className={`text-sm cursor-pointer transition-all ${
                          viewMode === 'realtor' 
                            ? 'text-white font-bold' 
                            : 'text-white/50 hover:text-white/70'
                        }`}
                      >
                        Realtor
                      </span>
                    </div>
                  </div>
                )}

                {/* Saved Images Library Button */}
                <button 
                  onClick={() => {
                    setShowSavedLibrary(true);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>My Images</span>
                </button>

                {/* Admin Link - Only shown for admins */}
                {isAdmin && (
                  <button 
                    onClick={() => {
                      navigate('/admin/platform-credentials');
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                  >
                    <span>Admin</span>
                  </button>
                )}
                
                {/* Connected Accounts Link - Only for Pro/Agency users */}
                {(userPlan === 'pro' || userPlan === 'elite' || userPlan === 'agency') && (
                  <button 
                    onClick={() => {
                      navigate('/connect-platforms');
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                  >
                    <span>Connected Accounts</span>
                  </button>
                )}

                {/* Plan Badge */}
                <div className="px-4 py-3 border border-white/20">
                  <span className="text-xs text-white/60 uppercase tracking-wider block mb-1">Current Plan</span>
                  <span className="text-white uppercase tracking-wide font-bold">
                    {userPlan === 'quickstart' 
                      ? 'QUICK-START' 
                      : userPlan === 'pro' 
                      ? 'PRO' 
                      : userPlan === 'elite' 
                      ? 'ELITE' 
                      : userPlan === 'agency' 
                      ? 'AGENCY' 
                      : 'FREE'}
                  </span>
                </div>
                
                {/* Upgrade Link */}
                <button 
                  onClick={() => {
                    navigate('/', { state: { scrollToPricing: true } });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Upgrade</span>
                </button>
                
                {/* Sign Out */}
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors border border-white/20"
                >
                  <span>Sign Out</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
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

      {/* Saved Images Library Modal */}
      <SavedImagesLibrary
        isOpen={showSavedLibrary}
        onClose={() => setShowSavedLibrary(false)}
      />
    </header>
  );
};
