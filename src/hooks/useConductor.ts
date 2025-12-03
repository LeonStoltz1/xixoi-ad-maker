/**
 * Hook for triggering and monitoring Gemini Conductor optimizations
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConductorResult {
  success: boolean;
  decisions: number;
  executed: string[];
  summary: string;
}

export function useConductor() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ConductorResult | null>(null);
  const { toast } = useToast();

  const runConductor = useCallback(async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-conductor');

      if (error) {
        throw error;
      }

      setLastResult(data as ConductorResult);

      if (data?.executed?.length > 0) {
        toast({
          title: 'Optimizations Applied',
          description: `${data.executed.length} actions auto-executed`,
        });
      } else if (data?.decisions > 0) {
        toast({
          title: 'Analysis Complete',
          description: `${data.decisions} suggestions generated`,
        });
      }

      return data;
    } catch (error) {
      console.error('Conductor error:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not run AI optimization',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  const scheduleTask = useCallback(async (
    taskType: string,
    campaignId?: string,
    payload?: Record<string, unknown>
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('agent_tasks')
      .insert([{
        user_id: user.id,
        task_type: taskType,
        campaign_id: campaignId,
        payload: (payload || {}) as unknown as Record<string, never>,
        status: 'pending' as const,
        priority: 5
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to schedule task:', error);
      return null;
    }

    return data;
  }, []);

  return {
    isRunning,
    lastResult,
    runConductor,
    scheduleTask
  };
}
