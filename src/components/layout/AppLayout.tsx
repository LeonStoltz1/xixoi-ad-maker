import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { EffectiveTierBadge } from "@/components/EffectiveTierBadge";

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
      <EffectiveTierBadge />
      {/* UNIFIED HEADER - SAME AS LANDING PAGE */}
      <UnifiedHeader />

      {/* PAGE CONTENT — padding-top adjusted for h-32 header */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-36 pb-10">
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
