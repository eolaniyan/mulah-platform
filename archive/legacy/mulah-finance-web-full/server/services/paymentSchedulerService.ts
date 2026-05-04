import type { Subscription } from '@shared/schema';

export interface ScheduledPayment {
  id: string;
  userId: string;
  subscriptionId: number;
  cardId: string;
  amount: number;
  scheduledDate: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  lastAttemptDate?: Date;
  nextRetryDate?: Date;
  failureReason?: string;
  createdAt: Date;
}

export interface RetryQueue {
  paymentId: string;
  retryCount: number;
  nextRetry: Date;
  backoffMultiplier: number;
}

/**
 * Payment Scheduler Service - Smart payment timing and retry logic
 */
export class PaymentSchedulerService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_INTERVALS = [2, 8, 24]; // Hours between retries

  /**
   * Schedule a payment for a subscription
   */
  static async schedulePayment(
    userId: string,
    subscription: Subscription,
    cardId: string
  ): Promise<ScheduledPayment> {
    const cost = typeof subscription.cost === 'string' ? parseFloat(subscription.cost) : subscription.cost;
    
    const payment: ScheduledPayment = {
      id: `payment_${Date.now()}`,
      userId,
      subscriptionId: subscription.id,
      cardId,
      amount: cost,
      scheduledDate: new Date(subscription.nextBillingDate),
      status: 'scheduled',
      attempts: 0,
      maxAttempts: this.MAX_RETRIES,
      createdAt: new Date(),
    };

    console.log('Payment scheduled:', payment);
    
    // TODO: Store payment in database
    // TODO: Add to payment queue/scheduler (using node-cron or Bull)
    
    return payment;
  }

  /**
   * Process scheduled payments (called by cron job)
   */
  static async processScheduledPayments(): Promise<void> {
    // TODO: Fetch payments due today from database
    const duePayments: ScheduledPayment[] = [];

    for (const payment of duePayments) {
      await this.executePayment(payment);
    }
  }

  /**
   * Execute a single payment
   */
  static async executePayment(payment: ScheduledPayment): Promise<boolean> {
    try {
      payment.status = 'processing';
      payment.attempts += 1;
      payment.lastAttemptDate = new Date();

      // TODO: Integrate with Stripe to process payment
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      
      /*
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount * 100, // Stripe uses cents
        currency: 'eur',
        payment_method: payment.cardId,
        confirm: true,
        metadata: {
          subscriptionId: payment.subscriptionId.toString(),
          userId: payment.userId,
        },
      });
      */

      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        payment.status = 'completed';
        console.log(`Payment ${payment.id} completed successfully`);
        
        // TODO: Update subscription next billing date
        // TODO: Send success notification to user
        
        return true;
      } else {
        throw new Error('Payment declined by card issuer');
      }
    } catch (error) {
      return await this.handlePaymentFailure(payment, error as Error);
    }
  }

  /**
   * Handle payment failure and queue for retry
   */
  static async handlePaymentFailure(payment: ScheduledPayment, error: Error): Promise<boolean> {
    payment.failureReason = error.message;

    if (payment.attempts < payment.maxAttempts) {
      // Schedule retry
      const retryInterval = this.RETRY_INTERVALS[payment.attempts - 1] || 24;
      payment.nextRetryDate = new Date(Date.now() + retryInterval * 60 * 60 * 1000);
      payment.status = 'retrying';

      console.log(`Payment ${payment.id} failed, retry scheduled for ${payment.nextRetryDate}`);
      
      // TODO: Add to retry queue
      await this.addToRetryQueue(payment);
      
      return false;
    } else {
      // Max retries reached, trigger BNPL fallback
      payment.status = 'failed';
      
      console.log(`Payment ${payment.id} failed permanently, triggering BNPL fallback`);
      
      // TODO: Trigger BufferService.initiateBNPL()
      // TODO: Notify user of failed payment
      
      return false;
    }
  }

  /**
   * Add payment to retry queue
   */
  static async addToRetryQueue(payment: ScheduledPayment): Promise<void> {
    const retryItem: RetryQueue = {
      paymentId: payment.id,
      retryCount: payment.attempts,
      nextRetry: payment.nextRetryDate!,
      backoffMultiplier: 2,
    };

    // TODO: Store in retry queue (Redis or database)
    console.log('Added to retry queue:', retryItem);
  }

  /**
   * Process retry queue (called by cron job)
   */
  static async processRetryQueue(): Promise<void> {
    // TODO: Fetch payments due for retry
    const retryPayments: ScheduledPayment[] = [];

    for (const payment of retryPayments) {
      await this.executePayment(payment);
    }
  }

  /**
   * Get payment status for subscription
   */
  static async getPaymentStatus(subscriptionId: number): Promise<ScheduledPayment | null> {
    // TODO: Fetch from database
    return null;
  }

  /**
   * Get upcoming payments for user
   */
  static async getUpcomingPayments(userId: string, days: number = 7): Promise<ScheduledPayment[]> {
    // TODO: Fetch payments scheduled within next N days
    return [];
  }

  /**
   * Cancel scheduled payment
   */
  static async cancelPayment(paymentId: string): Promise<boolean> {
    // TODO: Update payment status to cancelled
    console.log(`Payment ${paymentId} cancelled`);
    return true;
  }
}