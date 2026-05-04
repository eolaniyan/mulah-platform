import type { CFASummary } from "../api/analytics";
import { HEALTH_SCORE_THRESHOLDS } from "../constants";

export interface HealthScore {
  mulahScore: number;
  riskLevel: "Low" | "Medium" | "High";
  breakdown: {
    savingsRatePoints: number;
    recurringBurdenPoints: number;
    cashflowPoints: number;
  };
}

/**
 * Calculates the Mulah financial health score (0–100).
 * Algorithm mirrors Python health_score_engine.py exactly:
 *   - Base: 50
 *   - Savings rate: +25 (≥20%), +15 (≥10%), +5 (>0%), -15 (negative)
 *   - Recurring burden ratio: +15 (<5%), +10 (<10%), 0 (<20%), -10 (≥20%)
 *   - Net cashflow: +10 (positive), -10 (negative)
 */
export function calculateHealthScore(cfa: CFASummary): HealthScore {
  let score = 50;
  const { averageMonthlyIncome, averageMonthlyExpenses, averageMonthlySurplus } =
    cfa.cashflow;

  const savingsRate =
    averageMonthlyIncome > 0
      ? (averageMonthlySurplus / averageMonthlyIncome) * 100
      : 0;

  const recurringBurden = cfa.topSubscriptions.reduce(
    (sum, s) => sum + s.monthlyCost,
    0
  );
  const recurringRatio =
    averageMonthlyIncome > 0
      ? (recurringBurden / averageMonthlyIncome) * 100
      : 100;

  let savingsRatePoints = 0;
  if (savingsRate >= 20) savingsRatePoints = 25;
  else if (savingsRate >= 10) savingsRatePoints = 15;
  else if (savingsRate > 0) savingsRatePoints = 5;
  else savingsRatePoints = -15;

  let recurringBurdenPoints = 0;
  if (recurringRatio < 5) recurringBurdenPoints = 15;
  else if (recurringRatio < 10) recurringBurdenPoints = 10;
  else if (recurringRatio < 20) recurringBurdenPoints = 0;
  else recurringBurdenPoints = -10;

  const cashflowPoints = averageMonthlySurplus > 0 ? 10 : -10;

  score += savingsRatePoints + recurringBurdenPoints + cashflowPoints;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const riskLevel: HealthScore["riskLevel"] =
    score >= HEALTH_SCORE_THRESHOLDS.LOW_RISK
      ? "Low"
      : score >= HEALTH_SCORE_THRESHOLDS.MEDIUM_RISK
        ? "Medium"
        : "High";

  return {
    mulahScore: score,
    riskLevel,
    breakdown: { savingsRatePoints, recurringBurdenPoints, cashflowPoints },
  };
}

export function getSavingsRate(cfa: CFASummary): number {
  const { averageMonthlyIncome, averageMonthlySurplus } = cfa.cashflow;
  if (averageMonthlyIncome <= 0) return 0;
  return Math.round((averageMonthlySurplus / averageMonthlyIncome) * 1000) / 10;
}

export function getRecurringBurdenRatio(cfa: CFASummary): number {
  const recurring = cfa.topSubscriptions.reduce((s, sub) => s + sub.monthlyCost, 0);
  const income = cfa.cashflow.averageMonthlyIncome;
  if (income <= 0) return 100;
  return Math.round((recurring / income) * 1000) / 10;
}

export function getCFANarrative(cfa: CFASummary): string {
  const { surplusDeficitStatus, averageMonthlySurplus } = cfa.cashflow;
  const savingsRate = getSavingsRate(cfa);

  if (surplusDeficitStatus === "surplus") {
    return `You're saving ${savingsRate.toFixed(1)}% of your income — averaging €${averageMonthlySurplus.toFixed(0)} surplus per month.`;
  }
  if (surplusDeficitStatus === "deficit") {
    return `Your spending is outpacing your income by €${Math.abs(averageMonthlySurplus).toFixed(0)}/month on average. Let's find where to cut.`;
  }
  return "Your income and spending are roughly balanced. Small optimizations could tip you into surplus.";
}

export function getTopRiskSignal(
  cfa: CFASummary
): CFASummary["riskSignals"][number] | null {
  return (
    cfa.riskSignals
      .filter((s) => s.severity === "high")
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      })[0] ?? null
  );
}
