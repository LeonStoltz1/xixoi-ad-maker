/**
 * Platform Cost Warning Banner Component
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { usePlatformCosts } from '@/hooks/usePlatformCosts';
import { useNavigate } from 'react-router-dom';

export function PlatformCostWarning() {
  const { costProfile, showWarning, showCritical, warningMessage } = usePlatformCosts();
  const navigate = useNavigate();

  if (!costProfile || (!showWarning && !showCritical)) {
    return null;
  }

  const usagePercentage = ((1 - costProfile.marginPercentage) * 100).toFixed(0);
  const shouldShowUpgrade = costProfile.marginPercentage < 0.30; // Show upgrade at 70%+ usage

  return (
    <Alert 
      variant={showCritical ? 'destructive' : 'default'}
      className={showCritical 
        ? 'border-destructive bg-destructive/10' 
        : 'border-yellow-500 bg-yellow-500/10'
      }
    >
      {showCritical ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      )}
      <AlertTitle className={showCritical ? '' : 'text-yellow-700'}>
        {showCritical ? 'AI Usage Limit Reached' : 'Approaching AI Usage Cap'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className={showCritical ? '' : 'text-yellow-600'}>
          {warningMessage}
        </span>
        {shouldShowUpgrade && (
          <Button 
            variant="outline" 
            size="sm"
            className="ml-4 shrink-0"
            onClick={() => navigate('/pricing')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Button>
        )}
      </AlertDescription>
      
      {/* Usage breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-80">
        <div>AI Usage: {usagePercentage}%</div>
        <div>Tier Limit: ${costProfile.tierLimit.toFixed(2)}/mo</div>
        <div>Total Cost: ${costProfile.totalCost.toFixed(4)}</div>
        <div>Remaining: ${costProfile.marginRemaining.toFixed(4)}</div>
      </div>
    </Alert>
  );
}
