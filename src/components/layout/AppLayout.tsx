import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import xixoiLogoVideo from "@/assets/xixoi-logo-final.mp4";
import { AdminExperienceSwitcher } from "@/components/AdminExperienceSwitcher";
import { EffectiveTierBadge } from "@/components/EffectiveTierBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppLayoutProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

export function AppLayout({ title, subtitle, showBack, backTo, backLabel = "Back", children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignOutDialog(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <EffectiveTierBadge />
      {/* GLOBAL HEADER */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-neutral-800 bg-black overflow-hidden">
        {/* Background Banner Video */}
        <video 
          src="/header-banner.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          poster="/header-banner.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative mx-auto flex h-24 max-w-6xl items-center justify-between px-4">
          {/* Logo + brand */}
          <Link to="/" className="flex items-center gap-3 text-white">
            <video 
              src={xixoiLogoVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="h-20 w-auto"
            />
            <div className="flex items-center gap-2">
              <div className="h-full w-px bg-neutral-600"></div>
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] text-neutral-400">PRONOUNCED</span>
                <span className="text-[10.5px] font-semibold tracking-[0.25em]">
                  ZEE–ZOY
                </span>
              </div>
            </div>
          </Link>

          {/* Right-side nav */}
          <nav className="flex items-center gap-3 text-sm font-medium text-white">
            <AdminExperienceSwitcher />
            <Link to="/admin" className="rounded border border-neutral-600 px-3 py-1">
              Admin
            </Link>
            <span className="rounded border border-neutral-600 px-3 py-1">
              FREE
            </span>
            <Link to="/upgrade" className="px-3 py-1">
              Upgrade
            </Link>
            <button 
              onClick={() => setShowSignOutDialog(true)}
              className="px-3 py-1 hover:text-white/80 transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account and campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAGE CONTENT — padding-top MUST be taller than header */}
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-10">
        {/* Standardized back nav */}
        {showBack && (
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </button>
        )}

        {/* Optional page title */}
        {title && (
          <div className="mb-6">
            <h1 className="mb-2 text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-neutral-500">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
