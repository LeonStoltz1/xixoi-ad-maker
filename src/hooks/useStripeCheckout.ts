import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (
    priceType: 'branding_removal' | 'quickstart_subscription' | 'pro_subscription' | 'elite_subscription' | 'agency_subscription',
    campaignId?: string,
    useEmbedded: boolean = true,
    affiliateRefOverride?: string,
    adBudgetAmount?: number,
    isRecurringBudget?: boolean
  ) => {
    try {
      setLoading(true);

      // Get affiliate ref code from localStorage or cookie (unless override provided)
      let affiliateRef: string | null = affiliateRefOverride || null;
      if (!affiliateRef) {
        try {
          affiliateRef = localStorage.getItem('xixoi_affiliate_ref');
        } catch {
          // Fallback to cookie if localStorage fails
          if (typeof document !== 'undefined') {
            const match = document.cookie
              .split('; ')
              .find((row) => row.startsWith('xixoi_affiliate_ref='));
            if (match) {
              affiliateRef = decodeURIComponent(match.split('=')[1]);
            }
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceType, campaignId, useEmbedded, affiliateRef, adBudgetAmount, isRecurringBudget }
      });

      if (error) throw error;

      if (useEmbedded && data.clientSecret) {
        // Return client secret for embedded checkout
        return { clientSecret: data.clientSecret };
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout data returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Handle rate limit and credits exhausted errors
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error('Payment service temporarily unavailable. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
        toast.error('Service credits exhausted. Please contact support at info@stoltzone.com');
      } else {
        toast.error(error.message || 'Failed to create checkout session');
      }
      
      setLoading(false);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { returnUrl: window.location.origin + '/dashboard' }
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Failed to open customer portal');
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    openCustomerPortal,
    loading
  };
};
