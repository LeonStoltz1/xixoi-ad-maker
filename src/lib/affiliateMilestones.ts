export interface MilestoneProgress {
  current: number;
  next: number;
  percentage: number;
  label: string;
  achieved: boolean;
}

const REFERRAL_MILESTONES = [1, 5, 10, 25, 50, 100];
const EARNINGS_MILESTONES = [1000, 5000, 10000];

export function getNextReferralMilestone(currentReferrals: number): MilestoneProgress {
  const nextMilestone = REFERRAL_MILESTONES.find(m => m > currentReferrals);
  
  if (!nextMilestone) {
    return {
      current: currentReferrals,
      next: 100,
      percentage: 100,
      label: 'All referral milestones achieved! 🎉',
      achieved: true
    };
  }

  const previousMilestone = REFERRAL_MILESTONES.find(m => m <= currentReferrals) || 0;
  const progress = ((currentReferrals - previousMilestone) / (nextMilestone - previousMilestone)) * 100;

  return {
    current: currentReferrals,
    next: nextMilestone,
    percentage: Math.min(progress, 100),
    label: `${currentReferrals}/${nextMilestone} referrals`,
    achieved: false
  };
}

export function getNextEarningsMilestone(currentEarnings: number): MilestoneProgress {
  const nextMilestone = EARNINGS_MILESTONES.find(m => m > currentEarnings);
  
  if (!nextMilestone) {
    return {
      current: currentEarnings,
      next: 10000,
      percentage: 100,
      label: 'All earnings milestones achieved! 🎉',
      achieved: true
    };
  }

  const previousMilestone = EARNINGS_MILESTONES.find(m => m <= currentEarnings) || 0;
  const progress = ((currentEarnings - previousMilestone) / (nextMilestone - previousMilestone)) * 100;

  return {
    current: currentEarnings,
    next: nextMilestone,
    percentage: Math.min(progress, 100),
    label: `$${currentEarnings.toFixed(2)}/$${nextMilestone.toFixed(2)}`,
    achieved: false
  };
}

export function hasFirstPayoutMilestone(totalPaid: number): boolean {
  return totalPaid > 0;
}