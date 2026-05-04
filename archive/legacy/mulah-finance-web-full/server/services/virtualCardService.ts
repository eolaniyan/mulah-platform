import type { Subscription } from '@shared/schema';

export interface VirtualCard {
  id: string;
  userId: string;
  subscriptionId: number;
  stripeCardId: string;
  last4: string;
  brand: string;
  status: 'active' | 'inactive' | 'canceled';
  spendingLimit: number;
  availableBalance: number;
  merchantRestrictions: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  merchant: string;
  status: 'authorized' | 'pending' | 'completed' | 'declined';
  createdAt: Date;
  failureReason?: string;
}

export class VirtualCardService {
  /**
   * Create a new virtual card for a subscription
   */
  static async createCard(userId: string, subscription: Subscription): Promise<VirtualCard> {
    // TODO: Integrate with Stripe Issuing API
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // Calculate monthly spending limit
    const cost = typeof subscription.cost === 'string' ? parseFloat(subscription.cost) : subscription.cost;
    const monthlyLimit = subscription.billingCycle === 'yearly' 
      ? Math.ceil(cost / 12) + 5 // Add buffer
      : cost + 5;

    const card: VirtualCard = {
      id: `card_${Date.now()}`,
      userId,
      subscriptionId: subscription.id,
      stripeCardId: `card_stripe_${Date.now()}`, // Would come from Stripe
      last4: '1234', // Would come from Stripe
      brand: 'visa', // Would come from Stripe
      status: 'active',
      spendingLimit: monthlyLimit,
      availableBalance: 0,
      merchantRestrictions: [], // Could restrict to specific merchant
      createdAt: new Date(),
    };

    // TODO: Actual Stripe Issuing API call would be:
    /*
    const stripeCard = await stripe.issuing.cards.create({
      cardholder: cardholderFromUser,
      currency: subscription.currency.toLowerCase(),
      type: 'virtual',
      spending_controls: {
        spending_limits: [{
          amount: monthlyLimit * 100, // Stripe uses cents
          interval: 'monthly',
        }],
        allowed_categories: ['subscription_services'],
      },
      metadata: {
        userId,
        subscriptionId: subscription.id.toString(),
        subscriptionName: subscription.name,
      },
    });
    */

    console.log('Virtual card created:', card);
    
    // TODO: Store card in database
    return card;
  }

  /**
   * Fund a virtual card with money from USW
   */
  static async fundCard(cardId: string, amount: number): Promise<boolean> {
    // TODO: Transfer funds from USW wallet to virtual card
    // This would involve internal accounting within Stripe
    
    console.log(`Funding card ${cardId} with ${amount}`);
    
    // TODO: Update card balance in database
    return true;
  }

  /**
   * Suspend a virtual card (e.g., when subscription is canceled)
   */
  static async suspendCard(cardId: string): Promise<boolean> {
    // TODO: Update card status in Stripe
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.issuing.cards.update(cardId, {
      status: 'inactive'
    });
    */
    
    console.log(`Card ${cardId} suspended`);
    
    // TODO: Update card status in database
    return true;
  }

  /**
   * Get all virtual cards for a user
   */
  static async getUserCards(userId: string): Promise<VirtualCard[]> {
    // TODO: Fetch from database
    return [];
  }

  /**
   * Get card transaction history
   */
  static async getCardTransactions(cardId: string): Promise<CardTransaction[]> {
    // TODO: Fetch from Stripe and/or database
    return [];
  }

  /**
   * Handle payment retry when card has insufficient funds
   */
  static async retryPayment(cardId: string, amount: number): Promise<boolean> {
    // 1. Check if USW has sufficient funds
    // 2. Transfer funds to card
    // 3. Retry the payment
    
    console.log(`Retrying payment for card ${cardId}, amount: ${amount}`);
    
    // TODO: Implement retry logic with USW integration
    return false;
  }

  /**
   * Update card spending limits
   */
  static async updateSpendingLimit(cardId: string, newLimit: number): Promise<boolean> {
    // TODO: Update limits in Stripe
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.issuing.cards.update(cardId, {
      spending_controls: {
        spending_limits: [{
          amount: newLimit * 100,
          interval: 'monthly',
        }],
      },
    });
    */
    
    console.log(`Updated spending limit for card ${cardId} to ${newLimit}`);
    
    // TODO: Update in database
    return true;
  }

  /**
   * Get card details for subscription
   */
  static async getCardForSubscription(subscriptionId: number): Promise<VirtualCard | null> {
    // TODO: Fetch from database
    return null;
  }
}