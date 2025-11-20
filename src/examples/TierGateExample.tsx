import { TierGate } from '@/components/TierGate';
import { useEffectiveTier, hasTierAccess } from '@/hooks/useEffectiveTier';
import { Card } from '@/components/ui/card';

/**
 * Example showing how to use tier gating throughout the app.
 * Replace existing tier checks with these patterns.
 */
export function TierGateExample() {
  const { tier, isRealtor, isPolitical, loading } = useEffectiveTier();

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Tier Gating Examples</h2>

      {/* Example 1: Component-level gating with upgrade prompt */}
      <TierGate requiredTier="pro">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
          <p>This content is only visible to Pro tier and above.</p>
        </Card>
      </TierGate>

      {/* Example 2: Component-level gating with custom fallback */}
      <TierGate 
        requiredTier="elite" 
        fallback={
          <Card className="p-6 bg-muted">
            <p>Custom message: Elite tier required to see this.</p>
          </Card>
        }
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Elite Feature</h3>
          <p>This content is only visible to Elite tier and above.</p>
        </Card>
      </TierGate>

      {/* Example 3: Inline tier checking */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Your Access Level</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            <p>Current tier: <strong>{tier}</strong></p>
            <p>Can access Quick-Start features: {hasTierAccess(tier, 'quickstart') ? '✓' : '✗'}</p>
            <p>Can access Pro features: {hasTierAccess(tier, 'pro') ? '✓' : '✗'}</p>
            <p>Can access Elite features: {hasTierAccess(tier, 'elite') ? '✓' : '✗'}</p>
            <p>Can access Agency features: {hasTierAccess(tier, 'agency') ? '✓' : '✗'}</p>
            <p>Realtor mode: {isRealtor ? '✓' : '✗'}</p>
            <p>Political mode: {isPolitical ? '✓' : '✗'}</p>
          </div>
        )}
      </Card>

      {/* Example 4: Conditional rendering */}
      {hasTierAccess(tier, 'pro') && (
        <Card className="p-6 border-primary">
          <h3 className="text-lg font-semibold mb-2">Pro-Only Section</h3>
          <p>This is rendered conditionally based on tier check.</p>
        </Card>
      )}
    </div>
  );
}