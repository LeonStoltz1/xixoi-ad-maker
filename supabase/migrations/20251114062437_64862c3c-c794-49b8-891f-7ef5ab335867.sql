-- Enable public read access for affiliate leaderboard
-- Allow anyone to view affiliate codes and earnings (masked on frontend)
CREATE POLICY "Anyone can view affiliate leaderboard data"
ON affiliates
FOR SELECT
USING (true);

-- Allow anyone to count referrals for leaderboard stats
CREATE POLICY "Anyone can view referral counts for leaderboard"
ON affiliate_referrals
FOR SELECT
USING (true);