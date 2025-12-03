import { useAutopilot, AutopilotMode } from '@/hooks/useAutopilot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, TrendingUp, TrendingDown, Pause, Play, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AutopilotFeed() {
  const { settings, logs, loading, updateSettings } = useAutopilot();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'budget_increase': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'budget_decrease': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'pause_campaign': return <Pause className="h-4 w-4 text-red-500" />;
      case 'resume_campaign': return <Play className="h-4 w-4 text-green-500" />;
      case 'creative_rotation': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getModeDescription = (mode: AutopilotMode) => {
    switch (mode) {
      case 'aggressive': return 'Executes at 70%+ confidence';
      case 'standard': return 'Executes at 85%+ confidence';
      case 'safe': return 'Executes at 95%+ confidence';
      default: return 'Manual control only';
    }
  };

  return (
    <div className="space-y-6">
      {/* Autopilot Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Gemini Autopilot</CardTitle>
          </div>
          <CardDescription>
            Let AI automatically optimize your campaigns based on performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autopilot-mode">Autopilot Mode</Label>
              <p className="text-sm text-muted-foreground">
                {getModeDescription(settings?.autopilot_mode || 'off')}
              </p>
            </div>
            <Select
              value={settings?.autopilot_mode || 'off'}
              onValueChange={(value) => updateSettings({ autopilot_mode: value as AutopilotMode })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings?.autopilot_mode !== 'off' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-budget">Auto Budget Adjustment</Label>
                  <p className="text-sm text-muted-foreground">Increase/decrease budgets automatically</p>
                </div>
                <Switch
                  id="auto-budget"
                  checked={settings?.auto_budget_adjustment}
                  onCheckedChange={(checked) => updateSettings({ auto_budget_adjustment: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-pause">Auto Pause Underperformers</Label>
                  <p className="text-sm text-muted-foreground">Pause campaigns with poor CTR</p>
                </div>
                <Switch
                  id="auto-pause"
                  checked={settings?.auto_pause_underperformers}
                  onCheckedChange={(checked) => updateSettings({ auto_pause_underperformers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-creative">Auto Creative Rotation</Label>
                  <p className="text-sm text-muted-foreground">Rotate creatives when fatigue detected</p>
                </div>
                <Switch
                  id="auto-creative"
                  checked={settings?.auto_creative_rotation}
                  onCheckedChange={(checked) => updateSettings({ auto_creative_rotation: checked })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent AI Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent AI Actions</CardTitle>
            <Badge variant="outline">{logs.length} actions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No optimization actions yet. The AI will analyze your campaigns periodically.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={log.auto_executed ? 'default' : 'secondary'} className="text-xs">
                        {log.auto_executed ? 'Auto-executed' : 'Suggested'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {log.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
