import { useAutopilot } from '@/hooks/useAutopilot';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Settings, Zap, Shield, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AutopilotStatusWidget() {
  const { settings, logs, loading } = useAutopilot();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const getModeConfig = (mode: string) => {
    switch (mode) {
      case 'aggressive':
        return {
          icon: Rocket,
          label: 'Aggressive',
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
          description: 'Auto-executing at 70%+ confidence'
        };
      case 'standard':
        return {
          icon: Zap,
          label: 'Standard',
          color: 'text-primary',
          bg: 'bg-primary/10',
          description: 'Auto-executing at 85%+ confidence'
        };
      case 'safe':
        return {
          icon: Shield,
          label: 'Safe',
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          description: 'Auto-executing at 95%+ confidence'
        };
      default:
        return {
          icon: Brain,
          label: 'Off',
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          description: 'Manual control only'
        };
    }
  };

  const config = getModeConfig(settings?.autopilot_mode || 'off');
  const Icon = config.icon;
  const recentAutoActions = logs.filter(l => l.auto_executed).length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Gemini Autopilot</span>
                <Badge variant={settings?.autopilot_mode === 'off' ? 'secondary' : 'default'}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/autopilot-settings')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {settings?.autopilot_mode !== 'off' && (
          <div className="px-4 pb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{recentAutoActions} auto-actions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">{logs.length - recentAutoActions} suggestions</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
