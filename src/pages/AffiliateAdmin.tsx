import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlayCircle, Ban, Mail } from "lucide-react";

interface Affiliate {
  id: string;
  code: string;
  user_id: string;
  total_earned: number;
  total_paid: number;
  payout_email: string;
  is_blocked: boolean;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  created_at: string;
  referral_count?: number;
}

export default function AffiliateAdmin() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some((r: any) => r.role === 'admin')) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }

    await loadAffiliates();
  };

  const loadAffiliates = async () => {
    try {
      const { data } = await (supabase as any)
        .from('affiliates')
        .select('*')
        .order('total_earned', { ascending: false });

      if (data) {
        // Get referral counts
        const affiliatesWithCounts = await Promise.all(
          data.map(async (affiliate: Affiliate) => {
            const { count } = await (supabase as any)
              .from('affiliate_referrals')
              .select('*', { count: 'exact', head: true })
              .eq('affiliate_id', affiliate.id);
            
            return {
              ...affiliate,
              referral_count: count || 0
            };
          })
        );

        setAffiliates(affiliatesWithCounts);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      setLoading(false);
    }
  };

  const handleManualPayout = async () => {
    if (!confirm("This will process payouts for all affiliates NOW. Continue?")) {
      return;
    }

    setProcessingPayout(true);
    try {
      const response = await supabase.functions.invoke('process-payouts', {
        body: { manual: true }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`Payouts processed! Total: $${response.data.totalPayout.toFixed(2)}`);
      await loadAffiliates();
    } catch (error: any) {
      console.error('Payout error:', error);
      toast.error(error.message || 'Failed to process payouts');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleToggleBlock = async (affiliateId: string, currentlyBlocked: boolean) => {
    try {
      await (supabase as any)
        .from('affiliates')
        .update({ is_blocked: !currentlyBlocked })
        .eq('id', affiliateId);

      toast.success(currentlyBlocked ? 'Affiliate unblocked' : 'Affiliate blocked');
      await loadAffiliates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update affiliate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading affiliates...</div>
      </div>
    );
  }

  const totalEarnings = affiliates.reduce((sum, a) => sum + (a.total_earned || 0), 0);
  const totalPaid = affiliates.reduce((sum, a) => sum + (a.total_paid || 0), 0);
  const totalPending = totalEarnings - totalPaid;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold">Affiliate Management</h1>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/payouts')}>
                View Payouts
              </Button>
              <Button variant="outline" onClick={() => navigate('/payout-settings')}>
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xl md:text-2xl font-bold">{affiliates.length}</div>
              <div className="text-sm text-muted-foreground">Total Affiliates</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xl md:text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xl md:text-2xl font-bold">${totalPaid.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xl md:text-2xl font-bold">${totalPending.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Payout Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manual Actions</CardTitle>
            <CardDescription>
              Trigger payouts or send test emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button 
                onClick={handleManualPayout}
                disabled={processingPayout}
                className="flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                {processingPayout ? 'Processing...' : 'Run Payouts Now'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/payout-settings')}>
                <Mail className="w-4 h-4 mr-2" />
                Configure Notifications
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Manual payouts will process immediately for all affiliates with connected Stripe accounts
            </p>
          </CardContent>
        </Card>

        {/* Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No affiliates yet
              </div>
            ) : (
              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div
                    key={affiliate.id}
                    className="flex items-center justify-between p-4 border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="font-mono font-semibold">{affiliate.code}</code>
                        {affiliate.is_blocked && (
                          <Badge variant="destructive">Blocked</Badge>
                        )}
                        {affiliate.stripe_onboarding_complete ? (
                          <>
                            {(affiliate as any).stripe_account_status === 'verified' && (
                              <Badge className="bg-foreground text-background">✓ Verified</Badge>
                            )}
                            {(affiliate as any).stripe_account_status === 'pending' && (
                              <Badge className="bg-background text-foreground border border-foreground">⏳ Pending</Badge>
                            )}
                            {(affiliate as any).stripe_account_status === 'restricted' && (
                              <Badge className="bg-background text-foreground border border-foreground">⚠️ Restricted</Badge>
                            )}
                            {(affiliate as any).stripe_account_status === 'rejected' && (
                              <Badge variant="destructive">❌ Rejected</Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary">No Stripe</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {affiliate.payout_email} • {affiliate.referral_count || 0} referrals
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mr-6">
                      <div className="text-right">
                        <div className="font-bold text-lg">${(affiliate.total_earned || 0).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Paid: ${(affiliate.total_paid || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={affiliate.is_blocked ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleBlock(affiliate.id, affiliate.is_blocked)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {affiliate.is_blocked ? 'Unblock' : 'Block'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
