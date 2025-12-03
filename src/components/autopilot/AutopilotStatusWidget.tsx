import { useAutopilot } from '@/hooks/useAutopilot';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Brain, Settings, TrendingUp, Pause, RotateCcw, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AutopilotStatusWidget() {
  const { settings, logs, loading, updateSettings } = useAutopilot();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="animate-pulse border-2 border-foreground">
        <CardContent className="p-4">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const isEnabled = settings?.autopilot_mode !== 'off';
  const recentAutoActions = logs.filter(l => l.auto_executed).length;

  const handleToggle = (checked: boolean) => {
    updateSettings({ 
      autopilot_mode: checked ? 'standard' : 'off' 
    });
  };

  return (
    <Card className="overflow-hidden border-2 border-foreground">
      <CardContent className="p-4 space-y-4">
        {/* Header with toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
              <Brain className={`h-5 w-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <span className="font-semibold">AI Optimization</span>
              <p className="text-xs text-muted-foreground">
                {isEnabled ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={isEnabled} 
              onCheckedChange={handleToggle}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigate('/autopilot-settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* What it does */}
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground font-medium">Let AI automatically:</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span>Shift budget to winning ads</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Pause className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span>Pause underperformers</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span>Rotate top creatives</span>
            </li>
          </ul>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Maximize ROAS
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3 text-blue-500" />
            Save time
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Brain className="h-3 w-3 text-purple-500" />
            24/7 optimization
          </span>
        </div>

        {/* Status when enabled */}
        {isEnabled && recentAutoActions > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{recentAutoActions}</span> optimizations made recently
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
