import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

export const PerformanceAlerts = () => {
  // Temporarily disabled until database types regenerate
  return null;
  
  /* Uncomment after types regenerate:
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    
    // Subscribe to realtime alerts
    const channel = supabase
      .channel('performance-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_alerts'
        },
        (payload) => {
          setAlerts(prev => [payload.new, ...prev]);
          toast.success(payload.new.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('performance_alerts')
        .select('*, campaigns(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setAlerts(data || []);
    } catch (error) {
      console.error('Load alerts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('performance_alerts')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', alertId);
    
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };
  */

  /* Uncomment after types regenerate:
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high_roas': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'low_roas': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Performance Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 p-3 border border-foreground/10 rounded-lg">
            {getAlertIcon(alert.alert_type)}
            <div className="flex-1">
              <p className="text-sm md:text-base font-medium">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(alert.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
  */
};