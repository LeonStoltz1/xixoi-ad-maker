import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Target, TrendingUp } from 'lucide-react';

interface Milestone {
  level: number;
  amount: number;
  achieved: boolean;
}

interface AffiliateMilestonesProps {
  affiliateId: string;
  totalConversions: number;
}

const MILESTONES = [
  { level: 20, amount: 200 },
  { level: 50, amount: 500 },
  { level: 100, amount: 1000 },
  { level: 500, amount: 5000 },
  { level: 1000, amount: 10000 },
];

export function AffiliateMilestones({ affiliateId, totalConversions }: AffiliateMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextMilestone, setNextMilestone] = useState<{ level: number; amount: number } | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadMilestones();
  }, [affiliateId, totalConversions]);

  async function loadMilestones() {
    try {
      // Get achieved bonuses
      const { data: bonuses, error } = await supabase
        .from('affiliate_bonus_rewards')
        .select('milestone_level')
        .eq('affiliate_id', affiliateId)
        .eq('reward_type', 'milestone');

      if (error) throw error;

      const achievedLevels = new Set(bonuses?.map(b => b.milestone_level) || []);

      const milestonesData = MILESTONES.map(m => ({
        level: m.level,
        amount: m.amount,
        achieved: achievedLevels.has(m.level) || totalConversions >= m.level,
      }));

      setMilestones(milestonesData);

      // Calculate next milestone
      const next = MILESTONES.find(m => totalConversions < m.level);
      setNextMilestone(next || null);

      // Calculate progress to next milestone
      if (next) {
        const previous = MILESTONES.find(m => m.level <= totalConversions);
        const previousLevel = previous?.level || 0;
        const progressPercent = ((totalConversions - previousLevel) / (next.level - previousLevel)) * 100;
        setProgress(Math.min(progressPercent, 100));
      } else {
        setProgress(100);
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestone Bonuses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading milestones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Milestone Bonuses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Milestone Progress */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Next: ${nextMilestone.amount} bonus at {nextMilestone.level} conversions
              </span>
              <Badge variant="outline">
                {totalConversions}/{nextMilestone.level}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {nextMilestone.level - totalConversions} conversions to go!
            </p>
          </div>
        )}

        {/* All Milestones */}
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.level}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                milestone.achieved
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className={`w-5 h-5 ${milestone.achieved ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-semibold">{milestone.level} Conversions</p>
                  <p className="text-sm text-muted-foreground">${milestone.amount} bonus</p>
                </div>
              </div>
              {milestone.achieved ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Earned ✓
                </Badge>
              ) : (
                <Badge variant="outline">
                  {milestone.level - totalConversions} to go
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Total Potential */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Potential Bonuses</span>
            </div>
            <span className="text-lg font-bold">
              ${MILESTONES.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unlock all milestones to earn ${MILESTONES.reduce((sum, m) => sum + m.amount, 0).toLocaleString()} in cash bonuses
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
