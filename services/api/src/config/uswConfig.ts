import { storage } from "../storage";

export const USW_CONFIG_DEFAULTS = {
  fees: {
    baseFee: 3.99,
    perSubscriptionFee: 1.00,
    freeSubscriptions: 3,
    overageThreshold: 60,
    overageTiers: [
      { threshold: 20, rate: 0.03 },
      { threshold: 40, rate: 0.04 },
      { threshold: Infinity, rate: 0.05 }
    ]
  },
  eligibility: {
    minSubscriptions: 1,
    minMonthlyAmount: 0,
    maxNonPremiumCharge: 200
  },
  scheduling: {
    defaultRunDay: 1,
    retryAttempts: 3,
    retryIntervalHours: 8
  },
  limits: {
    maxSubscriptionsPerUser: 50,
    maxMonthlyAmount: 10000
  }
} as const;

export const USW_CONFIG = USW_CONFIG_DEFAULTS;

export type USWConfig = typeof USW_CONFIG_DEFAULTS;

export async function getUSWFeesFromDB(): Promise<{
  baseFee: number;
  perSubscriptionFee: number;
  freeSubscriptions: number;
  premiumDiscount: number;
}> {
  try {
    const config = await storage.getAppConfig("usw_fees");
    if (config?.value) {
      return config.value as any;
    }
  } catch (error) {
    console.error("Failed to fetch USW fees from DB, using defaults:", error);
  }
  return {
    baseFee: USW_CONFIG_DEFAULTS.fees.baseFee,
    perSubscriptionFee: USW_CONFIG_DEFAULTS.fees.perSubscriptionFee,
    freeSubscriptions: USW_CONFIG_DEFAULTS.fees.freeSubscriptions,
    premiumDiscount: 1.0
  };
}

export async function calculateMulahFeesFromDB(total: number, subscriptionCount: number, isPremium: boolean = false): Promise<{ fee: number; reason: string }> {
  const fees = await getUSWFeesFromDB();
  
  if (isPremium) {
    return { fee: 0, reason: "Premium - no fees" };
  }
  
  let totalFee = fees.baseFee;
  let reason = "Standard USW fee";
  
  const extraSubs = Math.max(0, subscriptionCount - fees.freeSubscriptions);
  const extraSubFee = extraSubs * fees.perSubscriptionFee;
  
  totalFee = fees.baseFee + extraSubFee;
  
  if (extraSubFee > 0) {
    reason = `€${fees.baseFee.toFixed(2)} base + €${extraSubFee.toFixed(2)} (${extraSubs} extra subs)`;
  }
  
  return { 
    fee: Math.round(totalFee * 100) / 100,
    reason
  };
}

export function calculateMulahFeesFromConfig(total: number, subscriptionCount: number): { fee: number; reason: string } {
  const config = USW_CONFIG_DEFAULTS.fees;
  
  let totalFee = config.baseFee;
  let reason = "Standard USW fee";
  
  const extraSubs = Math.max(0, subscriptionCount - config.freeSubscriptions);
  const extraSubFee = extraSubs * config.perSubscriptionFee;
  
  let percentageFee = 0;
  if (total > config.overageThreshold) {
    const overage = total - config.overageThreshold;
    let remaining = overage;
    let prevThreshold = 0;
    
    for (const tier of config.overageTiers) {
      const tierAmount = Math.min(remaining, tier.threshold - prevThreshold);
      if (tierAmount > 0) {
        percentageFee += tierAmount * tier.rate;
        remaining -= tierAmount;
        prevThreshold = tier.threshold;
      }
      if (remaining <= 0) break;
    }
  }
  
  totalFee = config.baseFee + extraSubFee + percentageFee;
  
  if (extraSubFee > 0 || percentageFee > 0) {
    const parts = [];
    if (extraSubFee > 0) parts.push(`€${extraSubFee.toFixed(2)} extra subs`);
    if (percentageFee > 0) parts.push(`€${percentageFee.toFixed(2)} overage`);
    reason = `€${config.baseFee} base + ${parts.join(' + ')}`;
  }
  
  return { 
    fee: Math.round(totalFee * 100) / 100,
    reason
  };
}

export function isEligibleForUSW(subscriptionCount: number, monthlyTotal: number, isPremium: boolean): {
  eligible: boolean;
  reason?: string;
} {
  const config = USW_CONFIG.eligibility;
  
  if (isPremium) {
    return { eligible: true };
  }
  
  if (subscriptionCount < config.minSubscriptions) {
    return {
      eligible: false,
      reason: `Add ${config.minSubscriptions - subscriptionCount} more subscription${config.minSubscriptions - subscriptionCount === 1 ? '' : 's'} to activate USW`
    };
  }
  
  if (monthlyTotal < config.minMonthlyAmount) {
    return {
      eligible: false,
      reason: `Need €${(config.minMonthlyAmount - monthlyTotal).toFixed(2)} more in monthly subscriptions to activate USW`
    };
  }
  
  return { eligible: true };
}
