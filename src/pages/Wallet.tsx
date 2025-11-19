import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wallet as WalletIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { QuickStartCapModal } from '@/components/QuickStartCapModal';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

export default function WalletPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCapModal, setShowCapModal] = useState(false);
  const [capDetails, setCapDetails] = useState({ currentSpend: 0, requestedAmount: 0 });
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleReload = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to reload.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('wallet-reload', {
        body: { amount: parseFloat(amount) }
      });

      if (error) {
        // Check for weekly cap error
        if (error.message?.includes('WEEKLY_CAP_EXCEEDED') || data?.error === 'WEEKLY_CAP_EXCEEDED') {
          setCapDetails({
            currentSpend: data?.current_spend || 0,
            requestedAmount: parseFloat(amount)
          });
          setShowCapModal(true);
          return;
        }
        
        throw error;
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error('No payment intent created');
      }
    } catch (err: any) {
      toast({
        title: "Reload Failed",
        description: err.message || "Failed to create payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-40">
      <Header />
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
              <WalletIcon className="w-6 h-6" />
              Ad Wallet
            </CardTitle>
            <CardDescription>
              Add funds to your ad wallet to run campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clientSecret ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Reload Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="5"
                    step="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleReload} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm reloadId={clientSecret} />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickStartCapModal
        isOpen={showCapModal}
        onClose={() => setShowCapModal(false)}
        currentSpend={capDetails.currentSpend}
        requestedAmount={capDetails.requestedAmount}
      />
    </div>
  );
}

function PaymentForm({ reloadId }: { reloadId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment.",
        variant: "destructive"
      });
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || processing} className="w-full">
        {processing ? 'Processing...' : 'Complete Payment'}
      </Button>
    </form>
  );
}
