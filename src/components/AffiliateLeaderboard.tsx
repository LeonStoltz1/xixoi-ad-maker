import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { AffiliateTierBadge } from './AffiliateTierBadge';

interface LeaderboardEntry {
  rank: number;
  affiliate_id: string;
  total_conversions: number;
  total_commissions: number;
  code: string;
  current_tier: string;
}

export function AffiliateLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'affiliate_leaderboard',
      }, () => {
        loadLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadLeaderboard() {
    try {
      // Get current month period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setCurrentPeriod({
        start: periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        end: periodEnd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });

      const { data, error } = await supabase
        .from('affiliate_leaderboard')
        .select(`
          rank,
          total_conversions,
          total_commissions,
          affiliate_id,
          affiliates!inner (
            code,
            current_tier
          )
        `)
        .eq('period_start', periodStart.toISOString().split('T')[0])
        .order('rank', { ascending: true })
        .limit(100);

      if (error) throw error;

      const formatted = data?.map((entry: any) => ({
        rank: entry.rank,
        affiliate_id: entry.affiliate_id,
        total_conversions: entry.total_conversions,
        total_commissions: entry.total_commissions,
        code: entry.affiliates.code,
        current_tier: entry.affiliates.current_tier,
      })) || [];

      setLeaderboard(formatted);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No leaderboard data yet. Start referring users to appear here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Leaderboard
          </CardTitle>
          <Badge variant="outline">{currentPeriod.start}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Top 3 Highlighted */}
        <div className="grid gap-4 mb-6">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.affiliate_id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                {getRankIcon(entry.rank)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{entry.code.slice(0, 10)}***</span>
                    <AffiliateTierBadge tier={entry.current_tier as any} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.total_conversions} conversions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${entry.total_commissions.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rest of Leaderboard */}
        {leaderboard.length > 3 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Top 100</h3>
            {leaderboard.slice(3).map((entry) => (
              <div
                key={entry.affiliate_id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">#{entry.rank}</span>
                  <div>
                    <span className="font-mono text-sm">{entry.code.slice(0, 10)}***</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {entry.total_conversions} conv
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  ${entry.total_commissions.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
