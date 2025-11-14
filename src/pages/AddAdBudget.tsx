import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function AddAdBudget() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [clientSecret, setClientSecret] = useState('');
  const [reloadId, setReloadId] = useState('');
  const [loading, setLoading] = useState(false);

  const platforms = [
    { id: 'meta', name: 'Meta (Facebook/Instagram)' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'google', name: 'Google' },
  ];

  const serviceFee = 5.00;
  const totalAmount = amount ? (parseFloat(amount) + serviceFee).toFixed(2) : '0.00';

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
            amount={`$${totalAmount}`}
            description={`Ad Budget: $${amount} + $${serviceFee.toFixed(2)} service fee`}
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
              Reload your ad spend in 60 seconds — no code, no logins, no confusion.
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
                How much do you want to spend?
              </label>
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

            {/* Breakdown */}
            {amount && parseFloat(amount) > 0 && (
              <div className="border border-foreground/20 p-4 md:p-6 rounded-lg space-y-3">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Ad Budget:</span>
                  <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span>Service Fee:</span>
                  <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-foreground/20 pt-3">
                  <div className="flex justify-between text-base md:text-lg font-bold">
                    <span>Total:</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-4">
                  The $5 service fee covers instant funding, fraud checks, and platform delivery.
                  100% of your ${amount} goes to your ads.
                </p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full text-sm md:text-base lg:text-lg py-6"
              onClick={handleContinue}
              disabled={loading || !amount || parseFloat(amount) <= 0 || selectedPlatforms.length === 0}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
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