/**
 * Platform Profit Protection - Cost tracking and tier limits
 */

// Tier-based LLM cost limits (USD per month)
export const TIER_LLM_COST_LIMITS: Record<string, number> = {
  free: 0.16,
  quickstart: 0.99,
  pro: 6.00,
  proUnlimited: 12.00,
  elite: 29.00,
  agency: 199.00,
  autopilotProfitLite: 40.00,
  autopilotProfitPro: 80.00,
  autopilotProfitUltra: 160.00,
  autopilotProfitEnterprise: 500.00,
};

// Cost margin thresholds for action control
export const COST_MARGIN_THRESHOLDS = {
  DOWNGRADE_RECOMMENDATIONS: 0.20, // 20% - downgrade recommendations
  DISABLE_AUTO_EXECUTE: 0.10,      // 10% - disable auto-execute
  BLOCK_ALL_EXCEPT_STOP: 0.05,     // 5% - block all actions except "stop spend"
  HARD_STOP: 0,                     // 0% - hard stop all AI actions
};

// User cost profile status
export type CostStatus = 
  | 'healthy'           // > 20% remaining
  | 'warning'           // 10-20% remaining
  | 'critical'          // 5-10% remaining
  | 'blocked'           // < 5% remaining
  | 'exceeded';         // negative margin

export interface UserCostProfile {
  userId: string;
  llmCost: number;
  infraCost: number;
  stripeFees: number;
  totalCost: number;
  tierLimit: number;
  marginRemaining: number;
  marginPercentage: number;
  status: CostStatus;
  tier: string;
  autopilotLoops: number;
  conductorExecutions: number;
  creativeGenerations: number;
  priceTests: number;
  safetyChecks: number;
  apiCalls: number;
  // Revenue metrics from payment_economics
  grossRevenue: number;
  netRevenue: number;
  trueProfitMargin: number;
}

/**
 * Calculate user's cost status based on margin percentage
 */
export function calculateCostStatus(marginPercentage: number): CostStatus {
  if (marginPercentage < 0) return 'exceeded';
  if (marginPercentage < COST_MARGIN_THRESHOLDS.BLOCK_ALL_EXCEPT_STOP) return 'blocked';
  if (marginPercentage < COST_MARGIN_THRESHOLDS.DISABLE_AUTO_EXECUTE) return 'critical';
  if (marginPercentage < COST_MARGIN_THRESHOLDS.DOWNGRADE_RECOMMENDATIONS) return 'warning';
  return 'healthy';
}

/**
 * Check if action should be allowed based on cost status
 */
export function shouldAllowAction(
  status: CostStatus,
  actionType: 'autopilot' | 'price_test' | 'safety_check' | 'creative' | 'conductor'
): boolean {
  switch (status) {
    case 'exceeded':
    case 'blocked':
      return false;
    case 'critical':
      // Only allow safety checks when critical
      return actionType === 'safety_check';
    case 'warning':
      // Allow all but autopilot when in warning
      return actionType !== 'autopilot';
    case 'healthy':
      return true;
    default:
      return false;
  }
}

/**
 * Check if auto-execute should be enabled based on cost margin
 */
export function shouldAutoExecute(marginPercentage: number): boolean {
  return marginPercentage >= COST_MARGIN_THRESHOLDS.DISABLE_AUTO_EXECUTE;
}

/**
 * Get tier limit from plan name
 */
export function getTierLimit(plan: string): number {
  return TIER_LLM_COST_LIMITS[plan] || TIER_LLM_COST_LIMITS.free;
}

/**
 * Calculate estimated cost for an action
 */
export function getEstimatedActionCost(
  actionType: 'autopilot' | 'price_test' | 'safety_check' | 'creative' | 'conductor',
  costs: Record<string, number>
): number {
  const costMap: Record<string, string> = {
    autopilot: 'autopilot_loop_cost',
    price_test: 'price_test_cost',
    safety_check: 'profit_safety_loop_cost',
    creative: 'creative_generation_cost',
    conductor: 'conductor_execution_cost',
  };
  
  return costs[costMap[actionType]] || 0.01;
}

/**
 * Check if user can afford an action
 */
export function canAffordAction(
  profile: UserCostProfile,
  actionCost: number
): boolean {
  return profile.marginRemaining >= actionCost;
}

/**
 * Format cost profile for Gemini context
 */
export function formatCostBlockForGemini(profile: UserCostProfile): string {
  return `### SYSTEM COST BLOCK
{
  "userId": "${profile.userId}",
  "tier": "${profile.tier}",
  "tierLimit": ${profile.tierLimit.toFixed(2)},
  "totalCost": ${profile.totalCost.toFixed(4)},
  "stripeFees": ${profile.stripeFees.toFixed(2)},
  "marginRemaining": ${profile.marginRemaining.toFixed(4)},
  "marginPercentage": ${(profile.marginPercentage * 100).toFixed(1)}%,
  "status": "${profile.status}",
  "revenue": {
    "gross": ${profile.grossRevenue.toFixed(2)},
    "net": ${profile.netRevenue.toFixed(2)},
    "trueProfitMargin": ${profile.trueProfitMargin.toFixed(2)}
  },
  "usage": {
    "autopilotLoops": ${profile.autopilotLoops},
    "conductorExecutions": ${profile.conductorExecutions},
    "creativeGenerations": ${profile.creativeGenerations},
    "priceTests": ${profile.priceTests},
    "safetyChecks": ${profile.safetyChecks}
  }
}

COST RULES:
- If margin_remaining < 20% → downgrade recommendations
- If margin_remaining < 10% → disable auto-execute
- If margin_remaining < 5% → block all actions except "stop spend"
- If margin_remaining < 0% → hard stop all AI actions
- NEVER propose high-cost actions for users with low system margin
- NEVER run optimization, LLM chain, or safety cycle if remaining allowance is insufficient
- TRUE PROFIT = net_revenue - (llm_cost + infra_cost) [Stripe fees already deducted from net]`;
}
