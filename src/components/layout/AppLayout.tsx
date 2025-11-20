import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import xixoiLogoVideo from "@/assets/xixoi-logo-final.mp4";
import { AdminExperienceSwitcher } from "@/components/AdminExperienceSwitcher";

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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* GLOBAL HEADER */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-neutral-800 bg-black">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-4">
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
            <Link to="/sign-out" className="px-3 py-1">
              Sign Out
            </Link>
          </nav>
        </div>
      </header>

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
