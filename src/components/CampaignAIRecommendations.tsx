import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  DollarSign
} from "lucide-react";

interface CampaignRecommendation {
  type: 'increase_budget' | 'decrease_budget' | 'pause' | 'platform_switch' | 'optimize';
  priority: 'high' | 'medium' | 'low';
  message: string;
  reason: string;
  action?: () => void;
}

interface CampaignAIRecommendationsProps {
  campaignId: string;
  campaignName: string;
  performance: {
    ctr: number;
    cpm: number;
    cpc: number;
    roas: number | null;
    spendToday: number;
  };
  budget: {
    daily: number;
    remaining: number | null;
  };
}

export function CampaignAIRecommendations({
  campaignName,
  performance,
  budget,
}: CampaignAIRecommendationsProps) {
  // Generate AI-powered recommendations based on performance
  const recommendations: CampaignRecommendation[] = [];

  // Budget warnings
  if (budget.remaining !== null && budget.remaining < budget.daily * 2) {
    recommendations.push({
      type: 'increase_budget',
      priority: 'high',
      message: 'Budget running low',
      reason: `Only $${budget.remaining.toFixed(2)} remaining. Add $50 to keep ads running.`,
    });
  }

  // High spend velocity
  if (performance.spendToday > budget.daily * 1.3) {
    recommendations.push({
      type: 'decrease_budget',
      priority: 'medium',
      message: 'High spend velocity',
      reason: `Spending ${((performance.spendToday / budget.daily - 1) * 100).toFixed(0)}% above daily budget. Consider adjusting.`,
    });
  }

  // High CPM warning
  if (performance.cpm > 15) {
    recommendations.push({
      type: 'optimize',
      priority: 'medium',
      message: 'CPM rising',
      reason: `CPM at $${performance.cpm.toFixed(2)}. Try refreshing creative or adjusting targeting.`,
    });
  }

  // Strong CTR - increase budget
  if (performance.ctr > 2.5) {
    recommendations.push({
      type: 'increase_budget',
      priority: 'high',
      message: 'Strong CTR performance',
      reason: `${performance.ctr.toFixed(2)}% CTR. Increase daily budget by 20% to scale.`,
    });
  }

  // Poor ROAS
  if (performance.roas !== null && performance.roas < 1) {
    recommendations.push({
      type: 'pause',
      priority: 'high',
      message: 'Low ROAS',
      reason: `${performance.roas.toFixed(2)}x ROAS is below breakeven. Review targeting and creative.`,
    });
  }

  // Excellent ROAS
  if (performance.roas !== null && performance.roas > 3) {
    recommendations.push({
      type: 'increase_budget',
      priority: 'high',
      message: 'Excellent ROAS',
      reason: `${performance.roas.toFixed(2)}x ROAS is strong. Consider scaling this campaign.`,
    });
  }

  // Low spend - might be too conservative
  if (performance.spendToday < budget.daily * 0.5 && performance.spendToday > 0) {
    recommendations.push({
      type: 'optimize',
      priority: 'low',
      message: 'Under-spending',
      reason: 'Only using 50% of daily budget. Consider expanding audience or raising bids.',
    });
  }

  if (recommendations.length === 0) {
    return null;
  }

  const getIcon = (type: CampaignRecommendation['type']) => {
    switch (type) {
      case 'increase_budget': return <TrendingUp className="w-4 h-4" />;
      case 'decrease_budget': return <TrendingDown className="w-4 h-4" />;
      case 'pause': return <AlertTriangle className="w-4 h-4" />;
      case 'platform_switch': return <Target className="w-4 h-4" />;
      case 'optimize': return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: CampaignRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="font-semibold">AI Recommendations for {campaignName}</p>
        </div>
        
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg border bg-background/50"
            >
              <div className="mt-0.5">
                {getIcon(rec.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{rec.message}</p>
                  <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
