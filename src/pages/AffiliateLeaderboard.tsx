import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

interface LeaderboardEntry {
  rank: number;
  code: string;
  total_earned: number;
  referral_count: number;
}

export default function AffiliateLeaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalEarnings: 0,
    totalReferrals: 0,
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Get top 10 affiliates by total_earned
      const { data: affiliates } = await (supabase as any)
        .from('affiliates')
        .select('code, total_earned, id')
        .order('total_earned', { ascending: false })
        .limit(10);

      if (!affiliates) {
        setLoading(false);
        return;
      }

      // Get referral counts for each affiliate
      const leaderboardData = await Promise.all(
        affiliates.map(async (affiliate: any, index: number) => {
          const { count } = await (supabase as any)
            .from('affiliate_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id);

          return {
            rank: index + 1,
            code: maskCode(affiliate.code),
            total_earned: affiliate.total_earned || 0,
            referral_count: count || 0,
          };
        })
      );

      setLeaderboard(leaderboardData);

      // Calculate overall stats
      const { count: totalAffiliates } = await (supabase as any)
        .from('affiliates')
        .select('*', { count: 'exact', head: true });

      const { data: allAffiliates } = await (supabase as any)
        .from('affiliates')
        .select('total_earned');

      const totalEarnings = allAffiliates?.reduce((sum: number, a: any) => sum + (a.total_earned || 0), 0) || 0;

      const { count: totalReferrals } = await (supabase as any)
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalAffiliates: totalAffiliates || 0,
        totalEarnings,
        totalReferrals: totalReferrals || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const maskCode = (code: string) => {
    // Mask the affiliate code for privacy (e.g., "JOHN-ABC12" -> "J***-AB**")
    if (!code || code.length < 4) return code;
    const parts = code.split('-');
    if (parts.length === 2) {
      const first = parts[0].charAt(0) + '*'.repeat(parts[0].length - 1);
      const second = parts[1].substring(0, 2) + '*'.repeat(Math.max(0, parts[1].length - 2));
      return `${first}-${second}`;
    }
    return code.substring(0, 2) + '*'.repeat(code.length - 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8" />;
      case 2:
        return <Medal className="w-8 h-8 text-muted-foreground" />;
      case 3:
        return <Award className="w-8 h-8 text-muted-foreground" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center font-bold text-muted-foreground">#{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-foreground text-background">🏆 Champion</Badge>;
      case 2:
        return <Badge className="bg-background text-foreground border border-foreground">🥈 Runner-up</Badge>;
      case 3:
        return <Badge className="bg-background text-foreground border border-foreground">🥉 Bronze</Badge>;
      default:
        return <Badge variant="secondary">Top 10</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-6xl py-12 px-6 mt-32">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-12 h-12 text-primary" />
            Affiliate Leaderboard
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Our top-performing affiliates earning passive income with xiXoi™
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalAffiliates}</div>
                  <div className="text-sm text-muted-foreground">Active Affiliates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Paid Out</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold">{stats.totalReferrals}</div>
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Spotlight */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Second Place */}
            <Card className="border-2 md:mt-8">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Medal className="w-16 h-16 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">#{2}</CardTitle>
                <CardDescription className="font-mono text-lg">{leaderboard[1].code}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  ${leaderboard[1].total_earned.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
                <div className="pt-2">
                  <Badge variant="secondary">
                    {leaderboard[1].referral_count} Referrals
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* First Place */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-20 h-20 animate-pulse" />
                </div>
                <CardTitle className="text-3xl">👑 #1</CardTitle>
                <CardDescription className="font-mono text-lg">{leaderboard[0].code}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  ${leaderboard[0].total_earned.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
                <div className="pt-2">
                  <Badge className="bg-foreground text-background">
                    {leaderboard[0].referral_count} Referrals
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Third Place */}
            <Card className="border-2 md:mt-8">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Award className="w-16 h-16 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">#{3}</CardTitle>
                <CardDescription className="font-mono text-lg">{leaderboard[2].code}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  ${leaderboard[2].total_earned.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
                <div className="pt-2">
                  <Badge variant="secondary">
                    {leaderboard[2].referral_count} Referrals
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Top 10 Performers</CardTitle>
            <CardDescription>
              Rankings based on total lifetime earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No affiliates on the leaderboard yet. Be the first!
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 border transition-colors ${
                      entry.rank <= 3 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-lg">{entry.code}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.referral_count} {entry.referral_count === 1 ? 'Referral' : 'Referrals'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold text-primary">
                          ${entry.total_earned.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Earned</div>
                      </div>
                      <div className="ml-4">
                        {getRankBadge(entry.rank)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20">
            <CardContent className="py-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Want to Join the Leaderboard?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start earning 20% recurring commission on every referral. The more you promote, 
                the higher you climb on the leaderboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/influencers')}>
                  Learn About Affiliate Program
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Join Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
