type Platform = 'meta' | 'tiktok' | 'google' | 'linkedin' | 'x';

const SERVICE_FEE_USD = 5;

export interface SpendEngineInput {
  userAdSpend: number;             // amount user wants to go into ads, e.g. 200
  platforms: Platform[];           // ['meta'], ['meta','tiktok'], etc.
  aiMode?: boolean;                // default true
  durationDaysOverride?: number;   // optional
  startDate?: Date;                // optional
}

export interface PerPlatformBudget {
  platform: Platform;
  total: number;
  daily: number;
}

export interface SpendEngineResult {
  totalAdSpend: number;           // same as userAdSpend
  durationDays: number;
  dailyBudget: number;
  startDate: Date;
  endDate: Date;
  perPlatform: PerPlatformBudget[];
  serviceFeePerFunding: number;   // = 5
  initialStripeCharge: number;    // userAdSpend + 5
  summaryText: string;            // for UI
}

function recommendDurationDays(userAdSpend: number): number {
  if (userAdSpend < 50) return 3;
  if (userAdSpend < 150) return 7;
  if (userAdSpend < 500) return 10;
  if (userAdSpend < 2000) return 21;
  return 30;
}

export function generateSpendPlan(input: SpendEngineInput): SpendEngineResult {
  const {
    userAdSpend,
    platforms,
    aiMode = true,
    durationDaysOverride,
  } = input;

  const startDate = input.startDate ?? new Date();

  const durationDays = durationDaysOverride
    ? durationDaysOverride
    : aiMode
    ? recommendDurationDays(userAdSpend)
    : 7; // safe default if AI disabled

  const dailyBudget = userAdSpend / durationDays;

  const platformCount = Math.max(platforms.length, 1);
  const perPlatformTotal = userAdSpend / platformCount;
  const perPlatformDaily = perPlatformTotal / durationDays;

  const perPlatform: PerPlatformBudget[] = platforms.map((p) => ({
    platform: p,
    total: parseFloat(perPlatformTotal.toFixed(2)),
    daily: parseFloat(perPlatformDaily.toFixed(2)),
  }));

  // end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  const initialStripeCharge = userAdSpend + SERVICE_FEE_USD;

  const summaryText = `AI will allocate $${userAdSpend.toFixed(
    2
  )} across ${platforms.length} platform(s) over ${durationDays} day(s) (~$${dailyBudget.toFixed(
    2
  )}/day).
We'll charge $${initialStripeCharge.toFixed(
    2
  )} now: $${userAdSpend.toFixed(
    2
  )} to your ad budget and $${SERVICE_FEE_USD.toFixed(
    2
  )} xiXoi service fee. Each future top-up will also include a flat $${SERVICE_FEE_USD.toFixed(
    2
  )} fee.`;

  return {
    totalAdSpend: userAdSpend,
    durationDays,
    dailyBudget: parseFloat(dailyBudget.toFixed(2)),
    startDate,
    endDate,
    perPlatform,
    serviceFeePerFunding: SERVICE_FEE_USD,
    initialStripeCharge: parseFloat(initialStripeCharge.toFixed(2)),
    summaryText,
  };
}

export function computeTopupCharge(topupAmount: number) {
  return {
    adBudgetFund: topupAmount,
    serviceFee: SERVICE_FEE_USD,
    stripeCharge: topupAmount + SERVICE_FEE_USD,
  };
}
