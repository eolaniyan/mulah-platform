import type { CFASummary, CFAInsight } from "../api/analytics";

export interface HealthScore {
  mulahScore: number;
  riskLevel: "Low" | "Medium" | "High";
  breakdown: {
    savingsRatePoints: number;
    recurringBurdenPoints: number;
    cashflowPoints: number;
  };
}

function mapApiRiskToDisplay(
  level: CFASummary["riskLevel"] | undefined
): HealthScore["riskLevel"] {
  if (!level) return "Medium";
  if (level === "low") return "Low";
  if (level === "critical" || level === "high") return "High";
  return "Medium";
}

/**
 * Maps GET /api/cfa/summary into the shared HealthScore shape.
 * The API already computes `healthScore` and `riskLevel`; we expose them here
 * for hooks that still expect a HealthScore object.
 */
export function calculateHealthScore(cfa: CFASummary): HealthScore {
  const mulahScore = Math.round(
    Math.max(0, Math.min(100, cfa.healthScore ?? 0))
  );
  return {
    mulahScore,
    riskLevel: mapApiRiskToDisplay(cfa.riskLevel),
    breakdown: {
      savingsRatePoints: 0,
      recurringBurdenPoints: 0,
      cashflowPoints: 0,
    },
  };
}

export function getSavingsRate(cfa: CFASummary): number {
  return cfa.savingsRate ?? 0;
}

export function getRecurringBurdenRatio(cfa: CFASummary): number {
  return cfa.subscriptionBurden ?? 0;
}

export function getCFANarrative(cfa: CFASummary): string {
  const savingsRate = getSavingsRate(cfa);
  const net = cfa.monthlyNetIncome ?? 0;
  if (net > 0) {
    return `You're saving ${savingsRate.toFixed(1)}% of your income — averaging about €${net.toFixed(0)} net per month.`;
  }
  if (net < 0) {
    return `Your spending is outpacing your income by about €${Math.abs(net).toFixed(0)}/month on average. Let's find where to cut.`;
  }
  return "Your income and spending are roughly balanced. Small optimizations could tip you into surplus.";
}

export function getTopRiskSignal(cfa: CFASummary): CFAInsight | null {
  const ranked = [...(cfa.insights ?? [])].sort((a, b) => {
    const order: Record<string, number> = {
      error: 0,
      warning: 1,
      info: 2,
      success: 3,
    };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });
  return ranked[0] ?? null;
}
