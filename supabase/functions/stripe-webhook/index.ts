import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const PRICE_ID_QUICKSTART = 'price_1SZmlERfAZMMsSx86Qej';

function getPlanTypeFromPriceId(priceId: string): string {
  const PRICE_ID_PRO = Deno.env.get('STRIPE_PRICE_PRO_SUBSCRIPTION');
  const PRICE_ID_ELITE = Deno.env.get('STRIPE_PRICE_ELITE');
  const PRICE_ID_AGENCY = Deno.env.get('STRIPE_PRICE_AGENCY');
  
  if (priceId === PRICE_ID_QUICKSTART) return 'quickstart';
  if (priceId === PRICE_ID_PRO) return 'pro';
  if (priceId === PRICE_ID_ELITE) return 'elite';
  if (priceId === PRICE_ID_AGENCY) return 'agency';
  return 'pro'; // default fallback
}

// =============================================================================
// PAYMENT ECONOMICS: Record real Stripe fees from balance_transaction
// =============================================================================

interface PaymentEconomicsData {
  user_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  gross_amount_usd: number;
  stripe_fees_usd: number;
  net_revenue_usd: number;
  type: 'subscription' | 'one_time' | 'refund' | 'chargeback' | 'ad_budget';
  meta?: Record<string, any>;
}

async function recordPaymentEconomics(
  supabase: SupabaseClient,
  data: PaymentEconomicsData
): Promise<void> {
  const { error } = await supabase.from('payment_economics').insert({
    user_id: data.user_id,
    stripe_customer_id: data.stripe_customer_id,
    stripe_invoice_id: data.stripe_invoice_id,
    stripe_payment_intent_id: data.stripe_payment_intent_id,
    stripe_charge_id: data.stripe_charge_id,
    gross_amount_usd: data.gross_amount_usd,
    stripe_fees_usd: data.stripe_fees_usd,
    net_revenue_usd: data.net_revenue_usd,
    type: data.type,
    meta: data.meta || {},
  });

  if (error) {
    console.error('[payment_economics] Error recording:', error);
  } else {
    console.log('[payment_economics] Recorded:', {
      type: data.type,
      gross: data.gross_amount_usd,
      fees: data.stripe_fees_usd,
      net: data.net_revenue_usd,
    });
  }
}

async function resolveUserIdFromCustomer(
  supabase: SupabaseClient,
  stripeCustomerId: string | null
): Promise<string | null> {
  if (!stripeCustomerId) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  
  return profile?.id || null;
}

async function getFallbackFeeConfig(supabase: SupabaseClient): Promise<{ percentage: number; fixedCents: number }> {
  const { data: configs } = await supabase
    .from('config_system_costs')
    .select('key, value')
    .in('key', ['stripe_fallback_fee_percentage', 'stripe_fallback_fee_fixed_cents']);

  const configMap: Record<string, number> = configs?.reduce(
    (acc: Record<string, number>, c: { key: string; value: number }) => ({ ...acc, [c.key]: c.value }), 
    {}
  ) || {};
  
  return {
    percentage: configMap['stripe_fallback_fee_percentage'] || 0.029,
    fixedCents: configMap['stripe_fallback_fee_fixed_cents'] || 30,
  };
}

function calculateFallbackFee(amountCents: number, fallbackConfig: { percentage: number; fixedCents: number }): number {
  return (amountCents * fallbackConfig.percentage + fallbackConfig.fixedCents) / 100;
}

// Consolidated balance_transaction fee extraction - single source of truth
async function extractFeesFromBalanceTransaction(
  stripe: Stripe,
  supabase: SupabaseClient,
  balanceTransactionId: string | null | undefined,
  grossAmountCents: number
): Promise<{ stripeFeesUsd: number; netUsd: number; source: string }> {
  const grossUsd = grossAmountCents / 100;
  
  if (balanceTransactionId) {
    try {
      const balanceTx = await stripe.balanceTransactions.retrieve(balanceTransactionId);
      if (typeof balanceTx.fee === 'number') {
        return {
          stripeFeesUsd: balanceTx.fee / 100,
          netUsd: typeof balanceTx.net === 'number' ? balanceTx.net / 100 : grossUsd - (balanceTx.fee / 100),
          source: 'balance_transaction',
        };
      }
    } catch (error) {
      console.error('[extractFeesFromBalanceTransaction] Error:', error);
    }
  }
  
  // Fallback to configured estimates
  const fallbackConfig = await getFallbackFeeConfig(supabase);
  const stripeFeesUsd = calculateFallbackFee(grossAmountCents, fallbackConfig);
  return {
    stripeFeesUsd,
    netUsd: grossUsd - stripeFeesUsd,
    source: 'fallback_estimate',
  };
}

// =============================================================================
// HANDLER: checkout.session.completed
// =============================================================================

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  supabase: SupabaseClient,
  stripe: Stripe
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const campaignId = session.metadata?.campaign_id;
  const priceType = session.metadata?.price_type;

  console.log('[checkout.session.completed] Processing:', { userId, campaignId, priceType, eventId: event.id });

  if (!userId) {
    console.log('[checkout.session.completed] No userId in metadata, skipping');
    return;
  }

  // Update stripe_customer_id if not set
  if (session.customer) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId);
  }

  // Process affiliate referral
  await processAffiliateReferral(session, userId, supabase);

  // Handle branding removal
  if (priceType === 'branding_removal' && campaignId) {
    await handleBrandingRemoval(session, userId, campaignId, supabase);
  }

  // Handle watermark tampering charge
  if (session.metadata?.reason === 'watermark_tampered') {
    await handleWatermarkTamperingCharge(session, supabase);
  }

  // Handle subscription creation
  if (session.subscription) {
    await handleSubscriptionFromCheckout(session, userId, stripe, supabase);
  }

  // Handle combined ad budget checkout
  await handleCombinedAdBudgetCheckout(session, userId, campaignId, supabase);

  // Legacy pro subscription handling
  if (priceType === 'pro_subscription' && session.subscription) {
    await handleLegacyProSubscription(session, userId, stripe, supabase);
  }
}

async function processAffiliateReferral(
  session: Stripe.Checkout.Session,
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  const affiliateRef = session.metadata?.affiliate_ref;
  if (!affiliateRef || !session.customer) return;

  console.log('[affiliate] Processing referral:', { affiliateRef, userId, customerId: session.customer });

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, is_blocked')
    .eq('code', affiliateRef)
    .maybeSingle();

  if (affiliate?.is_blocked) {
    console.log('[affiliate] Affiliate is blocked, skipping referral creation');
    return;
  }

  if (affiliateError) {
    console.error('[affiliate] Error finding affiliate:', affiliateError);
    return;
  }

  if (!affiliate) {
    console.log('[affiliate] No affiliate found for code:', affiliateRef);
    return;
  }

  const { data: existingReferral } = await supabase
    .from('affiliate_referrals')
    .select('id')
    .eq('referred_user_id', userId)
    .maybeSingle();

  if (!existingReferral) {
    const { error: insertError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        stripe_customer_id: session.customer as string,
      });

    if (insertError) {
      console.error('[affiliate] Error creating referral:', insertError);
    } else {
      console.log('[affiliate] Successfully created referral for user:', userId);
    }
  } else {
    await supabase
      .from('affiliate_referrals')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', existingReferral.id)
      .is('stripe_customer_id', null);
    
    console.log('[affiliate] Updated existing referral with stripe_customer_id');
  }
}

async function handleBrandingRemoval(
  session: Stripe.Checkout.Session,
  userId: string,
  campaignId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('campaigns')
    .update({ 
      has_watermark: false,
      stripe_payment_id: session.payment_intent as string
    })
    .eq('id', campaignId);

  await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      campaign_id: campaignId,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: session.amount_total || 2900,
      currency: session.currency || 'usd',
      status: 'succeeded',
      payment_type: 'branding_removal',
    });

  console.log('[branding] Watermark removed for campaign:', campaignId);
}

async function handleWatermarkTamperingCharge(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
): Promise<void> {
  const variantId = session.metadata?.variant_id;
  if (!variantId) return;

  await supabase
    .from('free_ads')
    .update({ charged: true, tampered: true })
    .eq('ad_variant_id', variantId);

  const { data: variant } = await supabase
    .from('ad_variants')
    .select('campaign_id')
    .eq('id', variantId)
    .single();

  if (variant) {
    await supabase
      .from('campaigns')
      .update({ 
        has_watermark: false,
        stripe_payment_id: session.payment_intent as string
      })
      .eq('id', variant.campaign_id);
  }

  console.log('[tampering] Charge processed for variant:', variantId);
}

async function handleSubscriptionFromCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  stripe: Stripe,
  supabase: SupabaseClient
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const actualPriceId = subscription.items.data[0]?.price.id;
  const planType = getPlanTypeFromPriceId(actualPriceId);
  const isQuickStartPrice = actualPriceId?.startsWith('price_1SZm');

  console.log('[subscription] Created with price:', { actualPriceId, planType });

  if (planType === 'quickstart' || isQuickStartPrice) {
    await createSubscriptionRecord(subscription, userId, session.customer as string, 'quickstart', supabase);
    await supabase
      .from('profiles')
      .update({ plan: 'quickstart', stripe_price_id: actualPriceId })
      .eq('id', userId);
    console.log('[subscription] ✅ Updated user plan to: quickstart');
  } else if (planType !== 'pro') {
    await createSubscriptionRecord(subscription, userId, session.customer as string, planType, supabase);
    await supabase
      .from('profiles')
      .update({ plan: planType, stripe_price_id: actualPriceId })
      .eq('id', userId);
    console.log(`[subscription] ✅ Updated user plan to: ${planType}`);
  }
}

async function createSubscriptionRecord(
  subscription: Stripe.Subscription,
  userId: string,
  customerId: string,
  planType: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleCombinedAdBudgetCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  campaignId: string | undefined,
  supabase: SupabaseClient
): Promise<void> {
  const adBudgetAmount = session.metadata?.ad_budget_amount;
  
  if (!adBudgetAmount || parseFloat(adBudgetAmount) <= 0 || !campaignId) return;

  const budgetAmount = parseFloat(adBudgetAmount);
  const dailyBudget = budgetAmount / 7;
  
  console.log('[combined-checkout] Processing ad budget:', { budgetAmount, dailyBudget, campaignId });

  // Update or create ad wallet
  const { data: existingWallet } = await supabase
    .from('ad_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingWallet) {
    await supabase
      .from('ad_wallets')
      .update({
        balance: existingWallet.balance + budgetAmount,
        total_deposited: existingWallet.total_deposited + budgetAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('ad_wallets')
      .insert({
        user_id: userId,
        balance: budgetAmount,
        total_deposited: budgetAmount,
        total_spent: 0
      });
  }

  // Update campaign
  await supabase
    .from('campaigns')
    .update({
      daily_budget: dailyBudget,
      lifetime_budget: budgetAmount,
      status: 'pending_publish',
      stripe_payment_id: session.payment_intent as string || session.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  // Queue for publishing with jitter
  const jitterMs = Math.floor(Math.random() * 20000) + 10000;
  
  await supabase
    .from('quick_start_publish_queue')
    .insert({
      user_id: userId,
      campaign_id: campaignId,
      platform: 'meta',
      status: 'queued',
      next_attempt_at: new Date(Date.now() + jitterMs).toISOString(),
    });

  console.log('[combined-checkout] ✅ Campaign queued for publishing:', campaignId);
}

async function handleLegacyProSubscription(
  session: Stripe.Checkout.Session,
  userId: string,
  stripe: Stripe,
  supabase: SupabaseClient
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0]?.price.id;
  const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

  console.log('[legacy-pro] Creating subscription:', { planType, priceId });

  await createSubscriptionRecord(subscription, userId, session.customer as string, planType, supabase);
  
  await supabase
    .from('profiles')
    .update({ plan: planType })
    .eq('id', userId);

  console.log('[legacy-pro] Updated user plan to:', planType);
}

// =============================================================================
// HANDLER: customer.subscription.created / updated
// =============================================================================

async function handleSubscriptionCreateOrUpdate(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log(`[${event.type}] Processing:`, { subscriptionId: subscription.id, eventId: event.id });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .maybeSingle();

  if (!profile) {
    console.log(`[${event.type}] No profile found for customer:`, subscription.customer);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

  console.log(`[${event.type}] Upserting subscription:`, { planType, status: subscription.status });

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, { onConflict: 'stripe_subscription_id' });

  // Update profile plan based on status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabase
      .from('profiles')
      .update({ plan: planType })
      .eq('id', profile.id);
    console.log(`[${event.type}] Updated profile plan to:`, planType);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', profile.id);
    console.log(`[${event.type}] Downgraded profile to free plan`);
  }
}

// =============================================================================
// HANDLER: customer.subscription.deleted
// =============================================================================

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log('[customer.subscription.deleted] Processing:', { subscriptionId: subscription.id, eventId: event.id });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single();

  if (!profile) {
    console.log('[customer.subscription.deleted] No profile found for customer');
    return;
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: true })
    .eq('stripe_subscription_id', subscription.id);

  await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', profile.id);

  console.log('[customer.subscription.deleted] Downgraded user to free plan');
}

// =============================================================================
// HANDLER: invoice.payment_succeeded - WITH REAL STRIPE FEES
// =============================================================================

async function handleInvoicePaymentSucceeded(
  event: Stripe.Event,
  supabase: SupabaseClient,
  stripe: Stripe
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log('[invoice.payment_succeeded] Processing:', { invoiceId: invoice.id, eventId: event.id });

  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const priceId = subscription.items.data[0]?.price.id;
  const planType = priceId ? getPlanTypeFromPriceId(priceId) : 'pro';

  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('stripe_subscription_id', invoice.subscription as string);

  const { data: subscriptionRecord } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .maybeSingle();

  if (subscriptionRecord) {
    await supabase
      .from('profiles')
      .update({ plan: planType })
      .eq('id', subscriptionRecord.user_id);
    
    console.log('[invoice.payment_succeeded] Updated user plan:', planType);

    // Process affiliate commission
    await processAffiliateCommission(invoice, supabase);
  }

  // =========================================================================
  // PHASE 10C: Record REAL Stripe fees from balance_transaction
  // =========================================================================
  const paymentIntentId = invoice.payment_intent as string;
  
  if (paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge.balance_transaction'],
      });

      const charge = paymentIntent.latest_charge as Stripe.Charge;
      const balanceTx = charge?.balance_transaction;
      const balanceTxId = typeof balanceTx === 'string' ? balanceTx : balanceTx?.id;

      const fees = await extractFeesFromBalanceTransaction(stripe, supabase, balanceTxId, invoice.amount_paid || 0);
      const userId = await resolveUserIdFromCustomer(supabase, invoice.customer as string);

      await recordPaymentEconomics(supabase, {
        user_id: userId,
        stripe_customer_id: invoice.customer as string,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: paymentIntentId,
        gross_amount_usd: (invoice.amount_paid || 0) / 100,
        stripe_fees_usd: fees.stripeFeesUsd,
        net_revenue_usd: fees.netUsd,
        type: 'subscription',
        meta: { source: fees.source },
      });

      console.log('[invoice.payment_succeeded] Recorded fees:', fees);
    } catch (feeError) {
      console.error('[invoice.payment_succeeded] Error fetching balance_transaction:', feeError);
    }
  }
}

async function processAffiliateCommission(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient
): Promise<void> {
  if (!invoice.customer || !invoice.amount_paid) return;

  const stripeCustomerId = String(invoice.customer);
  const amount = invoice.amount_paid / 100;

  const { data: referral, error: refError } = await supabase
    .from('affiliate_referrals')
    .select(`*, affiliates!inner(id, is_blocked, stripe_account_id)`)
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (!referral || refError) return;

  const affiliate = Array.isArray(referral.affiliates) 
    ? referral.affiliates[0] 
    : referral.affiliates;

  if (affiliate?.is_blocked) {
    console.log('[affiliate-commission] Affiliate blocked, skipping');
    return;
  }

  const commissionRate = 0.2;
  const commission = amount * commissionRate;

  await supabase
    .from('affiliate_referrals')
    .update({
      total_revenue: (referral.total_revenue ?? 0) + amount,
      affiliate_earnings: (referral.affiliate_earnings ?? 0) + commission,
      first_payment_at: referral.first_payment_at ?? new Date().toISOString(),
    })
    .eq('id', referral.id);

  const { data: currentAffiliate } = await supabase
    .from('affiliates')
    .select('total_earned')
    .eq('id', referral.affiliate_id)
    .single();

  if (currentAffiliate) {
    await supabase
      .from('affiliates')
      .update({ total_earned: (currentAffiliate.total_earned ?? 0) + commission })
      .eq('id', referral.affiliate_id);
    
    console.log('[affiliate-commission] Updated earnings:', { 
      affiliateId: referral.affiliate_id, 
      commission,
      newTotal: (currentAffiliate.total_earned ?? 0) + commission 
    });
  }
}

// =============================================================================
// HANDLER: invoice.payment_failed
// =============================================================================

async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log('[invoice.payment_failed] Processing:', { invoiceId: invoice.id, eventId: event.id });

  if (invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription as string);
  }
}

// =============================================================================
// HANDLER: payment_intent.succeeded - WITH REAL STRIPE FEES
// =============================================================================

async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
  supabase: SupabaseClient,
  stripe: Stripe
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log('[payment_intent.succeeded] Processing:', { paymentIntentId: paymentIntent.id, eventId: event.id });

  // Update or create payment transaction
  await supabase
    .from('payment_transactions')
    .upsert({
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      payment_type: 'branding_removal',
    }, { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: false });

  // Handle ad budget payment - CRITICAL BUSINESS REQUIREMENT
  const metadata = paymentIntent.metadata;
  
  if (metadata.payment_type === 'ad_budget' && metadata.campaign_id && metadata.user_id) {
    const campaignId = metadata.campaign_id;
    const userId = metadata.user_id;
    const platforms = metadata.platforms?.split(',') || ['meta'];

    console.log('[payment_intent.succeeded] ✅ Ad budget payment confirmed, queueing campaign:', { 
      campaignId, userId, platforms 
    });

    await supabase
      .from('campaigns')
      .update({ stripe_payment_id: paymentIntent.id, status: 'paid' })
      .eq('id', campaignId);

    // Queue for publishing ONLY after payment succeeds
    for (const platform of platforms) {
      await supabase
        .from('quick_start_publish_queue')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          platform: platform.trim(),
          status: 'queued',
          next_attempt_at: new Date().toISOString(),
        });
      
      console.log(`[payment_intent.succeeded] ✅ Queued campaign ${campaignId} for platform: ${platform}`);
    }

    if (metadata.reload_id) {
      await supabase
        .from('ad_budget_reloads')
        .update({ payment_status: 'completed' })
        .eq('id', metadata.reload_id);
    }

    console.log('[payment_intent.succeeded] ✅ Campaign queued for publishing');

    // =========================================================================
    // PHASE 10C: Record REAL Stripe fees for ad_budget payments
    // =========================================================================
    try {
      const expandedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
        expand: ['latest_charge.balance_transaction'],
      });

      const charge = expandedIntent.latest_charge as Stripe.Charge;
      const balanceTx = charge?.balance_transaction;
      const balanceTxId = typeof balanceTx === 'string' ? balanceTx : (balanceTx as Stripe.BalanceTransaction)?.id;

      const fees = await extractFeesFromBalanceTransaction(stripe, supabase, balanceTxId, paymentIntent.amount);

      await recordPaymentEconomics(supabase, {
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: charge?.id,
        gross_amount_usd: paymentIntent.amount / 100,
        stripe_fees_usd: fees.stripeFeesUsd,
        net_revenue_usd: fees.netUsd,
        type: 'ad_budget',
        meta: { campaign_id: campaignId, source: fees.source },
      });

      console.log('[payment_intent.succeeded] Recorded ad_budget fees:', fees);
    } catch (feeError) {
      console.error('[payment_intent.succeeded] Error fetching balance_transaction:', feeError);
    }
  }
}

// =============================================================================
// HANDLER: payment_intent.payment_failed
// =============================================================================

async function handlePaymentIntentFailed(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log('[payment_intent.payment_failed] Processing:', { paymentIntentId: paymentIntent.id, eventId: event.id });

  await supabase
    .from('payment_transactions')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  const { data: reload } = await supabase
    .from('ad_budget_reloads')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (reload) {
    console.log('[payment_intent.payment_failed] Ad budget reload failed, pausing campaigns for user:', reload.user_id);
    
    try {
      await supabase.functions.invoke('handle-payment-failure', {
        body: {
          userId: reload.user_id,
          reloadId: reload.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      });
    } catch (error) {
      console.error('[payment_intent.payment_failed] Failed to handle payment failure:', error);
    }
  }
}

// =============================================================================
// HANDLER: charge.refunded - RECORD REAL REFUND FEES
// =============================================================================

async function handleChargeRefunded(
  event: Stripe.Event,
  supabase: SupabaseClient,
  stripe: Stripe
): Promise<void> {
  const charge = event.data.object as Stripe.Charge;
  
  console.log('[charge.refunded] Processing:', { chargeId: charge.id, eventId: event.id });

  // Negative gross because money is leaving
  const refundAmountCents = charge.amount_refunded || charge.amount || 0;
  const grossUsd = -(refundAmountCents / 100);

  // Get fees from balance_transaction using consolidated helper
  const balanceTxId = typeof charge.balance_transaction === 'string' ? charge.balance_transaction : null;
  const fees = await extractFeesFromBalanceTransaction(stripe, supabase, balanceTxId, refundAmountCents);

  const userId = await resolveUserIdFromCustomer(supabase, charge.customer as string);

  await recordPaymentEconomics(supabase, {
    user_id: userId,
    stripe_customer_id: charge.customer as string,
    stripe_invoice_id: charge.invoice as string,
    stripe_payment_intent_id: charge.payment_intent as string,
    stripe_charge_id: charge.id,
    gross_amount_usd: grossUsd,
    stripe_fees_usd: fees.stripeFeesUsd,
    net_revenue_usd: fees.netUsd > 0 ? -fees.netUsd : grossUsd, // Ensure negative for refunds
    type: 'refund',
    meta: { source: fees.source },
  });

  console.log('[charge.refunded] Recorded refund economics:', { grossUsd, fees });
}

// =============================================================================
// HANDLER: charge.dispute.created - RECORD CHARGEBACK FEES
// =============================================================================

async function handleChargeDisputeCreated(
  event: Stripe.Event,
  supabase: SupabaseClient,
  stripe: Stripe
): Promise<void> {
  const dispute = event.data.object as Stripe.Dispute;
  
  console.log('[charge.dispute.created] Processing:', { disputeId: dispute.id, eventId: event.id });

  // Default Stripe dispute fee is $15
  let disputeFee = 15.00;

  // Try to get actual fee from balance_transactions if available
  if (dispute.balance_transactions && dispute.balance_transactions.length > 0) {
    try {
      const balanceTxId = dispute.balance_transactions[0] as string;
      const balanceTx = await stripe.balanceTransactions.retrieve(balanceTxId);
      disputeFee = typeof balanceTx.fee === 'number' ? balanceTx.fee / 100 : 15.00;
      console.log('[charge.dispute.created] Using real dispute fee:', disputeFee);
    } catch (error) {
      console.error('[charge.dispute.created] Error fetching dispute balance_transaction:', error);
      // Fall back to config value
      const { data: feeConfig } = await supabase
        .from('config_system_costs')
        .select('value')
        .eq('key', 'stripe_dispute_fee_usd')
        .single();
      disputeFee = feeConfig?.value || 15.00;
    }
  }

  // Resolve user_id from the disputed charge
  let userId: string | null = null;
  if (dispute.charge) {
    try {
      const charge = await stripe.charges.retrieve(dispute.charge as string);
      userId = await resolveUserIdFromCustomer(supabase, charge.customer as string);
    } catch (error) {
      console.error('[charge.dispute.created] Error fetching charge:', error);
    }
  }

  await recordPaymentEconomics(supabase, {
    user_id: userId,
    stripe_charge_id: dispute.charge as string,
    gross_amount_usd: 0,
    stripe_fees_usd: disputeFee,
    net_revenue_usd: -disputeFee,
    type: 'chargeback',
    meta: { 
      dispute_id: dispute.id, 
      status: dispute.status,
      reason: dispute.reason,
    },
  });

  console.log('[charge.dispute.created] Recorded chargeback economics:', { disputeFee });
}

// =============================================================================
// HANDLER: customer.created / updated
// =============================================================================

async function handleCustomerCreateOrUpdate(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  const userId = customer.metadata?.supabase_user_id;
  
  console.log(`[${event.type}] Processing:`, { customerId: customer.id, userId, eventId: event.id });

  if (!userId) return;

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  await supabase
    .from('stripe_customers')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      email: customer.email || '',
    }, { onConflict: 'stripe_customer_id' });

  await supabase
    .from('affiliate_referrals')
    .update({ stripe_customer_id: customer.id })
    .eq('referred_user_id', userId)
    .is('stripe_customer_id', null);
}

// =============================================================================
// HANDLER: account.updated (Stripe Connect)
// =============================================================================

async function handleAccountUpdated(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  const account = event.data.object as Stripe.Account;
  
  console.log('[account.updated] Processing:', { accountId: account.id, eventId: event.id });

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, user_id')
    .eq('stripe_account_id', account.id)
    .maybeSingle();

  if (!affiliate) {
    console.log('[account.updated] No affiliate found for account:', account.id);
    return;
  }

  let accountStatus = 'pending';
  
  if (account.charges_enabled && account.payouts_enabled) {
    accountStatus = 'verified';
  } else if (account.requirements?.disabled_reason) {
    accountStatus = account.requirements.disabled_reason === 'rejected.fraud' 
      ? 'rejected' 
      : 'restricted';
  } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
    accountStatus = 'pending';
  }

  await supabase
    .from('affiliates')
    .update({
      stripe_account_status: accountStatus,
      stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
    })
    .eq('id', affiliate.id);

  console.log('[account.updated] Updated affiliate status:', { 
    affiliateId: affiliate.id, 
    accountStatus,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled 
  });
}

// =============================================================================
// MAIN HANDLER - Event Router
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey || !webhookSecret) {
      throw new Error('Stripe keys not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[stripe-webhook] Event received: ${event.type} (${event.id})`);

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Route to appropriate handler
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event, supabase, stripe);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionCreateOrUpdate(event, supabase);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event, supabase);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event, supabase, stripe);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event, supabase);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event, supabase, stripe);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event, supabase);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event, supabase, stripe);
          break;

        case 'charge.dispute.created':
          await handleChargeDisputeCreated(event, supabase, stripe);
          break;

        case 'customer.created':
        case 'customer.updated':
          await handleCustomerCreateOrUpdate(event, supabase);
          break;

        case 'account.updated':
          await handleAccountUpdated(event, supabase);
          break;

        default:
          console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
      }
    } catch (handlerError) {
      console.error(`[stripe-webhook] Handler error for ${event.type} (${event.id}):`, handlerError);
      // Don't throw - return 200 to Stripe to prevent retries for handler errors
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[stripe-webhook] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
