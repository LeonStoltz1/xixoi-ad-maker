import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="container mx-auto max-w-md text-center space-y-8">
        <div className="w-24 h-24 mx-auto border-2 border-foreground rounded-full flex items-center justify-center">
          <X className="w-12 h-12" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            Payment Canceled
          </h1>
          <p className="text-xl text-muted-foreground">
            Your payment was canceled. No charges were made.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/create-campaign')}
          >
            Try Again
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;
