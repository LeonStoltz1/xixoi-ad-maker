import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AutopilotMode = 'off' | 'safe' | 'standard' | 'aggressive';

export interface AutopilotSettings {
  autopilot_mode: AutopilotMode;
  confidence_threshold: number;
  auto_budget_adjustment: boolean;
  auto_creative_rotation: boolean;
  auto_pause_underperformers: boolean;
  notifications_enabled: boolean;
}

export interface OptimizationLog {
  id: string;
  action: string;
  decision_type: string;
  reason: string;
  confidence: number;
  auto_executed: boolean;
  campaign_id: string;
  created_at: string;
}

export function useAutopilot() {
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [logs, setLogs] = useState<OptimizationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_autopilot_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading autopilot settings:', error);
        return;
      }

      if (data) {
        setSettings({
          autopilot_mode: data.autopilot_mode as AutopilotMode,
          confidence_threshold: data.confidence_threshold,
          auto_budget_adjustment: data.auto_budget_adjustment,
          auto_creative_rotation: data.auto_creative_rotation,
          auto_pause_underperformers: data.auto_pause_underperformers,
          notifications_enabled: data.notifications_enabled
        });
      } else {
        // Create default settings
        const defaultSettings: AutopilotSettings = {
          autopilot_mode: 'off',
          confidence_threshold: 85,
          auto_budget_adjustment: false,
          auto_creative_rotation: false,
          auto_pause_underperformers: false,
          notifications_enabled: true
        };
        setSettings(defaultSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('optimization_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading optimization logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const updateSettings = async (updates: Partial<AutopilotSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSettings = { ...settings, ...updates };

      const { error } = await supabase
        .from('user_autopilot_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(newSettings as AutopilotSettings);
      toast({
        title: 'Settings updated',
        description: 'Your autopilot preferences have been saved.'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive'
      });
    }
  };

  const getConfidenceThreshold = (mode: AutopilotMode): number => {
    switch (mode) {
      case 'aggressive': return 70;
      case 'standard': return 85;
      case 'safe': return 95;
      default: return 100;
    }
  };

  return {
    settings,
    logs,
    loading,
    updateSettings,
    getConfidenceThreshold,
    refreshLogs: loadLogs
  };
}
