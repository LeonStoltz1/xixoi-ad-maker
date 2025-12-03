import { useAutopilot, AutopilotMode } from '@/hooks/useAutopilot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Shield, Rocket, AlertTriangle, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OptimizationSuggestionCard } from './OptimizationSuggestionCard';
import { cn } from '@/lib/utils';

export function AutopilotSettingsPage() {
  const { settings, logs, loading, updateSettings, refreshLogs } = useAutopilot();

  const modeOptions: { value: AutopilotMode; label: string; icon: typeof Brain; description: string; threshold: number }[] = [
    { 
      value: 'off', 
      label: 'Off', 
      icon: Brain, 
      description: 'All optimizations require manual approval',
      threshold: 100
    },
    { 
      value: 'safe', 
      label: 'Safe', 
      icon: Shield, 
      description: 'Only execute very high confidence optimizations',
      threshold: 95
    },
    { 
      value: 'standard', 
      label: 'Standard', 
      icon: Zap, 
      description: 'Balanced automatic optimization',
      threshold: 85
    },
    { 
      value: 'aggressive', 
      label: 'Aggressive', 
      icon: Rocket, 
      description: 'Maximize automation, execute more frequently',
      threshold: 70
    },
  ];

  const pendingSuggestions = logs.filter(l => !l.auto_executed);
  const executedActions = logs.filter(l => l.auto_executed);

  if (loading) {
    return (
      <AppLayout title="Autopilot Settings" showBack backTo="/dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Autopilot Settings" showBack backTo="/dashboard">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Autopilot Mode
            </CardTitle>
            <CardDescription>
              Choose how aggressively Gemini should optimize your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = settings?.autopilot_mode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ autopilot_mode: option.value })}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-medium">{option.label}</span>
                      {option.value !== 'off' && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {option.threshold}%+
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Automation Controls */}
        {settings?.autopilot_mode !== 'off' && (
          <Card>
            <CardHeader>
              <CardTitle>Automation Controls</CardTitle>
              <CardDescription>
                Fine-tune what actions the AI can take automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-budget" className="text-base">Auto Budget Adjustment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically increase budgets for high-performing campaigns and decrease for underperformers
                  </p>
                </div>
                <Switch
                  id="auto-budget"
                  checked={settings?.auto_budget_adjustment}
                  onCheckedChange={(checked) => updateSettings({ auto_budget_adjustment: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-pause" className="text-base">Auto Pause Underperformers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically pause campaigns with consistently poor performance metrics
                  </p>
                </div>
                <Switch
                  id="auto-pause"
                  checked={settings?.auto_pause_underperformers}
                  onCheckedChange={(checked) => updateSettings({ auto_pause_underperformers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-creative" className="text-base">Auto Creative Rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate ad creatives when engagement fatigue is detected
                  </p>
                </div>
                <Switch
                  id="auto-creative"
                  checked={settings?.auto_creative_rotation}
                  onCheckedChange={(checked) => updateSettings({ auto_creative_rotation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when the AI takes automatic actions
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings?.notifications_enabled}
                  onCheckedChange={(checked) => updateSettings({ notifications_enabled: checked })}
                />
              </div>

              {settings?.autopilot_mode === 'aggressive' && (
                <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Aggressive Mode Active</p>
                    <p className="text-sm text-muted-foreground">
                      The AI will execute optimizations at 70%+ confidence. Monitor your campaigns closely.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Suggestions */}
        {pendingSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Suggestions</CardTitle>
                  <CardDescription>Review and approve AI recommendations</CardDescription>
                </div>
                <Badge variant="secondary">{pendingSuggestions.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingSuggestions.slice(0, 5).map((suggestion) => (
                <OptimizationSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApprove={(id) => console.log('Approve', id)}
                  onDismiss={(id) => console.log('Dismiss', id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Actions</CardTitle>
                <CardDescription>Actions taken by Gemini Autopilot</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshLogs}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {executedActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No actions taken yet</p>
                <p className="text-sm text-muted-foreground">
                  The AI will analyze your campaigns and take actions when appropriate
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {executedActions.slice(0, 10).map((action) => (
                  <OptimizationSuggestionCard
                    key={action.id}
                    suggestion={action}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
