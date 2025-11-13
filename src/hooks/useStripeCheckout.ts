import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (
    priceType: 'branding_removal' | 'pro_subscription' | 'elite_subscription' | 'agency_subscription',
    campaignId?: string,
    useEmbedded: boolean = true
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceType, campaignId, useEmbedded }
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
      toast.error(error.message || 'Failed to create checkout session');
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
