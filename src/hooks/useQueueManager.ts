import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QueuedRequest {
  id?: string;
  request_type: string;
  request_payload: any;
  campaign_id?: string;
}

export interface PublishQueueRequest {
  campaign_id: string;
  platform: string;
}

export const useQueueManager = () => {
  const { toast } = useToast();

  const addToAIQueue = async (request: QueuedRequest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user already has a pending request of this type
      const { data: existing } = await supabase
        .from('ai_generation_queue')
        .select('id')
        .eq('user_id', user.id)
        .eq('request_type', request.request_type)
        .in('status', ['pending', 'processing'])
        .maybeSingle();

      if (existing) {
        toast({
          title: "Generation already in progress",
          description: "You already have a generation running. We'll start this one right after it finishes.",
          variant: "default",
        });
        return { queued: false, existing: true };
      }

      // Add to queue with immediate next_attempt_at (no jitter for AI)
      const { data, error } = await supabase
        .from('ai_generation_queue')
        .insert({
          user_id: user.id,
          campaign_id: request.campaign_id,
          request_type: request.request_type,
          request_payload: request.request_payload,
          status: 'pending',
          next_attempt_at: new Date().toISOString() // Ready immediately
        })
        .select()
        .single();

      if (error) throw error;

      // Get queue position
      const { data: queueData } = await supabase
        .from('ai_generation_queue')
        .select('queue_position, estimated_wait_seconds')
        .eq('id', data.id)
        .single();

      // Show appropriate message based on queue position
      if (queueData && queueData.queue_position) {
        if (queueData.queue_position <= 5) {
          toast({
            title: "Generation started",
            description: "Your AI generation will complete in under a minute.",
          });
        } else {
          const waitMinutes = Math.ceil((queueData.estimated_wait_seconds || 60) / 60);
          toast({
            title: `You're #${queueData.queue_position} in line`,
            description: `About ${waitMinutes} ${waitMinutes === 1 ? 'minute' : 'minutes'}. This is normal during high traffic.`,
          });
        }
      }

      // Trigger queue processor (non-blocking)
      supabase.functions.invoke('process-ai-queue').catch(console.error);

      return { queued: true, queueId: data.id };

    } catch (error) {
      console.error('Error adding to AI queue:', error);
      toast({
        title: "Queue error",
        description: error instanceof Error ? error.message : "Failed to queue request",
        variant: "destructive",
      });
      return { queued: false };
    }
  };

  const addToPublishQueue = async (request: PublishQueueRequest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's profile to check tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      // Only Quick-Start tier uses the queue
      if (profile?.plan !== 'quickstart') {
        return { queued: false, reason: 'Pro tier publishes directly' };
      }

      // Check if campaign already in queue
      const { data: existing } = await supabase
        .from('quick_start_publish_queue')
        .select('id, status')
        .eq('campaign_id', request.campaign_id)
        .eq('platform', request.platform)
        .in('status', ['queued', 'publishing'])
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already publishing",
          description: "This campaign is already in the publishing queue.",
          variant: "default",
        });
        return { queued: false, existing: true };
      }

      // Add to queue with random jitter (10-30s) for human-like timing
      const jitterSeconds = 10 + Math.floor(Math.random() * 20);
      const nextAttempt = new Date(Date.now() + jitterSeconds * 1000).toISOString();

      // Add to queue
      const { data, error } = await supabase
        .from('quick_start_publish_queue')
        .insert({
          user_id: user.id,
          campaign_id: request.campaign_id,
          platform: request.platform,
          status: 'queued',
          next_attempt_at: nextAttempt
        })
        .select()
        .single();

      if (error) throw error;

      // Get queue position
      const { data: queueData } = await supabase
        .from('quick_start_publish_queue')
        .select('queue_position, estimated_start_time')
        .eq('id', data.id)
        .single();

      // Show queue message
      if (queueData && queueData.queue_position) {
        if (queueData.queue_position <= 3) {
          toast({
            title: "Publishing starting soon",
            description: "Your ad will be published within the next few minutes.",
          });
        } else {
          const waitMinutes = queueData.estimated_start_time
            ? Math.ceil((new Date(queueData.estimated_start_time).getTime() - Date.now()) / 60000)
            : queueData.queue_position * 0.25;
          toast({
            title: "Campaign scheduled for publishing",
            description: `Estimated start: ${Math.max(1, Math.ceil(waitMinutes))} minutes. You don't need to keep this page open.`,
          });
        }
      }

      // Trigger queue processor (non-blocking)
      supabase.functions.invoke('process-publish-queue').catch(console.error);

      return { queued: true, queueId: data.id };

    } catch (error) {
      console.error('Error adding to publish queue:', error);
      toast({
        title: "Queue error",
        description: error instanceof Error ? error.message : "Failed to queue publish request",
        variant: "destructive",
      });
      return { queued: false };
    }
  };

  const checkQueueStatus = async (queueId: string, type: 'ai' | 'publish') => {
    try {
      const table = type === 'ai' ? 'ai_generation_queue' : 'quick_start_publish_queue';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', queueId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error checking queue status:', error);
      return null;
    }
  };

  return {
    addToAIQueue,
    addToPublishQueue,
    checkQueueStatus,
  };
};