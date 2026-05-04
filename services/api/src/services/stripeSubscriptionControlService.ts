import Stripe from 'stripe';
import { storage } from '../storage';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

interface ControlResult {
  success: boolean;
  action: 'cancel' | 'pause' | 'resume';
  status: 'completed' | 'pending' | 'failed';
  message: string;
  stripeSubscriptionId?: string;
  effectiveDate?: string;
  error?: string;
}

interface StripeSubscriptionInfo {
  subscriptionId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  pausedAt?: Date;
  productName?: string;
}

export class StripeSubscriptionControlService {
  private static isConfigured(): boolean {
    return !!stripe;
  }

  static async getSubscriptionByEmail(email: string): Promise<StripeSubscriptionInfo[] | null> {
    if (!this.isConfigured() || !stripe) {
      console.log('Stripe not configured - using mock data');
      return null;
    }

    try {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return null;
      }

      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all'
      });

      return subscriptions.data.map(sub => {
        const subAny = sub as any;
        return {
          subscriptionId: sub.id,
          customerId: customer.id,
          status: sub.status,
          currentPeriodEnd: new Date((subAny.current_period_end || Date.now() / 1000) * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          pausedAt: sub.pause_collection?.resumes_at 
            ? new Date(sub.pause_collection.resumes_at * 1000)
            : undefined,
          productName: sub.items.data[0]?.price?.product 
            ? typeof sub.items.data[0].price.product === 'string' 
              ? undefined 
              : (sub.items.data[0].price.product as Stripe.Product).name
            : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching Stripe subscriptions:', error);
      return null;
    }
  }

  static async cancelSubscription(
    stripeSubscriptionId: string, 
    atPeriodEnd: boolean = true
  ): Promise<ControlResult> {
    if (!this.isConfigured() || !stripe) {
      return {
        success: false,
        action: 'cancel',
        status: 'failed',
        message: 'Stripe integration not configured',
        error: 'STRIPE_NOT_CONFIGURED'
      };
    }

    try {
      let subscription: Stripe.Subscription;

      if (atPeriodEnd) {
        subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      } else {
        subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
      }

      const subAny = subscription as any;
      const periodEnd = subAny.current_period_end || Math.floor(Date.now() / 1000);
      const effectiveDate = atPeriodEnd 
        ? new Date(periodEnd * 1000).toISOString()
        : new Date().toISOString();

      return {
        success: true,
        action: 'cancel',
        status: 'completed',
        message: atPeriodEnd 
          ? `Subscription will be cancelled at the end of the billing period (${new Date(periodEnd * 1000).toLocaleDateString()})`
          : 'Subscription has been cancelled immediately',
        stripeSubscriptionId,
        effectiveDate
      };
    } catch (error: any) {
      console.error('Error cancelling Stripe subscription:', error);
      return {
        success: false,
        action: 'cancel',
        status: 'failed',
        message: 'Failed to cancel subscription',
        error: error.message
      };
    }
  }

  static async pauseSubscription(
    stripeSubscriptionId: string,
    resumeDate?: Date
  ): Promise<ControlResult> {
    if (!this.isConfigured() || !stripe) {
      return {
        success: false,
        action: 'pause',
        status: 'failed',
        message: 'Stripe integration not configured',
        error: 'STRIPE_NOT_CONFIGURED'
      };
    }

    try {
      const pauseCollection: Stripe.SubscriptionUpdateParams.PauseCollection = {
        behavior: 'void'
      };

      if (resumeDate) {
        pauseCollection.resumes_at = Math.floor(resumeDate.getTime() / 1000);
      }

      const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        pause_collection: pauseCollection
      });

      return {
        success: true,
        action: 'pause',
        status: 'completed',
        message: resumeDate 
          ? `Subscription paused until ${resumeDate.toLocaleDateString()}`
          : 'Subscription has been paused indefinitely',
        stripeSubscriptionId,
        effectiveDate: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error pausing Stripe subscription:', error);
      return {
        success: false,
        action: 'pause',
        status: 'failed',
        message: 'Failed to pause subscription. Note: Not all Stripe subscriptions support pausing.',
        error: error.message
      };
    }
  }

  static async resumeSubscription(stripeSubscriptionId: string): Promise<ControlResult> {
    if (!this.isConfigured() || !stripe) {
      return {
        success: false,
        action: 'resume',
        status: 'failed',
        message: 'Stripe integration not configured',
        error: 'STRIPE_NOT_CONFIGURED'
      };
    }

    try {
      const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        pause_collection: ''
      });

      return {
        success: true,
        action: 'resume',
        status: 'completed',
        message: 'Subscription has been resumed',
        stripeSubscriptionId,
        effectiveDate: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error resuming Stripe subscription:', error);
      return {
        success: false,
        action: 'resume',
        status: 'failed',
        message: 'Failed to resume subscription',
        error: error.message
      };
    }
  }

  static async reactivateSubscription(stripeSubscriptionId: string): Promise<ControlResult> {
    if (!this.isConfigured() || !stripe) {
      return {
        success: false,
        action: 'resume',
        status: 'failed',
        message: 'Stripe integration not configured',
        error: 'STRIPE_NOT_CONFIGURED'
      };
    }

    try {
      const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      return {
        success: true,
        action: 'resume',
        status: 'completed',
        message: 'Subscription cancellation has been reversed - it will continue normally',
        stripeSubscriptionId,
        effectiveDate: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error reactivating Stripe subscription:', error);
      return {
        success: false,
        action: 'resume',
        status: 'failed',
        message: 'Failed to reactivate subscription',
        error: error.message
      };
    }
  }

  static async getSubscriptionDetails(stripeSubscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.isConfigured() || !stripe) {
      return null;
    }

    try {
      return await stripe.subscriptions.retrieve(stripeSubscriptionId);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
  }
}

export interface APIConnectorConfig {
  provider: 'stripe' | 'chargebee' | 'recurly' | 'paddle';
  credentials?: Record<string, string>;
}

export class APIConnectorService {
  private static connectors: Map<string, APIConnectorConfig> = new Map();

  static registerConnector(serviceSlug: string, config: APIConnectorConfig): void {
    this.connectors.set(serviceSlug, config);
  }

  static async executeAction(
    serviceSlug: string,
    action: 'cancel' | 'pause' | 'resume',
    params: {
      userEmail?: string;
      externalSubscriptionId?: string;
      atPeriodEnd?: boolean;
      resumeDate?: Date;
    }
  ): Promise<ControlResult> {
    const config = this.connectors.get(serviceSlug);
    
    if (!config) {
      return {
        success: false,
        action,
        status: 'failed',
        message: 'No API connector configured for this service',
        error: 'CONNECTOR_NOT_FOUND'
      };
    }

    switch (config.provider) {
      case 'stripe':
        if (!params.externalSubscriptionId) {
          return {
            success: false,
            action,
            status: 'failed',
            message: 'Stripe subscription ID is required',
            error: 'MISSING_SUBSCRIPTION_ID'
          };
        }

        switch (action) {
          case 'cancel':
            return StripeSubscriptionControlService.cancelSubscription(
              params.externalSubscriptionId,
              params.atPeriodEnd ?? true
            );
          case 'pause':
            return StripeSubscriptionControlService.pauseSubscription(
              params.externalSubscriptionId,
              params.resumeDate
            );
          case 'resume':
            return StripeSubscriptionControlService.resumeSubscription(
              params.externalSubscriptionId
            );
        }

      case 'chargebee':
      case 'recurly':
      case 'paddle':
        return {
          success: false,
          action,
          status: 'failed',
          message: `${config.provider} integration coming soon`,
          error: 'PROVIDER_NOT_IMPLEMENTED'
        };

      default:
        return {
          success: false,
          action,
          status: 'failed',
          message: 'Unknown API provider',
          error: 'UNKNOWN_PROVIDER'
        };
    }
  }

  static getSupportedProviders(): string[] {
    return ['stripe', 'chargebee', 'recurly', 'paddle'];
  }
}

const API_ENABLED_SERVICES: Record<string, APIConnectorConfig> = {
  'notion': { provider: 'stripe' },
  'figma': { provider: 'stripe' },
  'linear': { provider: 'stripe' },
  'vercel': { provider: 'stripe' },
  'netlify': { provider: 'stripe' },
  'render': { provider: 'stripe' },
  'supabase': { provider: 'stripe' },
  'planetscale': { provider: 'stripe' },
  'railway': { provider: 'stripe' },
  'fly': { provider: 'stripe' },
  'ghost': { provider: 'stripe' },
  'beehiiv': { provider: 'stripe' },
  'convertkit': { provider: 'stripe' },
  'mailerlite': { provider: 'stripe' },
  'buttondown': { provider: 'stripe' },
  'cal': { provider: 'stripe' },
  'calendly': { provider: 'stripe' },
  'loom': { provider: 'stripe' },
  'pitch': { provider: 'stripe' },
  'miro': { provider: 'stripe' },
};

for (const [slug, config] of Object.entries(API_ENABLED_SERVICES)) {
  APIConnectorService.registerConnector(slug, config);
}

export { StripeSubscriptionControlService as default };
