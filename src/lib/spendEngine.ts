type Platform = 'meta' | 'tiktok' | 'google' | 'linkedin' | 'x';

const SERVICE_FEE_USD = 5;

// Official platform minimum daily spends (2025)
const PLATFORM_MIN_DAILY: Record<Platform, number> = {
  meta: 40,        // $40/day for conversion-optimized (xiXoi's default)
  tiktok: 20,      // $20/day ad group minimum
  google: 2,       // $0.01 official, but $2 practical minimum
  linkedin: 10,    // $10/day official minimum
  x: 5,            // $5/day estimated minimum for X Ads
};

export function getMinimumDailySpend(platforms: Platform[]): number {
  if (platforms.length === 0) return 0;
  return Math.max(...platforms.map(p => PLATFORM_MIN_DAILY[p]));
}

export function getMinimumTotalSpend(platforms: Platform[], durationDays: number): number {
  const minDaily = getMinimumDailySpend(platforms);
  return minDaily * durationDays;
}

export function getPlatformRequirements(platforms: Platform[]): Array<{ platform: Platform; minDaily: number }> {
  return platforms.map(p => ({
    platform: p,
    minDaily: PLATFORM_MIN_DAILY[p]
  })).sort((a, b) => b.minDaily - a.minDaily); // Sort by highest first
}

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
  minimumDailySpend: number;      // minimum required daily
  minimumTotalSpend: number;      // minimum required total
  isValid: boolean;               // whether spend meets minimums
  validationError?: string;       // error message if invalid
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

  // Calculate platform minimums
  const minimumDailySpend = getMinimumDailySpend(platforms);
  const minimumTotalSpend = getMinimumTotalSpend(platforms, durationDays);
  
  // Validate spend meets minimums
  const isValid = userAdSpend >= minimumTotalSpend;
  let validationError: string | undefined;
  
  if (!isValid) {
    const requirements = getPlatformRequirements(platforms);
    const platformList = requirements
      .map(r => {
        const name = r.platform.charAt(0).toUpperCase() + r.platform.slice(1);
        return `${name} requires $${r.minDaily}/day`;
      })
      .join(', ');
    
    validationError = `Your budget of $${userAdSpend.toFixed(2)} equals $${dailyBudget.toFixed(2)}/day, which is below the minimum. ${platformList}. Minimum total for ${durationDays} days: $${minimumTotalSpend.toFixed(2)}`;
  }

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
    minimumDailySpend,
    minimumTotalSpend,
    isValid,
    validationError,
  };
}

export function computeTopupCharge(topupAmount: number) {
  return {
    adBudgetFund: topupAmount,
    serviceFee: SERVICE_FEE_USD,
    stripeCharge: topupAmount + SERVICE_FEE_USD,
  };
}
