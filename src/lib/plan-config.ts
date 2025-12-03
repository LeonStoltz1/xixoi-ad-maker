export const PLAN_CONFIG = {
  free: null,
  quickstart: "price_1SZmlERfAZMMsSx86Qej", // Quick-Start $49/mo
  pro: "price_1SZmIERfAZMMsSx8UKOMlsu1", // Pro $29 per ad set
  proUnlimited: "price_1SZmIFRfAZMMsSx8Bkh6Cahn", // Pro Unlimited $99/mo
  elite: "price_1SZmIFRfAZMMsSx8ILZlxo3T", // Scale Elite $199/mo
  agency: "price_1SZmIGRfAZMMsSx88O7DsgzY", // Agency $999/mo
  // Autopilot Profit Tiers
  autopilotProfitLite: "price_autopilot_profit_lite", // $199/mo
  autopilotProfitPro: "price_autopilot_profit_pro", // $399/mo
  autopilotProfitUltra: "price_autopilot_profit_ultra", // $799/mo
  autopilotProfitEnterprise: "price_autopilot_profit_enterprise", // $1499/mo
} as const;

export type PlanTier = keyof typeof PLAN_CONFIG;

// Profit tier features configuration
export const PROFIT_TIER_FEATURES = {
  autopilotProfitLite: {
    name: 'Autopilot Profit Lite',
    price: 199,
    priceTests: 5,
    optimizationLoops: 2,
    contextWindow: 'standard',
    reflectionFrequency: 'weekly',
    features: [
      'Basic margin tracking',
      '5 price tests/month',
      'Weekly profit reports',
      'Manual safety controls',
    ],
  },
  autopilotProfitPro: {
    name: 'Autopilot Profit Pro',
    price: 399,
    priceTests: 20,
    optimizationLoops: 6,
    contextWindow: 'large',
    reflectionFrequency: 'daily',
    features: [
      'Advanced margin analysis',
      '20 price tests/month',
      'Daily profit optimization',
      'Auto safety pausing',
      'Elasticity tracking',
    ],
  },
  autopilotProfitUltra: {
    name: 'Autopilot Profit Ultra',
    price: 799,
    priceTests: 100,
    optimizationLoops: 24,
    contextWindow: 'extended',
    reflectionFrequency: 'hourly',
    features: [
      'Full profit engine access',
      'Unlimited price tests',
      'Hourly optimization cycles',
      'Auto budget reallocation',
      'Competitor price benchmarks',
      'Advanced elasticity modeling',
    ],
  },
  autopilotProfitEnterprise: {
    name: 'Autopilot Profit Enterprise',
    price: 1499,
    priceTests: -1, // unlimited
    optimizationLoops: -1, // continuous
    contextWindow: 'maximum',
    reflectionFrequency: 'continuous',
    features: [
      'Enterprise profit optimization',
      'Unlimited everything',
      'Continuous AI monitoring',
      'Custom optimization rules',
      'API access',
      'Dedicated support',
      'White-label reports',
    ],
  },
} as const;

export function getTierFromPriceId(priceId: string | null): PlanTier {
  if (!priceId) return 'free';
  
  const entry = Object.entries(PLAN_CONFIG).find(([_, id]) => id === priceId);
  return (entry?.[0] as PlanTier) || 'free';
}

export function isProTier(tier: PlanTier): boolean {
  return ['pro', 'proUnlimited', 'elite', 'agency'].includes(tier);
}

export function isProfitTier(tier: PlanTier): boolean {
  return tier.startsWith('autopilotProfit');
}

export function getProfitTierFeatures(tier: PlanTier) {
  if (!isProfitTier(tier)) return null;
  return PROFIT_TIER_FEATURES[tier as keyof typeof PROFIT_TIER_FEATURES] || null;
}
