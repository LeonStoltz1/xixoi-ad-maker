import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { generateSpendPlan } from '@/lib/spendEngine';
import type { User } from '@supabase/supabase-js';

export default function AddAdBudget() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [clientSecret, setClientSecret] = useState('');
  const [reloadId, setReloadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to add ad budget');
        navigate('/auth');
        return;
      }
      setUser(session.user);
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

  const platforms = [
    { id: 'meta', name: 'Meta (Facebook/Instagram)' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'google', name: 'Google' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'x', name: 'X (Twitter)' },
  ];

  const spendPlan = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0 || selectedPlatforms.length === 0) {
      return null;
    }
    return generateSpendPlan({
      userAdSpend: parseFloat(amount),
      platforms: selectedPlatforms as any[],
      aiMode: true,
    });
  }, [amount, selectedPlatforms]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleContinue = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-ad-budget-payment', {
        body: { amount: parseFloat(amount), platforms: selectedPlatforms },
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
      setReloadId(data.reloadId);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to create payment');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success('Payment successful! Your ad budget is being processed.');
    navigate('/dashboard');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setClientSecret('');
              setReloadId('');
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <EmbeddedCheckout
            clientSecret={clientSecret}
            amount={`$${spendPlan?.initialStripeCharge.toFixed(2) || '0.00'}`}
            description={`Ad Budget: $${amount} + $${spendPlan?.serviceFeePerFunding.toFixed(2) || '5.00'} service fee`}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl">Add Ad Budget</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Reload your ad spend in 60 seconds — simple, fast, and transparent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <label className="text-sm md:text-base font-semibold">Where will your ads run?</label>
              <div className="space-y-2">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center space-x-3 border border-foreground/20 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <label
                      htmlFor={platform.id}
                      className="text-sm md:text-base cursor-pointer flex-1"
                    >
                      {platform.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label htmlFor="amount" className="text-sm md:text-base font-semibold">
                How much do you want to spend on ads?
              </label>
              <p className="text-xs md:text-sm text-muted-foreground">
                Enter the amount you want to go <strong>directly into your ad accounts</strong>. We add a <strong>flat $5 per funding</strong> service fee (separate from Elite tier's 5% ad spend billing).
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg md:text-xl">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="200"
                  className="pl-8 text-lg md:text-xl h-12"
                />
              </div>
            </div>

            {/* AI Spend Plan */}
            {spendPlan && (
              <div className="space-y-4">
                {/* Charge Breakdown */}
                <div className="border border-foreground/20 p-4 md:p-6 rounded-lg space-y-3">
                  <h3 className="text-sm md:text-base font-semibold mb-3">You'll be charged ${spendPlan.initialStripeCharge.toFixed(2)} now</h3>
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Ad Budget:</span>
                    <span className="font-semibold">${spendPlan.totalAdSpend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span>xiXoi Service Fee:</span>
                    <span className="font-semibold">${spendPlan.serviceFeePerFunding.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-foreground/20 pt-3">
                    <div className="flex justify-between text-base md:text-lg font-bold">
                      <span>Total Charge:</span>
                      <span>${spendPlan.initialStripeCharge.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-4">
                    The $5 per-funding fee covers instant funding, fraud checks, and platform delivery.
                    100% of your ${spendPlan.totalAdSpend.toFixed(2)} goes to your ads.
                    <br />
                    <em>(This is separate from Scale Elite's 5% ad spend billing. Each future top-up also includes this flat $5 fee.)</em>
                  </p>
                </div>

                {/* AI Summary Card */}
                <div className="border border-primary/30 bg-primary/5 p-4 md:p-6 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-sm md:text-base font-semibold">AI Spend Plan</h3>
                  </div>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-semibold">${spendPlan.totalAdSpend.toFixed(2)} total (${spendPlan.dailyBudget.toFixed(2)}/day for {spendPlan.durationDays} days)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms:</span>
                      <span className="font-semibold">{spendPlan.perPlatform.map(p => p.platform).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Split:</span>
                      <span className="font-semibold">Even across platforms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Charge today:</span>
                      <span className="font-semibold">${spendPlan.initialStripeCharge.toFixed(2)} (${spendPlan.totalAdSpend.toFixed(2)} ads + ${spendPlan.serviceFeePerFunding.toFixed(2)} xiXoi)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full text-sm md:text-base lg:text-lg py-6"
              onClick={handleContinue}
              disabled={loading || !amount || parseFloat(amount) <= 0 || selectedPlatforms.length === 0}
            >
              {loading ? 'Processing...' : spendPlan ? `Continue to Payment – Charge $${spendPlan.initialStripeCharge.toFixed(2)}` : 'Continue to Payment'}
            </Button>

            <p className="text-xs md:text-sm text-center text-muted-foreground">
              Secure checkout powered by Stripe. Ads go live in under 5 minutes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}