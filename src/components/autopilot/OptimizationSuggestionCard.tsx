import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Pause, Play, RefreshCw, 
  Check, X, ChevronDown, ChevronUp 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OptimizationLog } from '@/hooks/useAutopilot';
import { cn } from '@/lib/utils';

interface OptimizationSuggestionCardProps {
  suggestion: OptimizationLog;
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function OptimizationSuggestionCard({ 
  suggestion, 
  onApprove, 
  onDismiss 
}: OptimizationSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'budget_increase':
        return {
          icon: TrendingUp,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          label: 'Increase Budget'
        };
      case 'budget_decrease':
        return {
          icon: TrendingDown,
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
          label: 'Decrease Budget'
        };
      case 'pause_campaign':
        return {
          icon: Pause,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          label: 'Pause Campaign'
        };
      case 'resume_campaign':
        return {
          icon: Play,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          label: 'Resume Campaign'
        };
      case 'creative_rotation':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          label: 'Rotate Creative'
        };
      default:
        return {
          icon: TrendingUp,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          label: action.replace(/_/g, ' ')
        };
    }
  };

  const config = getActionConfig(suggestion.action);
  const Icon = config.icon;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-500';
    if (confidence >= 75) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      suggestion.auto_executed && "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{config.label}</span>
              <Badge 
                variant={suggestion.auto_executed ? 'default' : 'outline'}
                className="text-xs"
              >
                {suggestion.auto_executed ? 'Executed' : 'Pending'}
              </Badge>
              <span className={cn("text-sm font-medium", getConfidenceColor(suggestion.confidence))}>
                {suggestion.confidence}%
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {suggestion.reason}
            </p>
            
            <button 
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Less details' : 'More details'}
            </button>
            
            {expanded && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decision Type:</span>
                  <span className="capitalize">{suggestion.decision_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span>{formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            )}
          </div>
          
          {!suggestion.auto_executed && (onApprove || onDismiss) && (
            <div className="flex gap-2 shrink-0">
              {onApprove && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  onClick={() => onApprove(suggestion.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onDismiss && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDismiss(suggestion.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
