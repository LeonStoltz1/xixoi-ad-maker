import { Trophy, Users, DollarSign, Target, Sparkles, Crown, Rocket } from 'lucide-react';

export interface MilestoneConfig {
  type: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

export const MILESTONE_CONFIGS: Record<string, MilestoneConfig> = {
  first_referral: {
    type: 'first_referral',
    label: 'First Referral',
    description: 'Made your first referral',
    icon: Users,
    color: 'text-blue-500'
  },
  referrals_5: {
    type: 'referrals_5',
    label: '5 Referrals',
    description: 'Referred 5 customers',
    icon: Target,
    color: 'text-green-500'
  },
  referrals_10: {
    type: 'referrals_10',
    label: '10 Referrals',
    description: 'Referred 10 customers',
    icon: Trophy,
    color: 'text-yellow-500'
  },
  referrals_25: {
    type: 'referrals_25',
    label: '25 Referrals',
    description: 'Referred 25 customers',
    icon: Sparkles,
    color: 'text-purple-500'
  },
  referrals_50: {
    type: 'referrals_50',
    label: '50 Referrals',
    description: 'Referred 50 customers',
    icon: Rocket,
    color: 'text-orange-500'
  },
  referrals_100: {
    type: 'referrals_100',
    label: '100 Referrals',
    description: 'Referred 100 customers',
    icon: Crown,
    color: 'text-amber-500'
  },
  first_payout: {
    type: 'first_payout',
    label: 'First Payout',
    description: 'Received your first payout',
    icon: DollarSign,
    color: 'text-green-500'
  },
  earnings_1000: {
    type: 'earnings_1000',
    label: '$1,000 Earned',
    description: 'Earned $1,000 in commissions',
    icon: DollarSign,
    color: 'text-blue-500'
  },
  earnings_5000: {
    type: 'earnings_5000',
    label: '$5,000 Earned',
    description: 'Earned $5,000 in commissions',
    icon: Trophy,
    color: 'text-purple-500'
  },
  earnings_10000: {
    type: 'earnings_10000',
    label: '$10,000 Earned',
    description: 'Earned $10,000 in commissions',
    icon: Crown,
    color: 'text-amber-500'
  }
};

export function getMilestoneConfig(milestoneType: string): MilestoneConfig {
  return MILESTONE_CONFIGS[milestoneType] || {
    type: milestoneType,
    label: milestoneType,
    description: 'Achievement unlocked',
    icon: Trophy,
    color: 'text-primary'
  };
}