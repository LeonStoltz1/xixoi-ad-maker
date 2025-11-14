import { supabase } from '@/integrations/supabase/client';

export async function linkUserToAffiliate(userId: string, stripeCustomerId?: string) {
  if (!userId) return;

  // Get code from local storage if available
  let code: string | null = null;
  try {
    code = localStorage.getItem('xixoi_affiliate_ref');
  } catch {
    code = null;
  }

  if (!code && typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('xixoi_affiliate_ref='));
    if (match) {
      code = decodeURIComponent(match.split('=')[1]);
    }
  }

  if (!code) return;

  // Find affiliate by code
  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (error || !affiliate) {
    console.error('No affiliate found for code', code, error);
    return;
  }

  // Check if referral already exists
  const { data: existingReferral } = await supabase
    .from('affiliate_referrals')
    .select('id')
    .eq('referred_user_id', userId)
    .maybeSingle();

  if (existingReferral) {
    console.log('Referral already exists for user', userId);
    return;
  }

  // Create referral
  const { error: insertError } = await supabase.from('affiliate_referrals').insert({
    affiliate_id: affiliate.id,
    referred_user_id: userId,
    stripe_customer_id: stripeCustomerId ?? null,
  });

  if (insertError) {
    console.error('Error inserting affiliate referral', insertError);
  } else {
    console.log('Successfully linked user to affiliate', { userId, affiliateId: affiliate.id });
  }
}
