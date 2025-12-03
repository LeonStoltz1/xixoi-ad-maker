export const PLAN_CONFIG = {
  free: null,
  quickstart: "price_1SZmlERfAZMMsSx86Qej", // Quick-Start $49/mo
  pro: "price_1SZmIERfAZMMsSx8UKOMlsu1", // Pro $29 per ad set
  proUnlimited: "price_1SZmIFRfAZMMsSx8Bkh6Cahn", // Pro Unlimited $99/mo
  elite: "price_1SZmIFRfAZMMsSx8ILZlxo3T", // Scale Elite $199/mo
  agency: "price_1SZmIGRfAZMMsSx88O7DsgzY", // Agency $999/mo
} as const;

export type PlanTier = keyof typeof PLAN_CONFIG;

export function getTierFromPriceId(priceId: string | null): PlanTier {
  if (!priceId) return 'free';
  
  const entry = Object.entries(PLAN_CONFIG).find(([_, id]) => id === priceId);
  return (entry?.[0] as PlanTier) || 'free';
}

export function isProTier(tier: PlanTier): boolean {
  return ['pro', 'proUnlimited', 'elite', 'agency'].includes(tier);
}
