import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_CONFIG } from '@/lib/plan-config';

interface EffectiveTierResult {
  tier: string;
  isRealtor: boolean;
  isPolitical: boolean;
  isOverridden: boolean;
  actualTier: string | null;
  loading: boolean;
}

/**
 * Hook that returns the effective tier considering admin overrides.
 * Admin users can override their tier for testing purposes.
 * Returns the override tier if set, otherwise the actual user tier.
 */
export function useEffectiveTier(): EffectiveTierResult {
  const [result, setResult] = useState<EffectiveTierResult>({
    tier: 'free',
    isRealtor: false,
    isPolitical: false,
    isOverridden: false,
    actualTier: null,
    loading: true
  });

  useEffect(() => {
    const fetchEffectiveTier = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setResult({
            tier: 'free',
            isRealtor: false,
            isPolitical: false,
            isOverridden: false,
            actualTier: null,
            loading: false
          });
          return;
        }

        // Fetch user profile for actual tier
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('stripe_price_id, plan, is_realtor, political_tier')
          .eq('id', user.id)
          .single();

        // Determine actual tier from profile
        let actualTier = 'free';
        if (profile?.stripe_price_id) {
          // Match price ID to tier
          if (profile.stripe_price_id === PLAN_CONFIG.quickstart) {
            actualTier = 'quickstart';
          } else if (profile.stripe_price_id === PLAN_CONFIG.pro || profile.stripe_price_id === PLAN_CONFIG.proUnlimited) {
            actualTier = 'pro';
          } else if (profile.stripe_price_id === PLAN_CONFIG.elite) {
            actualTier = 'elite';
          } else if (profile.stripe_price_id === PLAN_CONFIG.agency) {
            actualTier = 'agency';
          }
        } else if (profile?.plan) {
          actualTier = profile.plan;
        }

        const actualIsRealtor = profile?.is_realtor || false;
        const actualIsPolitical = profile?.political_tier || false;

        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('is_admin', {
          _user_id: user.id
        });

        if (isAdmin) {
          // Fetch admin overrides
          const { data: override } = await (supabase as any)
            .from('admin_overrides')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (override) {
            // Apply overrides
            setResult({
              tier: override.override_tier || actualTier,
              isRealtor: override.override_realtor_mode ?? actualIsRealtor,
              isPolitical: override.override_political_mode ?? actualIsPolitical,
              isOverridden: true,
              actualTier: actualTier,
              loading: false
            });
            return;
          }
        }

        // No overrides, use actual values
        setResult({
          tier: actualTier,
          isRealtor: actualIsRealtor,
          isPolitical: actualIsPolitical,
          isOverridden: false,
          actualTier: actualTier,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching effective tier:', error);
        setResult({
          tier: 'free',
          isRealtor: false,
          isPolitical: false,
          isOverridden: false,
          actualTier: null,
          loading: false
        });
      }
    };

    fetchEffectiveTier();
  }, []);

  return result;
}

/**
 * Helper function to check if effective tier has access to a feature.
 * Tier hierarchy: free < quickstart < pro < elite < agency
 */
export function hasTierAccess(effectiveTier: string, requiredTier: string): boolean {
  const tierLevels: Record<string, number> = {
    free: 0,
    quickstart: 1,
    pro: 2,
    elite: 3,
    agency: 4
  };

  const userLevel = tierLevels[effectiveTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return userLevel >= requiredLevel;
}