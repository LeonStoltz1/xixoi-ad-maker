import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAffiliate } from '../hooks/useAffiliate';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AffiliatesPage = () => {
  const navigate = useNavigate();
  const { affiliate, loading, error, createAffiliate } = useAffiliate();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = useMemo(() => {
    if (!affiliate || !affiliate.code || !origin) return '';
    return `${origin}/?ref=${affiliate.code}`;
  }, [affiliate, origin]);

  useEffect(() => {
    if (!affiliate) return;
    
    const fetchData = async () => {
      const { data: refs } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('referred_at', { ascending: false });
      setReferrals(refs ?? []);

      const { data: payoutsData } = await supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });
      setPayouts(payoutsData ?? []);
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
    setIsRequestingPayout(true);
    setRequestError(null);

    const minPayout = 100;
    const available = Number(affiliate.total_earned ?? 0) - Number(affiliate.total_paid ?? 0);

    if (available < minPayout) {
      setRequestError(`Minimum payout is $${minPayout}. You currently have $${available.toFixed(2)} available.`);
      setIsRequestingPayout(false);
      return;
    }

    const { error } = await supabase.from('affiliate_payouts').insert({
      affiliate_id: affiliate.id,
      amount: available,
      method: affiliate.payout_method ?? 'stripe',
    });

    if (error) {
      setRequestError(error.message);
    } else {
      toast.success('Payout request submitted! We will process it soon.');
      const { data: payoutsData } = await supabase
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
          <h1 className="text-3xl font-bold mb-4">Affiliate Program</h1>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">xiXoi™ Affiliate Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Earn <span className="font-semibold text-foreground">20% lifetime commission</span> for every paying customer you refer.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {!affiliate && (
          <div className="bg-card border border-border rounded-lg p-8 mb-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Join the Affiliate Program</h2>
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
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Your Affiliate Link
              </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">
                  ${Number(affiliate.total_earned ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Paid Out</span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">
                  ${Number(affiliate.total_paid ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  $
                  {(
                    Number(affiliate.total_earned ?? 0) -
                    Number(affiliate.total_paid ?? 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Request Payout */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Request Payout</h2>
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
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Referrals</h2>
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payout History</h2>
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
    </div>
  );
};

export default AffiliatesPage;
