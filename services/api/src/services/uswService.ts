import { db } from '../db';
import { subscriptions, type Subscription } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { calculateMulahFeesFromDB, getUSWFeesFromDB } from '../config/uswConfig';

export interface USWCalculation {
  subscriptionTotal: number;
  mulahFee: number;
  totalCharge: number;
  isPremium: boolean;
  canRun: boolean;
  message: string;
  nextRunDate: string;
  breakdown: {
    monthly: number;
    yearly: number;
    weekly: number;
    subscriptionCount: number;
  };
}

export interface USWTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'collection' | 'disbursement' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  subscriptionId?: number;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export class USWService {
  /**
   * Calculate USW totals and fees for a user's subscriptions
   * Uses database-driven fee configuration
   */
  static async calculateUSWTotal(subscriptions: Subscription[], isPremium: boolean = false): Promise<USWCalculation> {
    const monthlyTotal = subscriptions.reduce((total, sub) => {
      const cost = typeof sub.cost === 'string' ? parseFloat(sub.cost) : sub.cost;
      const monthlyCost = sub.billingCycle === 'yearly' ? cost / 12 : cost;
      return total + monthlyCost;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;
    const weeklyTotal = monthlyTotal / 4.33; // Average weeks per month

    const subscriptionCount = subscriptions.length;
    
    // Use database-driven fee calculation
    const feeResult = await calculateMulahFeesFromDB(monthlyTotal, subscriptionCount, isPremium);
    const mulahFee = feeResult.fee;
    const totalCharge = monthlyTotal + mulahFee;

    // Get eligibility config from database
    const feeConfig = await getUSWFeesFromDB();
    const maxNonPremiumCharge = feeConfig.maxNonPremiumCharge || 200; // Default €200 limit
    
    // Determine if user can run USW
    let canRun = subscriptionCount >= 1;
    let message = '';
    
    // Check non-premium charge limit
    if (!isPremium && totalCharge > maxNonPremiumCharge) {
      canRun = false;
      message = `USW run limit exceeded. Your total of €${totalCharge.toFixed(2)} exceeds the €${maxNonPremiumCharge} limit. Upgrade to Premium for unlimited runs.`;
    } else if (subscriptionCount < 1) {
      canRun = false;
      message = 'Add at least 1 subscription to activate USW';
    } else {
      message = 'USW is ready to activate! Your subscriptions will be consolidated into one monthly payment.';
    }

    // Calculate next run date (first of next month)
    const nextRunDate = new Date();
    nextRunDate.setMonth(nextRunDate.getMonth() + 1);
    nextRunDate.setDate(1);
    nextRunDate.setHours(0, 0, 0, 0);

    return {
      subscriptionTotal: monthlyTotal,
      mulahFee,
      totalCharge,
      isPremium,
      canRun,
      message,
      nextRunDate: nextRunDate.toISOString().split('T')[0],
      breakdown: {
        monthly: monthlyTotal,
        yearly: yearlyTotal,
        weekly: weeklyTotal,
        subscriptionCount,
      },
    };
  }

  /**
   * Calculate Mulah fees based on subscription total and count
   */
  static calculateMulahFees(total: number, subscriptionCount: number): number {
    const baseFee = 2.99; // Base monthly fee
    const perSubscriptionFee = 0.49; // Per subscription fee
    const additionalSubscriptionFee = Math.max(0, subscriptionCount - 5) * perSubscriptionFee;
    
    return baseFee + additionalSubscriptionFee;
  }

  /**
   * Initiate monthly fund collection from user's bank account
   */
  static async collectMonthlyFunds(userId: string, amount: number): Promise<USWTransaction> {
    // TODO: Integrate with Open Banking API to collect funds
    // This would typically involve:
    // 1. Create payment initiation request
    // 2. Redirect user to bank for authorization
    // 3. Process payment when authorized
    
    const transaction: USWTransaction = {
      id: `usw_collect_${Date.now()}`,
      userId,
      amount,
      type: 'collection',
      status: 'pending',
      createdAt: new Date(),
    };

    // TODO: Store transaction in database
    console.log('USW Fund Collection initiated:', transaction);
    
    return transaction;
  }

  /**
   * Disburse funds to virtual cards for subscription payments
   */
  static async disburseFunds(userId: string, subscriptions: Subscription[]): Promise<USWTransaction[]> {
    const disbursements: USWTransaction[] = [];

    for (const subscription of subscriptions) {
      const cost = typeof subscription.cost === 'string' ? parseFloat(subscription.cost) : subscription.cost;
      const monthlyCost = subscription.billingCycle === 'yearly' 
        ? cost / 12 
        : cost;

      const transaction: USWTransaction = {
        id: `usw_disburse_${subscription.id}_${Date.now()}`,
        userId,
        amount: monthlyCost,
        type: 'disbursement',
        status: 'pending',
        subscriptionId: subscription.id,
        createdAt: new Date(),
      };

      // TODO: Transfer funds to virtual card for this subscription
      // This would integrate with Stripe Issuing API
      
      disbursements.push(transaction);
    }

    // TODO: Store transactions in database
    console.log('USW Fund Disbursements initiated:', disbursements);
    
    return disbursements;
  }

  /**
   * Get USW transaction history for a user
   */
  static async getTransactionHistory(userId: string): Promise<USWTransaction[]> {
    // TODO: Fetch from database
    return [];
  }

  /**
   * Check if user has sufficient balance for upcoming payments
   */
  static async checkBalance(userId: string): Promise<{ balance: number; upcoming: number; sufficient: boolean }> {
    // TODO: Check USW wallet balance and upcoming payment requirements
    return {
      balance: 0,
      upcoming: 0,
      sufficient: false,
    };
  }
}