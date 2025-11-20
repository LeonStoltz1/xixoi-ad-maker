import { useEffectiveTier } from '@/hooks/useEffectiveTier';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

/**
 * Badge showing the effective tier being tested (only visible when admin override is active)
 */
export function EffectiveTierBadge() {
  const { tier, isOverridden, actualTier, isRealtor, isPolitical, loading } = useEffectiveTier();

  if (loading || !isOverridden) {
    return null;
  }

  const tierLabels: Record<string, string> = {
    free: 'Free',
    quickstart: 'Quick-Start',
    pro: 'Pro',
    elite: 'Elite',
    agency: 'Agency'
  };

  const modes: string[] = [];
  if (isRealtor) modes.push('Realtor');
  if (isPolitical) modes.push('Political');

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Badge 
        variant="outline" 
        className="bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:border-amber-400 dark:text-amber-400 shadow-lg"
      >
        <Sparkles className="w-3 h-3 mr-1" />
        Testing: {tierLabels[tier]}
        {modes.length > 0 && ` • ${modes.join(' • ')}`}
        {actualTier && actualTier !== tier && (
          <span className="ml-1 text-xs opacity-70">
            (actual: {tierLabels[actualTier]})
          </span>
        )}
      </Badge>
    </div>
  );
}