import { BankTransaction, Subscription, Category } from "@shared/schema";
import { CategorizationService } from "./categorizationService";

export interface CFASummary {
  period: {
    from: string;
    to: string;
    months: number;
  };
  cashflow: {
    totalIncome: number;
    totalExpenses: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    averageMonthlySurplus: number;
    surplusDeficitStatus: "surplus" | "deficit" | "balanced";
  };
  topCategories: Array<{
    category: string;
    categorySlug: string;
    total: number;
    percentage: number;
    transactionCount: number;
  }>;
  topSubscriptions: Array<{
    name: string;
    monthlyCost: number;
    annualCost: number;
    percentage: number;
  }>;
  riskSignals: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
    value?: number;
  }>;
  patterns: {
    subscriptionCreep: boolean;
    highFixedCosts: boolean;
    irregularIncome: boolean;
    seasonalSpending: boolean;
  };
  recommendations: string[];
}

export class CFAService {
  static async generateSummary(
    transactions: BankTransaction[],
    subscriptions: Subscription[],
    fromDate?: Date,
    toDate?: Date
  ): Promise<CFASummary> {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setMonth(defaultFrom.getMonth() - 6);
    
    const from = fromDate || defaultFrom;
    const to = toDate || now;
    const months = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.transactionDate);
      return txDate >= from && txDate <= to;
    });

    const cashflow = this.calculateCashflow(filteredTransactions, months);
    const topCategories = this.calculateTopCategories(filteredTransactions);
    const topSubscriptions = this.calculateTopSubscriptions(subscriptions, cashflow.totalExpenses);
    const riskSignals = this.detectRiskSignals(cashflow, subscriptions, filteredTransactions);
    const patterns = this.detectPatterns(filteredTransactions, subscriptions);
    const recommendations = this.generateRecommendations(cashflow, topCategories, riskSignals);

    return {
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
        months
      },
      cashflow,
      topCategories: topCategories.slice(0, 5),
      topSubscriptions: topSubscriptions.slice(0, 5),
      riskSignals,
      patterns,
      recommendations
    };
  }

  private static calculateCashflow(transactions: BankTransaction[], months: number) {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      const direction = tx.direction || (amount >= 0 ? 'out' : 'in');
      
      if (direction === 'in' || amount < 0) {
        totalIncome += Math.abs(amount);
      } else {
        totalExpenses += Math.abs(amount);
      }
    }

    const averageMonthlyIncome = totalIncome / months;
    const averageMonthlyExpenses = totalExpenses / months;
    const averageMonthlySurplus = averageMonthlyIncome - averageMonthlyExpenses;

    let surplusDeficitStatus: "surplus" | "deficit" | "balanced";
    if (averageMonthlySurplus > 50) {
      surplusDeficitStatus = "surplus";
    } else if (averageMonthlySurplus < -50) {
      surplusDeficitStatus = "deficit";
    } else {
      surplusDeficitStatus = "balanced";
    }

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      averageMonthlyIncome: Math.round(averageMonthlyIncome * 100) / 100,
      averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
      averageMonthlySurplus: Math.round(averageMonthlySurplus * 100) / 100,
      surplusDeficitStatus
    };
  }

  private static calculateTopCategories(transactions: BankTransaction[]) {
    const categoryTotals = new Map<string, { total: number; count: number }>();
    let totalExpenses = 0;

    for (const tx of transactions) {
      const amount = Math.abs(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount);
      const direction = tx.direction || 'out';
      
      if (direction === 'out') {
        const category = tx.category || CategorizationService.categorizeTransaction(
          tx.description || '',
          tx.merchantName || undefined
        ).categorySlug;
        
        const existing = categoryTotals.get(category) || { total: 0, count: 0 };
        categoryTotals.set(category, {
          total: existing.total + amount,
          count: existing.count + 1
        });
        totalExpenses += amount;
      }
    }

    const categories = CategorizationService.getAllCategories();
    const result = Array.from(categoryTotals.entries())
      .map(([slug, data]) => {
        const cat = categories.find(c => c.slug === slug);
        return {
          category: cat?.name || slug,
          categorySlug: slug,
          total: Math.round(data.total * 100) / 100,
          percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
          transactionCount: data.count
        };
      })
      .sort((a, b) => b.total - a.total);

    return result;
  }

  private static calculateTopSubscriptions(subscriptions: Subscription[], totalExpenses: number) {
    return subscriptions
      .filter(sub => sub.isActive)
      .map(sub => {
        const cost = typeof sub.cost === 'string' ? parseFloat(sub.cost) : sub.cost;
        const monthlyCost = sub.billingCycle === 'yearly' ? cost / 12 : 
                           sub.billingCycle === 'weekly' ? cost * 4.33 : cost;
        const annualCost = monthlyCost * 12;
        
        return {
          name: sub.name,
          monthlyCost: Math.round(monthlyCost * 100) / 100,
          annualCost: Math.round(annualCost * 100) / 100,
          percentage: totalExpenses > 0 ? Math.round((monthlyCost / (totalExpenses / 6)) * 100) : 0
        };
      })
      .sort((a, b) => b.monthlyCost - a.monthlyCost);
  }

  private static detectRiskSignals(
    cashflow: CFASummary['cashflow'],
    subscriptions: Subscription[],
    transactions: BankTransaction[]
  ): CFASummary['riskSignals'] {
    const signals: CFASummary['riskSignals'] = [];

    const totalMonthlySubs = subscriptions
      .filter(s => s.isActive)
      .reduce((sum, sub) => {
        const cost = typeof sub.cost === 'string' ? parseFloat(sub.cost) : sub.cost;
        const monthly = sub.billingCycle === 'yearly' ? cost / 12 : 
                       sub.billingCycle === 'weekly' ? cost * 4.33 : cost;
        return sum + monthly;
      }, 0);

    if (cashflow.averageMonthlyIncome > 0) {
      const subPercentage = (totalMonthlySubs / cashflow.averageMonthlyIncome) * 100;
      if (subPercentage > 30) {
        signals.push({
          type: "high_subscription_ratio",
          severity: subPercentage > 50 ? "high" : "medium",
          message: `${Math.round(subPercentage)}% of your income goes to subscriptions`,
          value: Math.round(subPercentage)
        });
      }
    }

    if (cashflow.surplusDeficitStatus === "deficit") {
      signals.push({
        type: "monthly_deficit",
        severity: cashflow.averageMonthlySurplus < -200 ? "high" : "medium",
        message: `You're spending €${Math.abs(cashflow.averageMonthlySurplus).toFixed(0)} more than you earn monthly`,
        value: Math.abs(cashflow.averageMonthlySurplus)
      });
    }

    if (subscriptions.length > 10) {
      signals.push({
        type: "subscription_overload",
        severity: subscriptions.length > 15 ? "medium" : "low",
        message: `You have ${subscriptions.length} active subscriptions - consider consolidating`,
        value: subscriptions.length
      });
    }

    const savingsRate = cashflow.averageMonthlyIncome > 0 
      ? (cashflow.averageMonthlySurplus / cashflow.averageMonthlyIncome) * 100 
      : 0;
    
    if (savingsRate < 10 && cashflow.averageMonthlyIncome > 0) {
      signals.push({
        type: "low_savings_rate",
        severity: savingsRate < 5 ? "medium" : "low",
        message: `Your savings rate is only ${Math.round(savingsRate)}% - aim for at least 20%`,
        value: Math.round(savingsRate)
      });
    }

    return signals;
  }

  private static detectPatterns(
    transactions: BankTransaction[],
    subscriptions: Subscription[]
  ): CFASummary['patterns'] {
    return {
      subscriptionCreep: subscriptions.length > 8,
      highFixedCosts: false,
      irregularIncome: false,
      seasonalSpending: false
    };
  }

  private static generateRecommendations(
    cashflow: CFASummary['cashflow'],
    topCategories: CFASummary['topCategories'],
    riskSignals: CFASummary['riskSignals']
  ): string[] {
    const recommendations: string[] = [];

    if (cashflow.surplusDeficitStatus === "deficit") {
      recommendations.push("Consider reviewing your largest expense categories to find savings opportunities");
    }

    const hasHighSubRatio = riskSignals.some(s => s.type === "high_subscription_ratio");
    if (hasHighSubRatio) {
      recommendations.push("Review your subscriptions - you may have services you rarely use");
    }

    if (topCategories[0]?.percentage > 40) {
      recommendations.push(`${topCategories[0].category} is your biggest expense at ${topCategories[0].percentage}% - look for ways to reduce`);
    }

    const hasLowSavings = riskSignals.some(s => s.type === "low_savings_rate");
    if (hasLowSavings) {
      recommendations.push("Set up automatic transfers to savings on payday to boost your savings rate");
    }

    if (recommendations.length === 0) {
      recommendations.push("Your finances look healthy! Keep monitoring to maintain this balance");
    }

    return recommendations.slice(0, 4);
  }
}
