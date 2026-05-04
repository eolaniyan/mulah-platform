import { BankTransaction, Subscription } from "@shared/schema";

export interface DetectedSubscription {
  id: string;
  merchantName: string;
  description: string;
  averageAmount: number;
  frequency: "weekly" | "monthly" | "yearly";
  estimatedInterval: number;
  transactionCount: number;
  confidence: number;
  lastPaymentDate: Date;
  nextEstimatedDate: Date;
  matchedTransactionIds: number[];
  existingSubscriptionId?: number;
}

interface TransactionGroup {
  merchantName: string;
  description: string;
  transactions: BankTransaction[];
  amounts: number[];
  dates: Date[];
}

export class SubscriptionDetectionService {
  private static readonly INTERVAL_TOLERANCE = 5;
  private static readonly AMOUNT_TOLERANCE = 0.15;
  private static readonly MIN_OCCURRENCES = 2;

  static async detectSubscriptions(
    transactions: BankTransaction[],
    existingSubscriptions: Subscription[]
  ): Promise<DetectedSubscription[]> {
    const groups = this.groupTransactions(transactions);
    const detections: DetectedSubscription[] = [];

    for (const group of groups) {
      if (group.transactions.length < this.MIN_OCCURRENCES) continue;

      const detection = this.analyzeGroup(group, existingSubscriptions);
      if (detection && detection.confidence >= 0.5) {
        detections.push(detection);
      }
    }

    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  private static groupTransactions(transactions: BankTransaction[]): TransactionGroup[] {
    const groups = new Map<string, TransactionGroup>();

    for (const tx of transactions) {
      const direction = tx.direction || 'out';
      if (direction !== 'out') continue;

      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      if (amount <= 0) continue;

      const key = this.normalizeKey(tx.merchantName || tx.description || '');
      if (!key) continue;

      if (!groups.has(key)) {
        groups.set(key, {
          merchantName: tx.merchantName || '',
          description: tx.description || '',
          transactions: [],
          amounts: [],
          dates: []
        });
      }

      const group = groups.get(key)!;
      group.transactions.push(tx);
      group.amounts.push(amount);
      group.dates.push(new Date(tx.transactionDate));
    }

    return Array.from(groups.values());
  }

  private static normalizeKey(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
  }

  private static analyzeGroup(
    group: TransactionGroup,
    existingSubscriptions: Subscription[]
  ): DetectedSubscription | null {
    if (group.transactions.length < this.MIN_OCCURRENCES) return null;

    group.dates.sort((a, b) => a.getTime() - b.getTime());

    const intervals = this.calculateIntervals(group.dates);
    if (intervals.length === 0) return null;

    const { frequency, avgInterval, intervalConfidence } = this.detectFrequency(intervals);
    if (!frequency) return null;

    const { avgAmount, amountConfidence } = this.analyzeAmounts(group.amounts);

    const confidence = Math.min(
      intervalConfidence * 0.6 + amountConfidence * 0.4,
      0.95
    );

    const merchantName = group.merchantName || this.extractMerchantName(group.description);
    const existingSub = this.findMatchingSubscription(merchantName, avgAmount, existingSubscriptions);

    const lastDate = group.dates[group.dates.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + avgInterval);

    return {
      id: `detected_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      merchantName,
      description: group.description,
      averageAmount: Math.round(avgAmount * 100) / 100,
      frequency,
      estimatedInterval: avgInterval,
      transactionCount: group.transactions.length,
      confidence: Math.round(confidence * 100) / 100,
      lastPaymentDate: lastDate,
      nextEstimatedDate: nextDate,
      matchedTransactionIds: group.transactions.map(tx => tx.id),
      existingSubscriptionId: existingSub?.id
    };
  }

  private static calculateIntervals(dates: Date[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round(
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(diff);
    }
    return intervals;
  }

  private static detectFrequency(intervals: number[]): {
    frequency: "weekly" | "monthly" | "yearly" | null;
    avgInterval: number;
    intervalConfidence: number;
  } {
    if (intervals.length === 0) {
      return { frequency: null, avgInterval: 0, intervalConfidence: 0 };
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const isWeekly = intervals.every(i => Math.abs(i - 7) <= this.INTERVAL_TOLERANCE);
    const isMonthly = intervals.every(i => Math.abs(i - 30) <= this.INTERVAL_TOLERANCE);
    const isYearly = intervals.every(i => Math.abs(i - 365) <= 30);

    if (isWeekly) {
      const variance = this.calculateVariance(intervals, 7);
      return { frequency: "weekly", avgInterval: 7, intervalConfidence: 1 - variance / 7 };
    }
    if (isMonthly) {
      const variance = this.calculateVariance(intervals, 30);
      return { frequency: "monthly", avgInterval: 30, intervalConfidence: 1 - variance / 30 };
    }
    if (isYearly) {
      const variance = this.calculateVariance(intervals, 365);
      return { frequency: "yearly", avgInterval: 365, intervalConfidence: 1 - variance / 365 };
    }

    if (avgInterval >= 25 && avgInterval <= 35) {
      const variance = this.calculateVariance(intervals, avgInterval);
      return { frequency: "monthly", avgInterval: Math.round(avgInterval), intervalConfidence: Math.max(0.5, 1 - variance / avgInterval) };
    }

    return { frequency: null, avgInterval: 0, intervalConfidence: 0 };
  }

  private static calculateVariance(values: number[], expected: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - expected, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private static analyzeAmounts(amounts: number[]): {
    avgAmount: number;
    amountConfidence: number;
  } {
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    const withinTolerance = amounts.filter(
      a => Math.abs(a - avgAmount) / avgAmount <= this.AMOUNT_TOLERANCE
    ).length;
    
    const amountConfidence = withinTolerance / amounts.length;
    
    return { avgAmount, amountConfidence };
  }

  private static extractMerchantName(description: string): string {
    const cleaned = description
      .replace(/[0-9]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleaned.split(' ').slice(0, 3);
    return words.join(' ') || 'Unknown';
  }

  private static findMatchingSubscription(
    merchantName: string,
    amount: number,
    subscriptions: Subscription[]
  ): Subscription | undefined {
    const normalizedMerchant = merchantName.toLowerCase();
    
    return subscriptions.find(sub => {
      const normalizedName = sub.name.toLowerCase();
      const subAmount = typeof sub.cost === 'string' ? parseFloat(sub.cost) : sub.cost;
      
      const nameMatch = normalizedMerchant.includes(normalizedName) || 
                       normalizedName.includes(normalizedMerchant);
      const amountMatch = Math.abs(subAmount - amount) / amount <= 0.1;
      
      return nameMatch && amountMatch;
    });
  }
}
