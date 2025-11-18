export const PLAN_CONFIG = {
  free: null,
  quickstart: "price_1QccgjRfAZMMsSx8bHEQk4s3", // Quick-Start $49/mo - REPLACE WITH ACTUAL PRICE ID
  pro: "price_1QW0zIRfAZMMsSx8KpQXRVyC", // Pro $29 per ad set
  proUnlimited: "price_1QW10URfAZMMsSx8vYhxGmJR", // Pro Unlimited $99/mo
  elite: "price_1QW11cRfAZMMsSx8S7nJH5uX", // Scale Elite $199/mo
  agency: "price_1QW127RfAZMMsSx8QGOdxqnw", // Agency $999/mo
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
