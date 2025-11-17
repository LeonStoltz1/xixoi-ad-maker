import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirect to ad published page after 2 seconds
    const timer = setTimeout(() => {
      navigate('/ad-published');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="container mx-auto max-w-md text-center space-y-8">
        <div className="w-24 h-24 mx-auto border-2 border-foreground flex items-center justify-center">
          <Check className="w-12 h-12" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            Payment Successful
          </h1>
          <p className="text-xl text-muted-foreground">
            Your payment has been processed successfully.
          </p>
          {sessionId && (
            <p className="text-sm text-muted-foreground font-mono">
              Session ID: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>

        <p className="text-base text-muted-foreground">
          Publishing your ad...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
