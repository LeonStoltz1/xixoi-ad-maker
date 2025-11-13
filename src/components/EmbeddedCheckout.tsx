import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CheckoutFormProps {
  onSuccess: () => void;
  amount: string;
  description: string;
}

function CheckoutForm({ onSuccess, amount, description }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ${amount}`}
      </Button>
    </form>
  );
}

interface EmbeddedCheckoutProps {
  clientSecret: string;
  amount: string;
  description: string;
  onSuccess: () => void;
}

export function EmbeddedCheckout({ clientSecret, amount, description, onSuccess }: EmbeddedCheckoutProps) {
  const options = {
    clientSecret,
  };

  return (
    <Card className="max-w-md mx-auto border-primary/20">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm onSuccess={onSuccess} amount={amount} description={description} />
        </Elements>
      </CardContent>
    </Card>
  );
}
