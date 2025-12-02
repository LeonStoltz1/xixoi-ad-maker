import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'publishing' | 'complete'>('checking');

  useEffect(() => {
    const checkPublishStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Check for most recent campaign in publish queue
        const { data: queueData } = await supabase
          .from('quick_start_publish_queue')
          .select('campaign_id, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (queueData?.campaign_id) {
          setCampaignId(queueData.campaign_id);
          
          if (queueData.status === 'live') {
            setStatus('complete');
            setTimeout(() => navigate(`/ad-published/${queueData.campaign_id}`), 2000);
          } else {
            setStatus('publishing');
            // Redirect after showing message
            setTimeout(() => navigate(`/dashboard`), 4000);
          }
        } else {
          // No queue entry found, just go to dashboard
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (err) {
        console.error('Error checking publish status:', err);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    };

    checkPublishStatus();
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
            Your Quick-Start subscription is now active!
          </p>
        </div>

        <div className="space-y-4 text-base text-muted-foreground">
          {status === 'checking' && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Checking your campaign status...</p>
            </div>
          )}
          
          {status === 'publishing' && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Publishing your ad to Meta...</p>
              </div>
              <p className="text-sm">
                This usually takes 30-60 seconds. You'll be redirected to your dashboard where you can view your ad status.
              </p>
            </>
          )}

          {status === 'complete' && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">Your ad is live!</p>
              <p className="text-sm">Redirecting you to view your campaign...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
