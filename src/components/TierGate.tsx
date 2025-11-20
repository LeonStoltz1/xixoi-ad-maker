import { ReactNode } from 'react';
import { useEffectiveTier, hasTierAccess } from '@/hooks/useEffectiveTier';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TierGateProps {
  requiredTier: 'quickstart' | 'pro' | 'elite' | 'agency';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Component that gates content based on user's effective tier.
 * Respects admin overrides for testing.
 */
export function TierGate({ 
  requiredTier, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: TierGateProps) {
  const { tier, loading, isOverridden } = useEffectiveTier();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  const hasAccess = hasTierAccess(tier, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    const tierLabels: Record<string, string> = {
      quickstart: 'Quick-Start',
      pro: 'Publish Pro',
      elite: 'Scale Elite',
      agency: 'Agency'
    };

    return (
      <div className="bg-muted border border-border p-6 rounded-lg text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {tierLabels[requiredTier]} Required
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This feature requires {tierLabels[requiredTier]} tier or higher.
          {isOverridden && (
            <span className="block mt-2 text-amber-600 dark:text-amber-400">
              (You're testing with admin overrides)
            </span>
          )}
        </p>
        <Button onClick={() => navigate('/pricing')}>
          View Pricing Plans
        </Button>
      </div>
    );
  }

  return null;
}