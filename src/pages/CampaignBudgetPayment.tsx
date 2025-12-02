import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, AlertCircle, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CampaignBudgetPayment() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [clientSecret, setClientSecret] = useState('');
  const [reloadId, setReloadId] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['meta']);

  // Check authentication and load campaign
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        navigate('/auth');
        return;
      }
      setUser(session.user);
      
      // Get user plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
      setUserPlan(profile?.plan || 'free');
      
      setCheckingAuth(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load campaign
  useEffect(() => {
    if (!campaignId || !user) return;
    
    const loadCampaign = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            campaign_channels (
              channel
            )
          `)
          .eq('id', campaignId)
          .single();

        if (error) throw error;
        
        setCampaign(data);
        
        // Get selected platforms from campaign_channels
        const platforms = data.campaign_channels?.map((ch: any) => ch.channel) || ['meta'];
        setSelectedPlatforms(platforms);
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast.error('Failed to load campaign');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, user, navigate]);

  // Calculate total ad budget (daily budget * 7 days for weekly)
  const budgetPeriod = 7; // Weekly
  const totalAdBudget = useMemo(() => {
    if (!campaign?.daily_budget) return 0;
    return campaign.daily_budget * budgetPeriod;
  }, [campaign]);

  // Calculate service fee (5% for Quick-Start, $5 flat for others)
  const serviceFee = useMemo(() => {
    if (!totalAdBudget) return 0;
    return userPlan === 'quickstart' ? totalAdBudget * 0.05 : 5.00;
  }, [totalAdBudget, userPlan]);

  const totalCharge = useMemo(() => {
    return totalAdBudget + serviceFee;
  }, [totalAdBudget, serviceFee]);

  const handleContinueToPayment = async () => {
    if (!totalAdBudget || totalAdBudget <= 0) {
      toast.error('Invalid ad budget');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('No platforms selected');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-ad-budget-payment', {
        body: { 
          amount: totalAdBudget, 
          platforms: selectedPlatforms,
          campaignId // Pass campaign ID for webhook
        },
      });

      if (error) throw error;

      // Check for weekly cap error
      if (data?.error === 'WEEKLY_CAP_EXCEEDED') {
        toast.error(data.message || 'Quick-Start weekly $300 limit reached. Upgrade to Pro for unlimited spend.');
        setLoading(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setReloadId(data.reloadId);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to create payment');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success('Payment successful! Your ad is being published.');
    navigate('/dashboard');
  };

  if (checkingAuth || loading) {
    return (
      <AppLayout title="Processing..." showBack={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading campaign details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (clientSecret) {
    return (
      <AppLayout title="Complete Payment" showBack={false}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 p-4 bg-muted">
            <Button
              variant="outline"
              onClick={() => {
                setClientSecret('');
                setReloadId('');
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel Payment
            </Button>
            <p className="text-sm text-muted-foreground">
              You can go back and adjust anytime
            </p>
          </div>
          <EmbeddedCheckout
            clientSecret={clientSecret}
            amount={`$${totalCharge.toFixed(2)}`}
            description={`Ad Budget: $${totalAdBudget.toFixed(2)} + $${serviceFee.toFixed(2)} service fee`}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Pre-Charge Ad Budget" 
      subtitle="Payment required before publishing"
      showBack 
      backTo={`/targeting/${campaignId}`}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Critical Notice */}
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Payment Required:</strong> You must pre-pay for your ad budget before we can publish your campaign. This ensures your ads go live immediately.
          </AlertDescription>
        </Alert>

        {/* Campaign Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Campaign Budget Breakdown
            </CardTitle>
            <CardDescription>
              {campaign?.name || 'Your Campaign'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget Period */}
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">Budget Period</p>
                <p className="text-sm text-muted-foreground">Weekly campaign duration</p>
              </div>
              <p className="text-lg font-bold">{budgetPeriod} days</p>
            </div>

            {/* Daily Budget */}
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">Daily Budget</p>
                <p className="text-sm text-muted-foreground">Your selected spend per day</p>
              </div>
              <p className="text-lg font-bold">${campaign?.daily_budget || 0}/day</p>
            </div>

            {/* Total Ad Budget */}
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">Total Ad Budget</p>
                <p className="text-sm text-muted-foreground">${campaign?.daily_budget || 0}/day × {budgetPeriod} days</p>
              </div>
              <p className="text-lg font-bold">${totalAdBudget.toFixed(2)}</p>
            </div>

            {/* Service Fee */}
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">xiXoi Service Fee</p>
                <p className="text-sm text-muted-foreground">
                  {userPlan === 'quickstart' ? '5% of ad budget' : 'Flat $5 per funding'}
                </p>
              </div>
              <p className="text-lg font-bold">${serviceFee.toFixed(2)}</p>
            </div>

            {/* Total Charge */}
            <div className="flex justify-between items-center py-4 bg-primary/10 -mx-6 px-6 mt-4">
              <div>
                <p className="text-xl font-bold">Total Charge Today</p>
                <p className="text-sm text-muted-foreground">Ad Budget + Service Fee</p>
              </div>
              <p className="text-2xl font-bold text-primary">${totalCharge.toFixed(2)}</p>
            </div>

            {/* Platform Info */}
            <div className="pt-4">
              <p className="text-sm font-semibold mb-2">Publishing to:</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((platform) => (
                  <span key={platform} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded border">
                    {platform.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guarantee */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">100% of your ${totalAdBudget.toFixed(2)} goes to your ads</p>
                <p className="text-muted-foreground">
                  The service fee covers instant funding, fraud checks, and platform delivery. Your ad budget goes directly into running your campaign.
                </p>
                <p className="text-muted-foreground">
                  After payment, your ad will be queued for publishing and go live within minutes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full text-lg py-6"
          onClick={handleContinueToPayment}
          disabled={loading || !totalAdBudget || totalAdBudget <= 0}
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Pay ${totalCharge.toFixed(2)} & Publish Campaign
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
