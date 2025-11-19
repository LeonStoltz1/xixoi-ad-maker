import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

type AppLayoutProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

export function AppLayout({ 
  title, 
  subtitle,
  showBack, 
  backTo, 
  backLabel = "Previous page",
  children 
}: AppLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <Header />

      {/* Main Content with proper top padding to prevent overlap */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-[720px] mx-auto">
          {/* Standardized Back Navigation */}
          {showBack && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-8 border border-foreground/30 hover:bg-foreground/10 hover:border-foreground/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Button>
          )}

          {/* Page Title */}
          {title && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
