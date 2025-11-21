import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueueStatus {
  id: string;
  request_type: string;
  status: string;
  queue_position: number | null;
  estimated_wait_seconds: number | null;
  error_message: string | null;
  created_at: string;
}

interface PublishQueueStatus {
  id: string;
  platform: string;
  status: string;
  queue_position: number | null;
  estimated_start_time: string | null;
  error_message: string | null;
  created_at: string;
}

export function QueueStatusIndicator() {
  const [aiQueue, setAiQueue] = useState<QueueStatus[]>([]);
  const [publishQueue, setPublishQueue] = useState<PublishQueueStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueueStatus();
    
    // Set up real-time subscriptions
    const aiChannel = supabase
      .channel('ai_queue_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_generation_queue' }, 
        loadQueueStatus
      )
      .subscribe();

    const publishChannel = supabase
      .channel('publish_queue_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'quick_start_publish_queue' },
        loadQueueStatus
      )
      .subscribe();

    // Poll every 5 seconds for position updates
    const interval = setInterval(loadQueueStatus, 5000);

    return () => {
      aiChannel.unsubscribe();
      publishChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadQueueStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load AI queue
      const { data: aiData } = await supabase
        .from('ai_generation_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      // Load publish queue
      const { data: publishData } = await supabase
        .from('quick_start_publish_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['queued', 'publishing'])
        .order('created_at', { ascending: false });

      setAiQueue(aiData || []);
      setPublishQueue(publishData || []);
    } catch (error) {
      console.error('Error loading queue status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
      case 'publishing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
      case 'live':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) return null;
  if (aiQueue.length === 0 && publishQueue.length === 0) return null;

  return (
    <Card className="p-4 border-primary/20 bg-background/50 backdrop-blur">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Active Requests</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadQueueStatus}
          >
            Refresh
          </Button>
        </div>

        {/* AI Generation Queue */}
        {aiQueue.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">AI Generation</p>
            {aiQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {item.request_type.replace('_', ' ')}
                    </p>
                    {item.status === 'pending' && item.queue_position && (
                      <p className="text-xs text-muted-foreground">
                        #{item.queue_position} in line
                        {item.estimated_wait_seconds && (
                          <span> • ~{formatWaitTime(item.estimated_wait_seconds)}</span>
                        )}
                      </p>
                    )}
                    {item.status === 'processing' && (
                      <p className="text-xs text-muted-foreground">Generating...</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publish Queue */}
        {publishQueue.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Publishing</p>
            {publishQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {item.platform}
                    </p>
                    {item.status === 'queued' && item.queue_position && (
                      <p className="text-xs text-muted-foreground">
                        #{item.queue_position} in queue
                        {item.estimated_start_time && (
                          <span> • Starts in ~{formatWaitTime(
                            Math.max(0, Math.floor((new Date(item.estimated_start_time).getTime() - Date.now()) / 1000))
                          )}</span>
                        )}
                      </p>
                    )}
                    {item.status === 'publishing' && (
                      <p className="text-xs text-muted-foreground">Publishing to platform...</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informational message */}
        <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            {aiQueue.some(i => i.queue_position && i.queue_position > 5) ? (
              <>We're experiencing high traffic. Your requests will process automatically.</>
            ) : publishQueue.length > 0 ? (
              <>Quick-Start campaigns publish in safe batches to protect your results.</>
            ) : (
              <>Your requests are being processed.</>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}