import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAffiliate } from '../hooks/useAffiliate';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, DollarSign, Users, TrendingUp, Target, Award } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/Footer';
import { Progress } from '@/components/ui/progress';
import { getNextReferralMilestone, getNextEarningsMilestone } from '@/lib/affiliateMilestones';
import { getMilestoneConfig } from '@/lib/milestoneConfig';
import { format } from 'date-fns';

const AffiliatesPage = () => {
  const navigate = useNavigate();
  const { affiliate, loading, error, createAffiliate } = useAffiliate();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stripeSetupStatus, setStripeSetupStatus] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Check for Stripe Connect callback
    const params = new URLSearchParams(window.location.search);
    const setupStatus = params.get('setup');
    if (setupStatus) {
      setStripeSetupStatus(setupStatus);
      if (setupStatus === 'success') {
        toast.success('Bank account connected successfully! You can now receive payouts.');
        // Update affiliate record
        if (affiliate) {
          supabase
            .from('affiliates' as any)
            .update({ stripe_onboarding_complete: true })
            .eq('user_id', user?.id)
            .then(() => {
              // Reload the page to refresh affiliate data
              window.location.href = '/affiliates';
            });
        }
      } else if (setupStatus === 'failed') {
        toast.error('Failed to connect bank account. Please try again.');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, '/affiliates');
    }
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = useMemo(() => {
    if (!affiliate || !affiliate.code || !origin) return '';
    return `${origin}/?ref=${affiliate.code}`;
  }, [affiliate, origin]);

  useEffect(() => {
    if (!affiliate) return;
    
    const fetchData = async () => {
      const { data: refs } = await (supabase as any)
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('referred_at', { ascending: false });
      setReferrals(refs ?? []);

      const { data: payoutsData } = await (supabase as any)
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });
      setPayouts(payoutsData ?? []);

      const { data: milestonesData } = await (supabase as any)
        .from('affiliate_milestones')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('achieved_at', { ascending: false });
      setMilestones(milestonesData ?? []);
    };
    
    fetchData();
  }, [affiliate]);

  const handleCopyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    toast.success('Affiliate link copied to clipboard!');
  };

  const handleRequestPayout = async () => {
    if (!affiliate) return;
    
    // Check if Stripe Connect is set up
    if (!affiliate.stripe_account_id || !affiliate.stripe_onboarding_complete) {
      toast.error("Please connect your bank account via Stripe before requesting payouts");
      setRequestError("Stripe Connect setup required");
      return;
    }

    // Check Stripe account status
    const accountStatus = (affiliate as any).stripe_account_status;
    if (accountStatus === 'rejected') {
      toast.error("Your Stripe account was rejected. Please contact support.");
      setRequestError("Stripe account rejected. Contact info@stoltzone.com");
      return;
    }
    
    if (accountStatus === 'restricted') {
      toast.error("Your Stripe account is restricted. Please complete verification in Stripe.");
      setRequestError("Account restricted. Complete verification in your Stripe dashboard.");
      return;
    }

    if (accountStatus !== 'verified') {
      toast.error("Your Stripe account verification is pending. Please wait for approval.");
      setRequestError("Account verification pending. This may take 1-2 business days.");
      return;
    }

    setIsRequestingPayout(true);
    setRequestError(null);

    const minPayout = 100;
    const available = Number(affiliate.total_earned ?? 0) - Number(affiliate.total_paid ?? 0);

    if (available < minPayout) {
      setRequestError(`Minimum payout is $${minPayout}. You currently have $${available.toFixed(2)} available.`);
      setIsRequestingPayout(false);
      return;
    }

    const { error } = await (supabase as any).from('affiliate_payouts').insert({
      affiliate_id: affiliate.id,
      amount: available,
      method: affiliate.payout_method ?? 'stripe',
    });

    if (error) {
      setRequestError(error.message);
    } else {
      toast.success('Payout request submitted! We will process it soon.');
      const { data: payoutsData } = await (supabase as any)
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });
      setPayouts(payoutsData ?? []);
    }

    setIsRequestingPayout(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Affiliate Program</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access the affiliate dashboard.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !affiliate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading affiliate data…</p>
      </div>
    );
  }

  return (
    <AppLayout title="xiXoi™ Affiliate Dashboard" showBack backTo="/dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-3 mb-4">
            <DollarSign className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="text-xl md:text-2xl font-bold text-primary">20% Lifetime</p>
            </div>
          </div>
          <p className="text-muted-foreground text-base md:text-lg mt-4">
            Earn recurring commission for every paying customer you refer - for as long as they remain subscribed.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive">
            {error}
          </div>
        )}

        {!affiliate && (
          <div className="bg-card border border-border p-8 mb-6 text-center">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Join the Affiliate Program</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Generate your unique affiliate link and start earning 20% commission on every payment
              from customers you refer. It's completely free to join.
            </p>
            <Button onClick={createAffiliate} size="lg">
              Create My Affiliate Account
            </Button>
          </div>
        )}

        {affiliate && (
          <>
            {/* Affiliate Link */}
            <div className="bg-card border border-border p-6 mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Your Affiliate Link
              </h2>
              
              {/* Stripe Connect Warning */}
              {(!affiliate.stripe_account_id || !affiliate.stripe_onboarding_complete) && (
                <div className="mb-4 p-4 bg-background border border-foreground">
                  <p className="text-sm font-medium mb-2">
                    ⚠️ Connect your bank account to receive payouts
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await supabase.functions.invoke('create-stripe-connect-account');
                        if (response.data?.url) {
                          window.location.href = response.data.url;
                        } else if (response.error) {
                          toast.error(response.error.message || 'Failed to create Stripe Connect account');
                        }
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to connect Stripe');
                      }
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Connect Bank Account with Stripe
                  </Button>
                </div>
              )}

              {/* Account Status Warnings */}
              {affiliate.stripe_account_id && (affiliate as any).stripe_account_status === 'pending' && (
                <div className="mb-4 p-4 bg-background border border-foreground">
                  <p className="text-sm font-medium">
                    ⏳ Your Stripe account verification is pending. This may take 1-2 business days.
                  </p>
                </div>
              )}

              {affiliate.stripe_account_id && (affiliate as any).stripe_account_status === 'restricted' && (
                <div className="mb-4 p-4 bg-background border border-foreground">
                  <p className="text-sm font-medium mb-2">
                    ⚠️ Your Stripe account is restricted. Please complete verification.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visit your Stripe dashboard to complete any required verification steps.
                  </p>
                </div>
              )}

              {affiliate.stripe_account_id && (affiliate as any).stripe_account_status === 'rejected' && (
                <div className="mb-4 p-4 bg-background border-2 border-foreground">
                  <p className="text-sm font-medium mb-2">
                    ❌ Your Stripe account was rejected.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please contact info@stoltzone.com for assistance.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <code className="bg-muted p-3 rounded text-sm break-all">
                  {referralLink}
                </code>
                <Button onClick={handleCopyLink} variant="outline" className="self-start">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Share this link on your social profiles, content, or DMs. Anyone who signs up and pays
                using this link is tracked to you automatically.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Commission Rate</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary">20%</div>
                <p className="text-xs text-muted-foreground mt-2">Lifetime recurring</p>
              </div>
              <div className="bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  ${Number(affiliate.total_earned ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Paid Out</span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  ${Number(affiliate.total_paid ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  $
                  {(
                    Number(affiliate.total_earned ?? 0) -
                    Number(affiliate.total_paid ?? 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Milestone Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(() => {
                const referralProgress = getNextReferralMilestone(referrals.length);
                return (
                  <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Referral Milestone Progress
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{referralProgress.label}</span>
                        <span className="font-medium">{Math.round(referralProgress.percentage)}%</span>
                      </div>
                      <Progress value={referralProgress.percentage} className="h-2" />
                      {referralProgress.achieved ? (
                        <p className="text-xs text-primary font-medium mt-2">
                          🎉 {referralProgress.label}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          {referralProgress.next - referralProgress.current} more referral{referralProgress.next - referralProgress.current !== 1 ? 's' : ''} to unlock next milestone
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              {(() => {
                const earningsProgress = getNextEarningsMilestone(Number(affiliate.total_earned ?? 0));
                return (
                  <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Earnings Milestone Progress
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{earningsProgress.label}</span>
                        <span className="font-medium">{Math.round(earningsProgress.percentage)}%</span>
                      </div>
                      <Progress value={earningsProgress.percentage} className="h-2" />
                      {earningsProgress.achieved ? (
                        <p className="text-xs text-primary font-medium mt-2">
                          🎉 {earningsProgress.label}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          ${(earningsProgress.next - earningsProgress.current).toFixed(2)} more to unlock next milestone
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Achievement Badges */}
            {milestones.length > 0 && (
              <div className="bg-card border border-border p-6 mb-6">
                <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Milestones Achieved
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone) => {
                    const config = getMilestoneConfig(milestone.milestone_type);
                    const IconComponent = config.icon;
                    return (
                      <div
                        key={milestone.id}
                        className="bg-gradient-to-br from-primary/10 to-background border-2 border-primary/20 p-4 rounded-lg hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{config.label}</h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              {config.description}
                            </p>
                            <p className="text-xs text-primary font-medium">
                              Achieved {format(new Date(milestone.achieved_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Request Payout */}
            <div className="bg-card border border-border p-6 mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Request Payout</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Minimum payout: <strong>$100</strong>. Payouts are processed via Stripe or PayPal (depending on your method).
              </p>
              {requestError && (
                <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded">
                  {requestError}
                </div>
              )}
              <Button
                onClick={handleRequestPayout}
                disabled={isRequestingPayout}
              >
                {isRequestingPayout ? 'Submitting…' : 'Request Full Payout'}
              </Button>
            </div>

            {/* Referrals */}
            <div className="bg-card border border-border p-6 mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Your Referrals</h2>
              {referrals.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No referrals yet. Share your link to get started.
                </p>
              )}
              {referrals.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium">Referred At</th>
                        <th className="text-left py-3 px-2 font-medium">Total Revenue</th>
                        <th className="text-left py-3 px-2 font-medium">Your Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-2">
                            {new Date(r.referred_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            ${Number(r.total_revenue ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 font-semibold">
                            ${Number(r.affiliate_earnings ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payout History */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Payout History</h2>
              {payouts.length === 0 && (
                <p className="text-sm text-muted-foreground">No payouts yet.</p>
              )}
              {payouts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium">Requested</th>
                        <th className="text-left py-3 px-2 font-medium">Amount</th>
                        <th className="text-left py-3 px-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-2">
                            {new Date(p.requested_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 font-semibold">
                            ${Number(p.amount ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 capitalize">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              p.status === 'paid' ? 'bg-primary/10 text-primary' :
                              p.status === 'approved' ? 'bg-secondary/10 text-secondary-foreground' :
                              p.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </AppLayout>
  );
};

export default AffiliatesPage;
