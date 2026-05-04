import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSubscriptionSchema, 
  insertWaitlistSchema, 
  insertVirtualCardSchema,
  insertBankConnectionSchema,
  insertBudgetSchema,
  insertSupportCaseSchema,
  insertSupportMessageSchema,
  insertProactiveAlertSchema,
  insertConciergeRequestSchema,
  insertHouseholdBillSchema,
  type Subscription,
  type VirtualCard,
  type BankConnection,
  type BankTransaction,
  type BufferTransaction,
  type AIInsight,
  type Budget,
  type SupportCase,
  type NewSupportCase,
  type SupportMessage,
  type ProactiveAlert,
  type ServiceDirectory,
  type ConciergeRequest,
  type HouseholdBill
} from "@shared/schema";
import { z } from "zod";
import { USWService, VirtualCardService, MeshService, BufferService, PaymentSchedulerService, WebhookService, CategorizationService, CFAService, SubscriptionDetectionService, DEFAULT_CATEGORIES, APIConnectorService } from "./services";
import { IRISBrain } from "./iris/IRISBrain";
import { MonitoringService } from "./iris/MonitoringService";
// Helper function to calculate plan savings from already-fetched service plans (avoids N+1 queries)
function calculatePlanSavingsFromPlans(currentMonthlyPrice: number, plans: { name: string; monthlyPrice: string | null }[]): { cheaperPlans: { plan: string; yearlySavings: number }[] } {
  if (!plans || plans.length === 0) return { cheaperPlans: [] };
  
  const cheaperPlans = plans
    .filter(plan => {
      const planMonthlyPrice = parseFloat(plan.monthlyPrice || '0');
      return planMonthlyPrice > 0 && planMonthlyPrice < currentMonthlyPrice;
    })
    .map(plan => ({
      plan: plan.name,
      yearlySavings: (currentMonthlyPrice - parseFloat(plan.monthlyPrice || '0')) * 12
    }))
    .sort((a, b) => b.yearlySavings - a.yearlySavings);
  
  return { cheaperPlans };
}

// Helper function for next month date
function getNextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

// Mock insights generator
function generateMockInsights(subscriptions: Subscription[], totalMonthly: number) {
  const categoryBreakdown = subscriptions.reduce((acc, sub) => {
    const cost = parseFloat(sub.cost);
    acc[sub.category] = (acc[sub.category] || 0) + (sub.billingCycle === 'yearly' ? cost / 12 : cost);
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)[0];
  
  return {
    monthlySpend: Math.round(totalMonthly * 100) / 100,
    topCategory: topCategory ? topCategory[0] : 'None',
    topCategoryAmount: topCategory ? Math.round(topCategory[1] * 100) / 100 : 0,
    subscriptionCount: subscriptions.length,
    insights: [
      {
        type: 'spending',
        message: `You're spending €${totalMonthly.toFixed(2)} monthly on subscriptions`,
        priority: 'medium'
      },
      {
        type: 'category',
        message: topCategory ? `${topCategory[0]} is your biggest expense at €${topCategory[1].toFixed(2)}/month` : 'Add subscriptions to see insights',
        priority: 'low'
      },
      {
        type: 'optimization',
        message: subscriptions.length > 3 ? 'Consider USW to simplify your billing' : 'Track more subscriptions for better insights',
        priority: 'high'
      }
    ],
    recommendations: [
      subscriptions.length > 5 ? 'Review overlapping services for potential savings' : null,
      totalMonthly > 50 ? 'Consider upgrading to Premium for included USW runs' : null,
      'Set up billing date synchronization with Mulah Mesh'
    ].filter(Boolean)
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize IRIS Brain and Monitoring
  const irisBrain = IRISBrain.getInstance();
  const monitoringService = MonitoringService.getInstance();
  
  // Start monitoring
  monitoringService.startMonitoring();
  
  // Add IRIS monitoring middleware to all routes
  app.use(monitoringService.apiMonitoringMiddleware());
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding completion endpoint
  app.post('/api/auth/onboarding-complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUser(userId, {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      });
      res.json(user);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Subscription routes
  app.get('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSubscriptionSchema.parse(req.body);
      
      const subscription = await storage.createSubscription({
        ...validatedData,
        userId
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.put('/api/subscriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.id);
      const validatedData = insertSubscriptionSchema.partial().parse(req.body);
      
      const subscription = await storage.updateSubscription(subscriptionId, userId, validatedData);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Smart delete - control-method-aware deletion
  // For Mulah Merchants: cancels the subscription AND removes from list
  // For External: only archives (removes from list) without canceling
  app.delete('/api/subscriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.id);
      const forceCancel = req.query.forceCancel === 'true';
      
      // Get subscription first to check control method
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Look up service info to determine control method
      const serviceInfo = await storage.getServiceByName(subscription.name);
      const controlMethod = serviceInfo?.controlMethod || 'self_service';
      
      let result: { action: 'cancelled_and_deleted' | 'archived_only' | 'deleted'; controlMethod: string; cancellationUrl?: string; serviceName: string };
      
      if (controlMethod === 'mulah_merchant') {
        // Mulah Merchant: Full control - cancel and delete
        await storage.updateSubscription(subscriptionId, userId, { status: 'cancelled' });
        await storage.deleteSubscription(subscriptionId, userId);
        result = { 
          action: 'cancelled_and_deleted', 
          controlMethod,
          serviceName: subscription.name
        };
      } else if (forceCancel && (controlMethod === 'api')) {
        // API-enabled service with force cancel: Update status to cancelled and delete
        await storage.updateSubscription(subscriptionId, userId, { status: 'cancelled' });
        await storage.deleteSubscription(subscriptionId, userId);
        result = { 
          action: 'cancelled_and_deleted', 
          controlMethod,
          serviceName: subscription.name
        };
      } else {
        // External service (API without force, self_service, concierge): Archive only
        await storage.updateSubscription(subscriptionId, userId, { archivedAt: new Date() });
        result = { 
          action: 'archived_only', 
          controlMethod,
          cancellationUrl: serviceInfo?.cancellationUrl || undefined,
          serviceName: subscription.name
        };
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Check if a subscription is eligible for family sharing
  app.get('/api/subscriptions/:id/family-eligibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.id);
      
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      const eligibility = await storage.checkPlanFamilyEligibility(
        subscription.name,
        subscription.planTier
      );
      
      res.json({
        subscriptionId,
        subscriptionName: subscription.name,
        planTier: subscription.planTier,
        isEligible: eligibility.isEligible,
        maxMembers: eligibility.maxMembers,
        suggestion: !eligibility.isEligible 
          ? "Consider upgrading to a family plan to enable cost-splitting with family members."
          : null
      });
    } catch (error) {
      console.error("Error checking family eligibility:", error);
      res.status(500).json({ message: "Failed to check eligibility" });
    }
  });

  // Delete all subscriptions (for testing)
  app.delete('/api/subscriptions/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteAllSubscriptions(userId);
      res.json({ message: "All subscriptions deleted successfully" });
    } catch (error) {
      console.error("Error deleting all subscriptions:", error);
      res.status(500).json({ message: "Failed to delete all subscriptions" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const total = await storage.getMonthlyTotal(userId, year, month);
      res.json({ total, year, month });
    } catch (error) {
      console.error("Error fetching monthly analytics:", error);
      res.status(500).json({ message: "Failed to fetch monthly analytics" });
    }
  });

  app.get('/api/analytics/annual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      const total = await storage.getAnnualTotal(userId, year);
      res.json({ total, year });
    } catch (error) {
      console.error("Error fetching annual analytics:", error);
      res.status(500).json({ message: "Failed to fetch annual analytics" });
    }
  });

  app.get('/api/analytics/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getSubscriptionsByCategory(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ message: "Failed to fetch category analytics" });
    }
  });

  // Monthly due subscriptions count - uses centralized storage method
  app.get('/api/analytics/monthly-due', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Use centralized method for consistent calculations
      const dueThisMonth = await storage.getSubscriptionsDueInMonth(userId, currentYear, currentMonth);
      
      res.json({ count: dueThisMonth.length, month: currentMonth, year: currentYear });
    } catch (error) {
      console.error("Error fetching monthly due count:", error);
      res.status(500).json({ message: "Failed to fetch monthly due count" });
    }
  });
  
  // Unified billing summary - single source of truth for Dashboard and Calendar
  app.get('/api/billing/monthly-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      // Use centralized method for consistent calculations
      const dueThisMonth = await storage.getSubscriptionsDueInMonth(userId, year, month);
      const totalDue = dueThisMonth.reduce((sum, sub) => sum + Number(sub.cost), 0);
      
      // Group by control method for UI display (auto-pay vs needs attention)
      const autoPayBills = dueThisMonth.filter(sub => 
        sub.controlMethod === 'mulah_merchant' || sub.controlMethod === 'api'
      );
      const needsAttentionBills = dueThisMonth.filter(sub => 
        sub.controlMethod === 'self_service' || sub.controlMethod === 'concierge' || !sub.controlMethod
      );
      
      res.json({ 
        totalDue,
        billCount: dueThisMonth.length,
        autoPayCount: autoPayBills.length,
        needsAttentionCount: needsAttentionBills.length,
        bills: dueThisMonth.map(sub => ({
          id: sub.id,
          name: sub.name,
          cost: Number(sub.cost),
          nextBillingDate: sub.nextBillingDate,
          billingCycle: sub.billingCycle,
          category: sub.category,
          status: sub.status || 'active',
          controlMethod: sub.controlMethod || 'self_service',
          iconColor: sub.iconColor,
          iconName: sub.iconName
        })),
        autoPayBills: autoPayBills.map(sub => ({
          id: sub.id,
          name: sub.name,
          cost: Number(sub.cost),
          nextBillingDate: sub.nextBillingDate,
          controlMethod: sub.controlMethod
        })),
        needsAttentionBills: needsAttentionBills.map(sub => ({
          id: sub.id,
          name: sub.name,
          cost: Number(sub.cost),
          nextBillingDate: sub.nextBillingDate,
          controlMethod: sub.controlMethod || 'self_service'
        })),
        month,
        year
      });
    } catch (error) {
      console.error("Error fetching monthly billing summary:", error);
      res.status(500).json({ message: "Failed to fetch billing summary" });
    }
  });

  app.get('/api/analytics/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      
      const upcoming = await storage.getUpcomingRenewals(userId, days);
      res.json(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming renewals:", error);
      res.status(500).json({ message: "Failed to fetch upcoming renewals" });
    }
  });

  // Waitlist routes
  app.post('/api/waitlist', async (req, res) => {
    try {
      const validatedData = insertWaitlistSchema.parse(req.body);
      const userId = (req as any).user?.claims?.sub;
      
      const signup = await storage.addToWaitlist({
        ...validatedData,
        userId
      });
      
      res.status(201).json(signup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address", errors: error.errors });
      }
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  app.get('/api/waitlist/count', async (req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
      res.status(500).json({ message: "Failed to fetch waitlist count" });
    }
  });

  // USW Routes
  app.get('/api/usw/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      const user = await storage.getUser(userId);
      const isPremium = user?.isPremium || false;
      
      const uswCalculation = await USWService.calculateUSWTotal(subscriptions, isPremium);
      
      res.json({
        ...uswCalculation,
        isPremium,
        canRun: isPremium || uswCalculation.canRun,
        message: isPremium ? "USW included in Premium - no fees!" : uswCalculation.message,
        nextRunDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      });
    } catch (error) {
      console.error("Error calculating USW:", error);
      res.status(500).json({ message: "Failed to calculate USW" });
    }
  });

  app.post('/api/usw/run', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      const user = await storage.getUser(userId);
      const isPremium = user?.isPremium || false;
      const isFirstRun = !user?.hasUsedUSW;
      
      // Use database-driven calculation via USWService
      const uswCalculation = await USWService.calculateUSWTotal(subscriptions, isPremium);
      
      // Check if user can run USW
      if (!uswCalculation.canRun) {
        return res.status(403).json({ 
          message: uswCalculation.message
        });
      }
      
      // Update user's USW usage tracking
      const newRunCount = (user?.uswRunCount || 0) + 1;
      await storage.updateUser(userId, {
        hasUsedUSW: true,
        uswRunCount: newRunCount,
        ...(isFirstRun ? { firstUSWRunAt: new Date() } : {})
      });
      
      // Simulate USW run (actual Stripe integration would go here)
      const runResult = {
        id: Date.now().toString(),
        userId,
        subscriptions: subscriptions.length,
        totalAmount: uswCalculation.subscriptionTotal,
        mulahFee: uswCalculation.mulahFee,
        totalCharged: uswCalculation.totalCharge,
        status: 'simulated',
        runDate: new Date().toISOString(),
        nextRunDate: uswCalculation.nextRunDate,
        breakdown: uswCalculation.breakdown,
        runNumber: newRunCount
      };
      
      res.json({
        success: true,
        run: runResult,
        isFirstRun,
        message: isPremium ? "USW run successful (Premium)" : "USW run successful - simulated mode"
      });
    } catch (error) {
      console.error("Error running USW:", error);
      res.status(500).json({ message: "Failed to run USW" });
    }
  });

  // Mock Insights endpoint
  app.get('/api/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const totalMonthly = subscriptions.reduce((sum: number, sub) => {
        const cost = parseFloat(sub.cost);
        if (sub.billingCycle === 'monthly') return sum + cost;
        if (sub.billingCycle === 'yearly') return sum + (cost / 12);
        if (sub.billingCycle === 'weekly') return sum + (cost * 4.33);
        return sum;
      }, 0);
      
      const insights = generateMockInsights(subscriptions, totalMonthly);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Demo data generation endpoint
  app.post('/api/demo/populate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }

      // Clear existing data (order matters for foreign keys)
      await storage.deleteAllBankTransactions(userId);
      await storage.deleteAllBankConnections(userId);
      await storage.deleteAllVirtualCards(userId);
      await storage.deleteAllSubscriptions(userId);

      // Create comprehensive demo subscriptions for USW testing
      // Spread billing dates across the next 30 days for calendar visibility
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      
      const demoSubscriptions = [
        {
          name: "Netflix",
          cost: "13.49",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "Standard Plan",
          iconColor: "#E50914",
          iconName: "fab fa-netflix",
          nextBillingDate: new Date(now + 2 * day), // Due in 2 days
          isActive: true,
          userId
        },
        {
          name: "Spotify",
          cost: "9.99",
          currency: "EUR", 
          billingCycle: "monthly" as const,
          category: "music",
          description: "Premium Individual",
          iconColor: "#1DB954",
          iconName: "fab fa-spotify",
          nextBillingDate: new Date(now + 5 * day), // Due in 5 days
          isActive: true,
          userId
        },
        {
          name: "Adobe Creative Cloud",
          cost: "59.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "design",
          description: "All Apps Plan",
          iconColor: "#FF0000",
          iconName: "fab fa-adobe",
          nextBillingDate: new Date(now + 8 * day),
          isActive: true,
          userId
        },
        {
          name: "GitHub Pro",
          cost: "48.00",
          currency: "EUR",
          billingCycle: "yearly" as const,
          category: "developer",
          description: "Pro Plan",
          iconColor: "#181717",
          iconName: "fab fa-github",
          nextBillingDate: new Date(now + 45 * day),
          isActive: true,
          userId
        },
        {
          name: "Dropbox Plus",
          cost: "9.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "cloud",
          description: "Plus Plan",
          iconColor: "#0061FF",
          iconName: "fab fa-dropbox",
          nextBillingDate: new Date(now + 1 * day), // Due tomorrow!
          isActive: true,
          userId
        },
        {
          name: "Disney+",
          cost: "8.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "Standard Plan",
          iconColor: "#113CCF",
          iconName: "fas fa-play",
          nextBillingDate: new Date(now + 12 * day),
          isActive: true,
          userId
        },
        {
          name: "Microsoft 365",
          cost: "99.00",
          currency: "EUR",
          billingCycle: "yearly" as const,
          category: "productivity",
          description: "Family Plan",
          iconColor: "#D83B01",
          iconName: "fab fa-microsoft",
          nextBillingDate: new Date(now + 90 * day),
          isActive: true,
          userId
        },
        {
          name: "YouTube Premium",
          cost: "11.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "Individual Plan",
          iconColor: "#FF0000",
          iconName: "fab fa-youtube",
          nextBillingDate: new Date(now + 3 * day), // Due in 3 days
          isActive: true,
          userId
        },
        {
          name: "ChatGPT Plus",
          cost: "20.00",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "productivity",
          description: "Plus Plan",
          iconColor: "#10A37F",
          iconName: "fas fa-robot",
          nextBillingDate: new Date(now + 7 * day),
          isActive: true,
          userId
        },
        {
          name: "iCloud+",
          cost: "2.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "cloud",
          description: "200GB Plan",
          iconColor: "#3693F3",
          iconName: "fab fa-apple",
          nextBillingDate: new Date(now + 14 * day),
          isActive: true,
          userId
        },
        {
          name: "Amazon Prime",
          cost: "89.90",
          currency: "EUR",
          billingCycle: "yearly" as const,
          category: "shopping",
          description: "Annual Membership",
          iconColor: "#FF9900",
          iconName: "fab fa-amazon",
          nextBillingDate: new Date(now + 120 * day),
          isActive: true,
          userId
        },
        {
          name: "Notion",
          cost: "8.00",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "productivity",
          description: "Personal Pro",
          iconColor: "#000000",
          iconName: "fas fa-file-alt",
          nextBillingDate: new Date(now + 18 * day),
          isActive: true,
          userId
        },
        {
          name: "Gym Plus",
          cost: "49.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "health",
          description: "Full Access - Mulah Merchant (Instant Control)",
          iconColor: "#22C55E",
          iconName: "fas fa-dumbbell",
          nextBillingDate: new Date(now + 10 * day),
          isActive: true,
          userId
        },
        {
          name: "Apple Music",
          cost: "10.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "Individual Plan - Concierge Required",
          iconColor: "#FC3C44",
          iconName: "fab fa-apple",
          nextBillingDate: new Date(now + 16 * day),
          isActive: true,
          userId
        },
        {
          name: "NordVPN",
          cost: "3.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "security",
          description: "Standard Plan",
          iconColor: "#4687FF",
          iconName: "fas fa-shield-alt",
          nextBillingDate: new Date(now + 21 * day),
          isActive: true,
          userId
        },
        // === DEMO SHOWCASE SUBSCRIPTIONS ===
        {
          name: "Mulah Pro",
          cost: "9.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "finance",
          description: "Mulah Merchant - Instant Control Demo",
          iconColor: "#14B8A6",
          iconName: "fas fa-bolt",
          nextBillingDate: new Date(now + 15 * day),
          isActive: true,
          userId
        },
        {
          name: "StreamFlix",
          cost: "15.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "API Connected - Sign-in Required",
          iconColor: "#8B5CF6",
          iconName: "fas fa-tv",
          nextBillingDate: new Date(now + 9 * day),
          isActive: true,
          userId
        },
        {
          name: "SkyShield Premium",
          cost: "199.99",
          currency: "EUR",
          billingCycle: "yearly" as const,
          category: "insurance",
          description: "Annual Plan - 60 Day Notice Required",
          iconColor: "#0EA5E9",
          iconName: "fas fa-shield-alt",
          nextBillingDate: new Date(now + 180 * day),
          isActive: true,
          userId
        },
        {
          name: "UnityHub Family",
          cost: "79.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "telecom",
          description: "Family Plan - 4 Lines",
          iconColor: "#F97316",
          iconName: "fas fa-users",
          nextBillingDate: new Date(now + 6 * day),
          isActive: true,
          userId
        },
        {
          name: "Pilates Loft Elite",
          cost: "149.00",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "fitness",
          description: "Unlimited Classes - Phone Cancellation Only",
          iconColor: "#EC4899",
          iconName: "fas fa-heart",
          nextBillingDate: new Date(now + 11 * day),
          isActive: true,
          userId
        },
        {
          name: "FusionStream Max",
          cost: "24.99",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "streaming",
          description: "Bundle: Disney+ / Hulu / ESPN+",
          iconColor: "#6366F1",
          iconName: "fas fa-layer-group",
          nextBillingDate: new Date(now + 4 * day),
          isActive: true,
          userId
        },
        {
          name: "TrialBox Creator",
          cost: "0.00",
          currency: "EUR",
          billingCycle: "monthly" as const,
          category: "software",
          description: "FREE TRIAL - Converts to €299/mo in 48h",
          iconColor: "#EF4444",
          iconName: "fas fa-clock",
          nextBillingDate: new Date(now + 2 * day),
          isActive: true,
          userId
        }
      ];

      // Create subscriptions
      const createdSubs = [];
      for (const sub of demoSubscriptions) {
        const created = await storage.createSubscription(sub);
        createdSubs.push(created);
      }

      // Create demo virtual cards for some subscriptions (use subscription IDs)
      const virtualCardData = [
        {
          userId,
          last4: '4532',
          stripeCardId: `vc_demo_${Date.now()}_1`,
          brand: 'visa',
          status: 'active',
          spendingLimit: '50.00',
          assignedToSubscription: createdSubs[0]?.id || null,
          merchantRestrictions: ['streaming'],
        },
        {
          userId,
          last4: '7891',
          stripeCardId: `vc_demo_${Date.now()}_2`,
          brand: 'mastercard',
          status: 'active',
          spendingLimit: '100.00',
          assignedToSubscription: createdSubs[2]?.id || null,
          merchantRestrictions: ['software', 'design'],
        }
      ];

      const createdCards = [];
      for (const card of virtualCardData) {
        const created = await storage.createVirtualCard(card);
        createdCards.push(created);
      }

      // Create demo bank connection
      const bankConnection = await storage.createBankConnection({
        userId,
        bankName: 'Demo Bank',
        accountType: 'checking',
        last4: '9876',
        openBankingId: `ob_demo_${Date.now()}`,
        isActive: true,
        lastSyncAt: new Date(),
      });

      // Create comprehensive demo bank transactions spread across 3 months
      // This ensures period filtering shows different data
      const month = 30 * day;
      const demoTransactions = [
        // === MONTH 1 (Current month - recent transactions) ===
        // Income - this month
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_income1`,
          amount: '-3500.00',
          currency: 'EUR',
          description: 'Salary Payment - December',
          merchantName: 'Employer GmbH',
          category: 'income',
          confidence: '0.99',
          transactionDate: new Date(now - 2 * day),
          isSubscriptionPayment: false,
          direction: 'in'
        },
        // Recent expenses (within 7 days)
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_recent1`,
          amount: '45.00',
          currency: 'EUR',
          description: 'Weekly Groceries',
          merchantName: 'REWE Supermarket',
          category: 'groceries',
          confidence: '0.88',
          transactionDate: new Date(now - 2 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_recent2`,
          amount: '25.00',
          currency: 'EUR',
          description: 'Dinner',
          merchantName: 'Restaurant',
          category: 'dining',
          confidence: '0.85',
          transactionDate: new Date(now - 4 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        // This month (8-30 days ago)
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m1_1`,
          amount: '13.49',
          currency: 'EUR',
          description: 'Netflix Subscription',
          merchantName: 'Netflix',
          category: 'streaming',
          confidence: '0.95',
          transactionDate: new Date(now - 15 * day),
          isSubscriptionPayment: true,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m1_2`,
          amount: '120.00',
          currency: 'EUR',
          description: 'Monthly Utilities',
          merchantName: 'Power Company',
          category: 'utilities',
          confidence: '0.95',
          transactionDate: new Date(now - 10 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m1_3`,
          amount: '85.00',
          currency: 'EUR',
          description: 'Groceries',
          merchantName: 'Lidl',
          category: 'groceries',
          confidence: '0.87',
          transactionDate: new Date(now - 12 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },

        // === MONTH 2 (31-60 days ago) ===
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_income2`,
          amount: '-3500.00',
          currency: 'EUR',
          description: 'Salary Payment - November',
          merchantName: 'Employer GmbH',
          category: 'income',
          confidence: '0.99',
          transactionDate: new Date(now - 1 * month - 5 * day),
          isSubscriptionPayment: false,
          direction: 'in'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m2_1`,
          amount: '13.49',
          currency: 'EUR',
          description: 'Netflix Subscription',
          merchantName: 'Netflix',
          category: 'streaming',
          confidence: '0.95',
          transactionDate: new Date(now - 1 * month - 15 * day),
          isSubscriptionPayment: true,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m2_2`,
          amount: '95.00',
          currency: 'EUR',
          description: 'Groceries',
          merchantName: 'REWE',
          category: 'groceries',
          confidence: '0.88',
          transactionDate: new Date(now - 1 * month - 10 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m2_3`,
          amount: '110.00',
          currency: 'EUR',
          description: 'Utilities',
          merchantName: 'Power Company',
          category: 'utilities',
          confidence: '0.95',
          transactionDate: new Date(now - 1 * month - 8 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m2_4`,
          amount: '60.00',
          currency: 'EUR',
          description: 'Dinner out',
          merchantName: 'Restaurant',
          category: 'dining',
          confidence: '0.85',
          transactionDate: new Date(now - 1 * month - 20 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },

        // === MONTH 3 (61-90 days ago) ===
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_income3`,
          amount: '-3400.00',
          currency: 'EUR',
          description: 'Salary Payment - October',
          merchantName: 'Employer GmbH',
          category: 'income',
          confidence: '0.99',
          transactionDate: new Date(now - 2 * month - 5 * day),
          isSubscriptionPayment: false,
          direction: 'in'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m3_1`,
          amount: '13.49',
          currency: 'EUR',
          description: 'Netflix Subscription',
          merchantName: 'Netflix',
          category: 'streaming',
          confidence: '0.95',
          transactionDate: new Date(now - 2 * month - 15 * day),
          isSubscriptionPayment: true,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m3_2`,
          amount: '88.00',
          currency: 'EUR',
          description: 'Groceries',
          merchantName: 'Aldi',
          category: 'groceries',
          confidence: '0.87',
          transactionDate: new Date(now - 2 * month - 12 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m3_3`,
          amount: '105.00',
          currency: 'EUR',
          description: 'Utilities',
          merchantName: 'Power Company',
          category: 'utilities',
          confidence: '0.95',
          transactionDate: new Date(now - 2 * month - 10 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        },
        {
          userId,
          bankConnectionId: bankConnection.id,
          transactionId: `txn_demo_${now}_m3_4`,
          amount: '45.00',
          currency: 'EUR',
          description: 'Shopping',
          merchantName: 'Amazon',
          category: 'shopping',
          confidence: '0.89',
          transactionDate: new Date(now - 2 * month - 18 * day),
          isSubscriptionPayment: false,
          direction: 'out'
        }
      ];

      const createdTransactions = [];
      for (const txn of demoTransactions) {
        const created = await storage.createBankTransaction(txn);
        createdTransactions.push(created);
      }

      res.json({ 
        success: true, 
        message: "Demo data populated successfully",
        data: {
          subscriptions: createdSubs.length,
          virtualCards: createdCards.length,
          bankConnections: 1,
          transactions: createdTransactions.length
        }
      });

    } catch (error) {
      console.error("Error populating demo data:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Demo data clear endpoint
  app.delete('/api/demo/clear', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }

      // Clear in correct order (respecting foreign key constraints)
      // 1. First delete bank transactions (references bank connections)
      await storage.deleteAllBankTransactions(userId);
      
      // 2. Delete bank connections
      await storage.deleteAllBankConnections(userId);
      
      // 3. Delete virtual cards (references subscriptions)
      await storage.deleteAllVirtualCards(userId);
      
      // 4. Finally delete subscriptions
      await storage.deleteAllSubscriptions(userId);
      
      res.json({ 
        success: true, 
        message: "All data cleared successfully"
      });

    } catch (error) {
      console.error("Error clearing demo data:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Test endpoints (development only)
  if (process.env.NODE_ENV === 'development') {

    // Test endpoint for USW calculation 
    app.post('/api/test/usw-calculation', async (req, res) => {
      try {
        const { subscriptions: testSubs, isPremium = false } = req.body;
        
        // Convert test data to proper format
        const subs = testSubs.map((sub: any) => ({
          ...sub,
          cost: sub.cost.toString()
        }));
        
        // Use database-driven calculation via USWService
        const calculation = await USWService.calculateUSWTotal(subs, isPremium);
        
        res.json({
          success: true,
          subscriptions: subs.length,
          calculation,
          testNotes: {
            scenario: subs.length <= 3 ? 'Basic USW' : 'Overage fees apply',
            expectedFee: calculation.mulahFee,
            breakdown: `${calculation.breakdown.monthly} monthly + ${calculation.breakdown.yearly} yearly prorated + ${calculation.breakdown.weekly} weekly prorated`
          }
        });
      } catch (error) {
        console.error("Error in test calculation:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    });
  }

  // ===== ENHANCED ANALYTICS API ROUTES =====
  
  // 1. AI-Powered Insights
  app.get("/api/analytics/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const insights = [
        {
          title: "Optimize Netflix Plan",
          description: "Switch to Basic plan to save €5/month",
          priority: "medium",
          actionable: true,
          savings: 60
        },
        {
          title: "Unused Subscription Detected",
          description: "Adobe Creative hasn't been used in 30 days",
          priority: "high",
          actionable: true,
          savings: 20.99
        },
        {
          title: "Budget Alert",
          description: "Entertainment spending is 80% of monthly limit",
          priority: "medium",
          actionable: false
        }
      ];
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // 2. 6-Month Spending Trends
  app.get("/api/analytics/spending-trends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const trends = [
        { month: "Aug 2025", total: "89.97", subscriptions: 4, change: -5.2 },
        { month: "Jul 2025", total: "94.96", subscriptions: 5, change: 12.3 },
        { month: "Jun 2025", total: "84.52", subscriptions: 4, change: -2.1 },
        { month: "May 2025", total: "86.40", subscriptions: 4, change: 8.7 },
        { month: "Apr 2025", total: "79.45", subscriptions: 3, change: -10.5 },
        { month: "Mar 2025", total: "88.82", subscriptions: 4, change: 5.8 }
      ];
      res.json(trends);
    } catch (error) {
      console.error("Error fetching spending trends:", error);
      res.status(500).json({ message: "Failed to fetch spending trends" });
    }
  });

  // 3. Category Breakdown Analysis
  app.get("/api/analytics/category-breakdown", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const breakdown = [
        { 
          name: "Entertainment", 
          amount: "39.97", 
          percentage: 44.4, 
          services: ["Netflix", "Spotify", "Disney+"] 
        },
        { 
          name: "Productivity", 
          amount: "29.99", 
          percentage: 33.3, 
          services: ["Microsoft 365", "Adobe Creative"] 
        },
        { 
          name: "Cloud Storage", 
          amount: "9.99", 
          percentage: 11.1, 
          services: ["Dropbox"] 
        },
        { 
          name: "Development", 
          amount: "10.02", 
          percentage: 11.2, 
          services: ["GitHub Pro"] 
        }
      ];
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ message: "Failed to fetch category breakdown" });
    }
  });

  // 4. AI Predictions & Recommendations
  app.get("/api/analytics/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const predictions = {
        yearTotal: "1079.64",
        potentialSavings: "240.00",
        recommendations: [
          {
            title: "Bundle Entertainment Services",
            description: "Disney+ Bundle saves 25% vs individual subscriptions",
            savings: 15.99
          },
          {
            title: "Annual Billing Discount",
            description: "Switch to yearly plans for 16% average savings",
            savings: 89.50
          },
          {
            title: "Student Plan Eligibility",
            description: "Qualify for student discounts on Spotify and Adobe",
            savings: 134.51
          }
        ]
      };
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  // =====================================================
  // CFA (Complex Finance Analyzer) Endpoints
  // =====================================================

  // Get CFA Summary - comprehensive financial insights
  app.get("/api/cfa/summary", isAuthenticated, async (req: any, res) => {
    // Prevent caching to ensure fresh insights data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const userId = req.user.claims.sub;
      const { from, to } = req.query;
      
      const transactions = await storage.getBankTransactions(userId);
      const subscriptions = await storage.getSubscriptions(userId);
      
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
      // Helper to safely parse cost
      const parseCost = (cost: string | number): number => {
        if (typeof cost === 'number') return cost;
        const cleaned = String(cost).replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      // Calculate subscription-based metrics
      let totalMonthlySubs = 0;
      const activeSubscriptions = subscriptions.filter(s => s.isActive);
      
      for (const sub of activeSubscriptions) {
        const cost = parseCost(sub.cost);
        const monthly = sub.billingCycle === 'yearly' ? cost / 12 : 
                       sub.billingCycle === 'weekly' ? cost * 4.33 : cost;
        totalMonthlySubs += monthly;
      }
      
      // If we have bank transactions, use CFAService for detailed analysis
      if (transactions.length > 0) {
        const summary = await CFAService.generateSummary(
          transactions,
          subscriptions,
          fromDate,
          toDate
        );
        
        // Transform CFAService output to match frontend expectations
        const cashflow = summary.cashflow;
        const savingsRate = cashflow.averageMonthlyIncome > 0 
          ? Math.round((cashflow.averageMonthlySurplus / cashflow.averageMonthlyIncome) * 100) 
          : 0;
        const subscriptionBurden = cashflow.averageMonthlyIncome > 0 
          ? Math.round((totalMonthlySubs / cashflow.averageMonthlyIncome) * 100) 
          : 33;
        
        // Calculate health score from CFAService data
        let healthScore = 70;
        if (cashflow.surplusDeficitStatus === 'deficit') healthScore -= 20;
        else if (cashflow.surplusDeficitStatus === 'surplus') healthScore += 10;
        if (subscriptionBurden > 30) healthScore -= 15;
        if (summary.riskSignals.length > 3) healthScore -= 10;
        healthScore = Math.max(0, Math.min(100, healthScore));
        
        let riskLevel = 'low';
        if (healthScore < 40) riskLevel = 'critical';
        else if (healthScore < 60) riskLevel = 'high';
        else if (healthScore < 75) riskLevel = 'moderate';
        
        // Convert risk signals to insights with contextual actions
        const getActionForSignal = (signalType: string): string => {
          if (signalType.includes('subscription') || signalType.includes('recurring')) {
            return 'Review Subscriptions';
          }
          if (signalType.includes('spending') || signalType.includes('expense')) {
            return 'View Cashflow';
          }
          if (signalType.includes('income') || signalType.includes('cashflow')) {
            return 'View Cashflow';
          }
          return 'Review Subscriptions';
        };
        
        // Helper to generate rich details for each signal type
        const getDetailsForSignal = (signal: any, subs: any[], totalSubs: number, burden: number) => {
          const avgCost = totalSubs > 0 ? totalMonthlySubs / totalSubs : 0;
          
          if (signal.type === 'high_subscription_ratio') {
            const targetBurden = 15;
            const excessPercent = burden - targetBurden;
            const excessMonthly = (excessPercent / 100) * cashflow.averageMonthlyIncome;
            return {
              headline: 'Subscriptions taking too much of your income',
              whyItMatters: 'Financial experts recommend keeping recurring subscriptions under 15-20% of income. This leaves room for savings and unexpected expenses.',
              comparison: { yours: burden, recommended: targetBurden, difference: excessPercent },
              potentialSavings: {
                monthly: Math.round(excessMonthly),
                yearly: Math.round(excessMonthly * 12),
                tangible: excessMonthly > 50 ? `That's €${Math.round(excessMonthly * 12)}/year you could save or invest!` : 'Every bit adds up!'
              },
              recommendation: 'Review each subscription and ask: "Is this worth X% of my income?"',
              steps: [
                'Sort subscriptions by cost (highest first)',
                'Identify services you use less than weekly',
                'Cancel or downgrade unused services',
                'Set a subscription budget limit'
              ]
            };
          }
          
          if (signal.type === 'subscription_overload') {
            const lowestCostSubs = [...subs]
              .filter(s => parseCost(s.cost) > 0)
              .sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
              .slice(0, 3);
            return {
              headline: `Managing ${totalSubs} subscriptions is complex`,
              whyItMatters: 'Studies show most people actively use only 3-5 subscriptions regularly. Too many leads to forgotten payments and unused services.',
              services: lowestCostSubs.map(s => ({
                name: s.name,
                monthlyCost: s.billingCycle === 'yearly' ? Math.round(parseCost(s.cost) / 12 * 100) / 100 : parseCost(s.cost)
              })),
              potentialSavings: {
                monthly: Math.round(avgCost * 2),
                yearly: Math.round(avgCost * 2 * 12),
                tangible: `Cutting 2 subscriptions could save €${Math.round(avgCost * 2 * 12)}/year`
              },
              recommendation: 'Do a subscription audit: "Did I use this in the last 30 days?"',
              steps: [
                'List all your subscriptions',
                'Mark which ones you used this month',
                'Cancel the ones you haven\'t touched',
                'Review quarterly'
              ]
            };
          }
          
          if (signal.type === 'monthly_deficit') {
            return {
              headline: 'You\'re spending more than you earn',
              whyItMatters: 'Running a deficit means you\'re either using savings or going into debt. This isn\'t sustainable long-term.',
              recommendation: 'Focus on reducing your largest expense categories or finding additional income.',
              steps: [
                'Review your biggest spending categories',
                'Identify non-essential expenses to cut',
                'Look for subscription downgrades',
                'Consider ways to increase income'
              ]
            };
          }
          
          if (signal.type === 'low_savings_rate') {
            return {
              headline: 'Your savings rate is below recommended',
              whyItMatters: 'Financial experts recommend saving at least 20% of income. Low savings leaves you vulnerable to unexpected expenses.',
              recommendation: 'Automate savings by transferring a fixed amount each payday.',
              steps: [
                'Calculate your current savings rate',
                'Set up automatic transfers to savings',
                'Start small and increase gradually',
                'Track progress monthly'
              ]
            };
          }
          
          return {
            headline: 'Financial insight detected',
            whyItMatters: 'This signal was flagged based on your spending patterns.',
            recommendation: 'Review your finances regularly to stay on track.'
          };
        };
        
        const insights: any[] = summary.riskSignals.map(signal => ({
          type: signal.severity === 'high' ? 'warning' : 'info',
          severity: signal.severity === 'high' ? 'warning' : 'info',
          title: signal.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: signal.message,
          action: getActionForSignal(signal.type),
          details: getDetailsForSignal(signal, subscriptions, subscriptions.length, subscriptionBurden)
        }));
        
        // Add subscription-specific insights (only if no similar insight exists)
        const hasSubscriptionInsight = insights.some(i => 
          i.title.toLowerCase().includes('subscription') || 
          i.description.toLowerCase().includes('subscription')
        );
        if (subscriptions.length > 10 && !hasSubscriptionInsight) {
          const avgCost = totalMonthlySubs / subscriptions.length;
          insights.push({
            type: 'info',
            severity: 'info',
            title: 'Many Active Subscriptions',
            description: `You have ${subscriptions.length} subscriptions. Review by category to find savings.`,
            action: 'View by Category',
            details: {
              headline: `Managing ${subscriptions.length} subscriptions is complex`,
              whyItMatters: 'Most people only actively use 3-5 subscriptions. The rest often go unused.',
              potentialSavings: {
                monthly: Math.round(avgCost * 2),
                yearly: Math.round(avgCost * 2 * 12),
                tangible: `Cutting 2 could save €${Math.round(avgCost * 2 * 12)}/year`
              },
              recommendation: 'Review by category to spot overlapping services.',
              steps: ['Group subscriptions by category', 'Identify overlaps', 'Keep your favorites', 'Cancel the rest']
            }
          });
        }
        
        // Add recommendation insights if no risk signals
        if (insights.length === 0 && summary.recommendations.length > 0) {
          summary.recommendations.slice(0, 3).forEach(rec => {
            const action = rec.toLowerCase().includes('subscription') ? 'Review Subscriptions' : 'View Cashflow';
            insights.push({
              type: 'success',
              severity: 'success',
              title: 'Recommendation',
              description: rec,
              action,
              details: {
                headline: 'Personalized recommendation',
                whyItMatters: 'This suggestion is based on your spending patterns.',
                recommendation: rec
              }
            });
          });
        }
        
        const patterns = [
          { name: 'Subscription Creep', description: summary.patterns.subscriptionCreep ? 'Detected increasing subscriptions' : 'Stable', trend: summary.patterns.subscriptionCreep ? 'up' : 'stable' },
          { name: 'Fixed Costs', description: summary.patterns.highFixedCosts ? 'High fixed costs detected' : 'Manageable', trend: summary.patterns.highFixedCosts ? 'up' : 'stable' }
        ];
        
        const resilience = {
          emergencyFundMonths: Math.round(cashflow.averageMonthlySurplus > 0 ? 3 : 1),
          incomeStability: summary.patterns.irregularIncome ? 50 : 80,
          expenseFlexibility: Math.max(30, 100 - subscriptionBurden)
        };
        
        return res.json({
          healthScore,
          riskLevel,
          savingsRate,
          subscriptionBurden,
          monthlyNetIncome: cashflow.averageMonthlySurplus,
          insights,
          patterns,
          resilience
        });
      }
      
      // Fallback: Generate subscription-based metrics when no transactions
      if (subscriptions.length === 0) {
        return res.json({
          healthScore: 0,
          riskLevel: 'low',
          savingsRate: 0,
          subscriptionBurden: 0,
          monthlyNetIncome: 0,
          insights: [],
          patterns: [],
          resilience: { emergencyFundMonths: 0, incomeStability: 0, expenseFlexibility: 0 }
        });
      }
      
      // Subscription-only metrics
      const estimatedIncome = totalMonthlySubs * 3;
      const savingsRate = estimatedIncome > 0 
        ? Math.round(((estimatedIncome - totalMonthlySubs) / estimatedIncome) * 100) 
        : 0;
      const subscriptionBurden = estimatedIncome > 0 
        ? Math.round((totalMonthlySubs / estimatedIncome) * 100) 
        : 33;
      
      let healthScore = 70;
      if (subscriptionBurden > 30) healthScore -= 15;
      else if (subscriptionBurden > 20) healthScore -= 5;
      if (savingsRate > 20) healthScore += 10;
      else if (savingsRate < 10) healthScore -= 10;
      if (subscriptions.length > 15) healthScore -= 10;
      else if (subscriptions.length > 10) healthScore -= 5;
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      let riskLevel = 'low';
      if (healthScore < 40) riskLevel = 'critical';
      else if (healthScore < 60) riskLevel = 'high';
      else if (healthScore < 75) riskLevel = 'moderate';
      
      // Analyze subscriptions by category for overlap detection
      // (reusing parseCost from outer scope)
      const categoryGroups: Record<string, Array<{ name: string; cost: number; billingCycle: string }>> = {};
      subscriptions.forEach(sub => {
        const cat = sub.category || 'other';
        if (!categoryGroups[cat]) categoryGroups[cat] = [];
        categoryGroups[cat].push({
          name: sub.name,
          cost: parseCost(sub.cost),
          billingCycle: sub.billingCycle || 'monthly'
        });
      });
      
      // Find categories with potential overlaps (2+ services in same category)
      const overlappingCategories = Object.entries(categoryGroups)
        .filter(([_, subs]) => subs.length >= 2)
        .map(([category, subs]) => ({
          category,
          count: subs.length,
          services: subs,
          totalMonthly: subs.reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost), 0),
          potentialSavings: subs.length > 1 ? subs.slice(1).reduce((sum, s) => sum + (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost), 0) : 0
        }))
        .sort((a, b) => b.potentialSavings - a.potentialSavings);
      
      const yearlyCount = subscriptions.filter(s => s.billingCycle === 'yearly').length;
      const monthlyCount = subscriptions.filter(s => s.billingCycle === 'monthly').length;
      const monthlyOnlyTotal = subscriptions
        .filter(s => s.billingCycle === 'monthly')
        .reduce((sum, s) => sum + parseCost(s.cost), 0);
      const potentialAnnualSavings = Math.round(monthlyOnlyTotal * 12 * 0.16); // ~16% savings with annual
      
      // Build rich, data-driven insights
      const insights: any[] = [];
      
      // Insight 1: Category overlap detection with specific data
      if (overlappingCategories.length > 0) {
        const topOverlap = overlappingCategories[0];
        const serviceNames = topOverlap.services.map(s => s.name).join(', ');
        const monthlyTotal = Math.round(topOverlap.totalMonthly * 100) / 100;
        const yearlySavings = Math.round(topOverlap.potentialSavings * 12 * 100) / 100;
        
        insights.push({
          type: 'warning',
          severity: 'warning',
          title: `${topOverlap.count} ${topOverlap.category.charAt(0).toUpperCase() + topOverlap.category.slice(1)} Services`,
          description: `You're paying for ${serviceNames} (€${monthlyTotal}/mo). Keeping just one could save €${yearlySavings}/year.`,
          action: 'See Which Ones',
          // Rich data for expandable detail
          details: {
            headline: `Multiple ${topOverlap.category} subscriptions detected`,
            whyItMatters: `Having ${topOverlap.count} services in the same category often means overlapping features. Most people use only 1-2 regularly.`,
            services: topOverlap.services.map(s => ({
              name: s.name,
              monthlyCost: s.billingCycle === 'yearly' ? Math.round(s.cost / 12 * 100) / 100 : s.cost
            })),
            potentialSavings: {
              monthly: Math.round(topOverlap.potentialSavings * 100) / 100,
              yearly: yearlySavings,
              tangible: yearlySavings > 150 ? `That's a weekend getaway!` : yearlySavings > 50 ? `That's ${Math.floor(yearlySavings / 25)} nice dinners out!` : `That's ${Math.floor(yearlySavings / 5)} coffees!`
            },
            recommendation: `Review which ${topOverlap.category} service you use most, and consider pausing the others.`
          }
        });
      }
      
      // Insight 2: Subscription burden with benchmark comparison
      const healthyBurden = 15; // 15% is recommended benchmark
      if (subscriptionBurden > 20) {
        const excessPercent = subscriptionBurden - healthyBurden;
        const excessMonthly = Math.round((excessPercent / 100) * estimatedIncome * 100) / 100;
        const excessYearly = Math.round(excessMonthly * 12 * 100) / 100;
        
        insights.push({
          type: 'info',
          severity: subscriptionBurden > 30 ? 'warning' : 'info',
          title: 'Above Recommended Budget',
          description: `${subscriptionBurden}% of income on subscriptions vs. recommended 15%. That's €${excessMonthly}/mo (€${excessYearly}/yr) above target.`,
          action: 'See Breakdown',
          details: {
            headline: 'Subscription spending above healthy range',
            whyItMatters: 'Financial experts recommend keeping recurring subscriptions under 15% of income. This leaves room for savings, emergencies, and flexibility.',
            comparison: {
              yours: subscriptionBurden,
              recommended: healthyBurden,
              difference: excessPercent
            },
            potentialSavings: {
              monthly: excessMonthly,
              yearly: excessYearly,
              tangible: excessYearly > 200 ? `That could fund a vacation fund!` : `That's extra savings every month.`
            },
            recommendation: 'Look for subscriptions you rarely use or could downgrade to cheaper plans.'
          }
        });
      }
      
      // Insight 3: Annual billing opportunity with real numbers
      if (monthlyCount >= 3 && potentialAnnualSavings > 20) {
        const topMonthly = subscriptions
          .filter(s => s.billingCycle === 'monthly')
          .sort((a, b) => parseCost(b.cost) - parseCost(a.cost))
          .slice(0, 3);
        
        insights.push({
          type: 'success',
          severity: 'info',
          title: `Save ~€${potentialAnnualSavings}/Year`,
          description: `${monthlyCount} subscriptions on monthly billing. Annual plans typically save 16% - that's real money back in your pocket.`,
          action: 'Show Me How',
          details: {
            headline: 'Switch to annual billing for instant savings',
            whyItMatters: 'Most services offer 10-20% discount for annual vs monthly. You pay upfront but save significantly.',
            eligibleSubscriptions: topMonthly.map(s => ({
              name: s.name,
              currentMonthly: parseCost(s.cost),
              annualEquivalent: Math.round(parseCost(s.cost) * 0.84 * 100) / 100,
              yearlySavings: Math.round(parseCost(s.cost) * 12 * 0.16 * 100) / 100
            })),
            potentialSavings: {
              yearly: potentialAnnualSavings,
              tangible: potentialAnnualSavings > 100 ? `That's ${Math.floor(potentialAnnualSavings / 15)} months of a streaming service - free!` : `Every bit adds up!`
            },
            recommendation: 'Check each service for annual billing options. Start with your most expensive subscriptions for biggest impact.',
            steps: [
              'Identify subscriptions you know you\'ll keep',
              'Check their website for annual pricing',
              'Switch when your monthly billing renews',
              'Enjoy the savings!'
            ]
          }
        });
      }
      
      // Insight 4: Subscription overload (too many subscriptions)
      if (subscriptions.length > 10) {
        const sortedByCost = [...subscriptions]
          .sort((a, b) => parseCost(b.cost) - parseCost(a.cost));
        const lowestCostSubs = [...subscriptions]
          .filter(s => parseCost(s.cost) > 0)
          .sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
          .slice(0, 3);
        const avgCost = totalMonthlySubs / subscriptions.length;
        
        insights.push({
          type: 'info',
          severity: subscriptions.length > 15 ? 'warning' : 'info',
          title: 'Subscription Overload',
          description: `You have ${subscriptions.length} active subscriptions - consider consolidating`,
          action: 'Review Subscriptions',
          details: {
            headline: `Managing ${subscriptions.length} subscriptions is complex`,
            whyItMatters: 'Studies show most people actively use only 3-5 subscriptions regularly. Having too many leads to forgotten payments and unused services.',
            services: lowestCostSubs.map(s => ({
              name: s.name,
              monthlyCost: s.billingCycle === 'yearly' ? Math.round(parseCost(s.cost) / 12 * 100) / 100 : parseCost(s.cost)
            })),
            comparison: {
              yours: subscriptions.length,
              recommended: 8,
              difference: subscriptions.length - 8
            },
            potentialSavings: {
              monthly: Math.round(avgCost * 2 * 100) / 100,
              yearly: Math.round(avgCost * 2 * 12 * 100) / 100,
              tangible: `Cutting 2 subscriptions could save €${Math.round(avgCost * 2 * 12)}/year`
            },
            recommendation: 'Do a subscription audit: ask yourself "Did I use this in the last 30 days?" for each one.',
            steps: [
              'List all your subscriptions (you\'re already doing this!)',
              'Mark which ones you used in the last month',
              'Cancel or pause the ones you haven\'t touched',
              'Set calendar reminders to review quarterly'
            ]
          }
        });
      }
      
      // Fallback: Healthy finances insight
      if (insights.length === 0) {
        insights.push({
          type: 'success',
          severity: 'success',
          title: 'Great Job!',
          description: `${subscriptions.length} subscriptions at ${subscriptionBurden}% of income - well within healthy range.`,
          action: 'View Details',
          details: {
            headline: 'Your subscriptions are well-managed',
            whyItMatters: 'Keeping subscriptions under 15-20% of income leaves room for savings and flexibility.',
            recommendation: 'Keep an eye on new subscriptions and do a quarterly review to stay on track.'
          }
        });
      }
      
      const patterns = [
        { name: 'Subscription Trends', description: `${subscriptions.length} active subscriptions`, trend: 'stable' },
        { name: 'Billing Distribution', description: `${monthlyCount} monthly, ${yearlyCount} yearly`, trend: 'stable' }
      ];
      
      const resilience = {
        emergencyFundMonths: 3,
        incomeStability: 75,
        expenseFlexibility: Math.max(30, 100 - subscriptionBurden)
      };
      
      res.json({
        healthScore,
        riskLevel,
        savingsRate,
        subscriptionBurden,
        monthlyNetIncome: Math.round((estimatedIncome - totalMonthlySubs) * 100) / 100,
        insights,
        patterns,
        resilience
      });
    } catch (error) {
      console.error("Error generating CFA summary:", error);
      res.status(500).json({ message: "Failed to generate financial summary" });
    }
  });

  // =====================================================
  // Cashflow Analytics Endpoints  
  // =====================================================

  // Get cashflow data (income vs expenses)
  app.get("/api/analytics/cashflow", isAuthenticated, async (req: any, res) => {
    // Prevent caching so date range changes are reflected
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const userId = req.user.claims.sub;
      const { from, to, accountId } = req.query;
      
      const transactions = await storage.getBankTransactions(userId);
      const subscriptions = await storage.getSubscriptions(userId);
      
      // Filter by date range if provided
      let filtered = transactions;
      if (from) {
        const fromDate = new Date(from as string);
        filtered = filtered.filter(tx => new Date(tx.transactionDate) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to as string);
        filtered = filtered.filter(tx => new Date(tx.transactionDate) <= toDate);
      }
      if (accountId) {
        filtered = filtered.filter(tx => tx.bankConnectionId === parseInt(accountId as string));
      }
      
      // Calculate income and expenses from transactions
      let totalIncome = 0;
      let totalExpenses = 0;
      const expensesByCategory: Record<string, number> = {};
      
      for (const tx of filtered) {
        const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
        const direction = tx.direction || (amount < 0 ? 'in' : 'out');
        
        if (direction === 'in') {
          totalIncome += Math.abs(amount);
        } else {
          totalExpenses += Math.abs(amount);
          const category = tx.category || 'other';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(amount);
        }
      }
      
      // Helper to safely parse cost
      const parseCost = (cost: string | number): number => {
        if (typeof cost === 'number') return cost;
        const cleaned = String(cost).replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      // If no bank transactions, use subscription data with proportional costs based on period
      if (filtered.length === 0 && subscriptions.length > 0) {
        const fromDate = from ? new Date(from as string) : new Date();
        const toDate = to ? new Date(to as string) : new Date();
        
        // Calculate the number of days in the period
        const periodDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Calculate proportional subscription costs for ALL active subscriptions
        for (const sub of subscriptions) {
          if (!sub.isActive) continue;
          
          const cost = parseCost(sub.cost);
          const category = sub.category || 'subscriptions';
          
          // Calculate daily cost based on billing cycle
          let dailyCost = 0;
          if (sub.billingCycle === 'monthly') {
            dailyCost = cost / 30;
          } else if (sub.billingCycle === 'yearly') {
            dailyCost = cost / 365;
          } else if (sub.billingCycle === 'weekly') {
            dailyCost = cost / 7;
          } else {
            dailyCost = cost / 30; // default to monthly
          }
          
          // Calculate proportional cost for the period
          const periodCost = dailyCost * periodDays;
          
          totalExpenses += periodCost;
          expensesByCategory[category] = (expensesByCategory[category] || 0) + periodCost;
        }
        
        // Estimate income as 3x expenses (reasonable spending ratio assumption)
        totalIncome = totalExpenses * 3;
      }
      
      res.json({
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netCashflow: Math.round((totalIncome - totalExpenses) * 100) / 100,
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount: Math.round(amount * 100) / 100,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
        })).sort((a, b) => b.amount - a.amount),
        transactionCount: filtered.length || subscriptions.length,
        isSubscriptionBased: filtered.length === 0 && subscriptions.length > 0
      });
    } catch (error) {
      console.error("Error fetching cashflow:", error);
      res.status(500).json({ message: "Failed to fetch cashflow data" });
    }
  });

  // Get category totals with percentages
  app.get("/api/analytics/category-totals", isAuthenticated, async (req: any, res) => {
    // Prevent caching so date range changes are reflected
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const userId = req.user.claims.sub;
      const { from, to, accountId } = req.query;
      
      const transactions = await storage.getBankTransactions(userId);
      const subscriptions = await storage.getSubscriptions(userId);
      
      // Filter transactions
      let filtered = transactions;
      if (from) {
        const fromDate = new Date(from as string);
        filtered = filtered.filter(tx => new Date(tx.transactionDate) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to as string);
        filtered = filtered.filter(tx => new Date(tx.transactionDate) <= toDate);
      }
      if (accountId) {
        filtered = filtered.filter(tx => tx.bankConnectionId === parseInt(accountId as string));
      }
      
      // Group by category
      const categoryData: Record<string, { total: number; count: number; transactions: any[] }> = {};
      let grandTotal = 0;
      
      for (const tx of filtered) {
        const amount = Math.abs(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount);
        const direction = tx.direction || 'out';
        
        if (direction === 'out') {
          const category = tx.category || CategorizationService.categorizeTransaction(
            tx.description || '',
            tx.merchantName || undefined
          ).categorySlug;
          
          if (!categoryData[category]) {
            categoryData[category] = { total: 0, count: 0, transactions: [] };
          }
          categoryData[category].total += amount;
          categoryData[category].count += 1;
          grandTotal += amount;
        }
      }
      
      // Helper to safely parse cost
      const parseCostValue = (cost: string | number): number => {
        if (typeof cost === 'number') return cost;
        const cleaned = String(cost).replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      // If no transactions, use subscription data with proportional costs based on period
      if (filtered.length === 0 && subscriptions.length > 0) {
        const fromDate = from ? new Date(from as string) : new Date();
        const toDate = to ? new Date(to as string) : new Date();
        
        // Calculate the number of days in the period
        const periodDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        for (const sub of subscriptions) {
          if (!sub.isActive) continue;
          
          const cost = parseCostValue(sub.cost);
          const category = sub.category || 'subscriptions';
          
          // Calculate daily cost based on billing cycle
          let dailyCost = 0;
          if (sub.billingCycle === 'monthly') {
            dailyCost = cost / 30;
          } else if (sub.billingCycle === 'yearly') {
            dailyCost = cost / 365;
          } else if (sub.billingCycle === 'weekly') {
            dailyCost = cost / 7;
          } else {
            dailyCost = cost / 30;
          }
          
          // Calculate proportional cost for the period
          const periodCost = dailyCost * periodDays;
          
          if (!categoryData[category]) {
            categoryData[category] = { total: 0, count: 0, transactions: [] };
          }
          categoryData[category].total += periodCost;
          categoryData[category].count += 1;
          grandTotal += periodCost;
        }
      }
      
      const categories = DEFAULT_CATEGORIES;
      const result = Object.entries(categoryData)
        .map(([slug, data]) => {
          const cat = categories.find(c => c.slug === slug);
          return {
            category: cat?.name || slug,
            categorySlug: slug,
            icon: cat?.icon || 'fa-tag',
            color: cat?.color || '#6B7280',
            total: Math.round(data.total * 100) / 100,
            percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
            transactionCount: data.count
          };
        })
        .sort((a, b) => b.total - a.total);
      
      res.json({
        categories: result,
        grandTotal: Math.round(grandTotal * 100) / 100,
        transactionCount: filtered.length || subscriptions.length
      });
    } catch (error) {
      console.error("Error fetching category totals:", error);
      res.status(500).json({ message: "Failed to fetch category totals" });
    }
  });

  // =====================================================
  // Subscription Detection Endpoints
  // =====================================================

  // Detect potential subscriptions from transaction history
  app.post("/api/subscriptions/detect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const transactions = await storage.getBankTransactions(userId);
      const existingSubscriptions = await storage.getSubscriptions(userId);
      
      const detected = await SubscriptionDetectionService.detectSubscriptions(
        transactions,
        existingSubscriptions
      );
      
      res.json({
        detected,
        existingCount: existingSubscriptions.length,
        newSuggestions: detected.filter(d => !d.existingSubscriptionId).length
      });
    } catch (error) {
      console.error("Error detecting subscriptions:", error);
      res.status(500).json({ message: "Failed to detect subscriptions" });
    }
  });

  // Subscription Management Hub - returns subscriptions organized by urgency
  app.get("/api/subscriptions/management", isAuthenticated, async (req: any, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      if (!subscriptions || subscriptions.length === 0) {
        return res.json({
          critical: [],
          optimization: [],
          renewals: [],
          portfolio: [],
          totalMonthly: 0,
          potentialSavings: 0
        });
      }

      const now = new Date();
      
      // Calculate monthly cost for each subscription and lookup service info from database
      const subsWithMeta = await Promise.all(subscriptions.map(async (sub) => {
        const cost = parseFloat(sub.cost);
        const monthlyCost = sub.billingCycle === 'yearly' ? cost / 12 : 
                           sub.billingCycle === 'weekly' ? cost * 4.33 : cost;
        
        const nextBilling = new Date(sub.nextBillingDate);
        const daysUntilRenewal = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine recommended action based on various factors
        let urgencyScore = 0;
        let recommendedAction = 'keep';
        let reason = 'This subscription appears to be providing good value';
        let savingsImpact = 0;
        let isCritical = false;
        let isOptimization = false;
        
        // Try to find actual cheaper plans from database
        // Only show savings if user's current price matches a known plan (within €1 tolerance)
        const serviceInfo = await storage.getServiceByName(sub.name);
        const servicePlans = serviceInfo ? await storage.getServicePlansBySlug(serviceInfo.slug) : [];
        const PRICE_TOLERANCE = 1; // €1 tolerance for matching plans
        const matchingPlan = servicePlans.find(
          plan => Math.abs(parseFloat(plan.monthlyPrice || '0') - monthlyCost) <= PRICE_TOLERANCE
        );
        
        let realSavingsFromCatalog = 0;
        // Only calculate savings if we can identify their current plan
        if (serviceInfo && matchingPlan) {
          const planSavings = calculatePlanSavingsFromPlans(monthlyCost, servicePlans);
          if (planSavings.cheaperPlans.length > 0) {
            // Use the biggest savings from the cheapest available plan
            realSavingsFromCatalog = Math.round(planSavings.cheaperPlans[0].yearlySavings);
          }
        }
        
        // CRITICAL: Paused subscriptions should be cancelled
        // Only show full annual savings if we can verify the price matches a known plan
        if (sub.status === 'paused') {
          isCritical = true;
          urgencyScore = 8;
          recommendedAction = 'cancel';
          reason = 'Already paused - cancel to stop paying';
          // Only show full savings if service is in catalog AND price matches a known plan
          savingsImpact = (serviceInfo && matchingPlan) ? Math.round(monthlyCost * 12) : 0;
        }
        
        // CRITICAL: Very high cost subscriptions (>€40/mo)
        else if (monthlyCost >= 40) {
          isCritical = true;
          urgencyScore = 7;
          recommendedAction = 'review';
          reason = 'High-cost subscription - worth reviewing immediately';
          // Use real savings if available, otherwise 0 (can't assume savings without data)
          savingsImpact = realSavingsFromCatalog > 0 ? realSavingsFromCatalog : 0;
        }
        
        // CRITICAL: Renews in 3 days or less with cost >= €10
        else if (daysUntilRenewal <= 3 && monthlyCost >= 10) {
          isCritical = true;
          urgencyScore = 9;
          recommendedAction = 'review';
          reason = `Renews in ${daysUntilRenewal} days - decide before next charge`;
          savingsImpact = realSavingsFromCatalog > 0 ? realSavingsFromCatalog : 0;
        }
        
        // OPTIMIZATION: High cost (€20-40/mo)
        else if (monthlyCost >= 20) {
          isOptimization = true;
          urgencyScore = 5;
          recommendedAction = realSavingsFromCatalog > 0 ? 'downgrade' : 'review';
          reason = realSavingsFromCatalog > 0 
            ? `Cheaper plans available - save €${realSavingsFromCatalog}/year`
            : 'Moderate-high cost - ensure you use it enough';
          savingsImpact = realSavingsFromCatalog;
        }
        
        // OPTIMIZATION: Entertainment/streaming - often have cheaper tiers
        else if (['entertainment', 'streaming', 'media'].includes(sub.category?.toLowerCase() || '')) {
          isOptimization = true;
          urgencyScore = 4;
          recommendedAction = realSavingsFromCatalog > 0 ? 'downgrade' : 'review';
          reason = realSavingsFromCatalog > 0 
            ? `Cheaper tier available - save €${realSavingsFromCatalog}/year`
            : 'Check if a cheaper tier fits your needs';
          savingsImpact = realSavingsFromCatalog;
        }
        
        // OPTIMIZATION: Moderate cost (€10-20/mo)
        else if (monthlyCost >= 10) {
          isOptimization = true;
          urgencyScore = 3;
          recommendedAction = realSavingsFromCatalog > 0 ? 'downgrade' : 'review';
          reason = realSavingsFromCatalog > 0 
            ? `Save €${realSavingsFromCatalog}/year with a different plan`
            : 'Review periodically to ensure value';
          savingsImpact = realSavingsFromCatalog;
        }
        
        // Near-term renewals (7 days) bump urgency
        if (!isCritical && daysUntilRenewal <= 7) {
          urgencyScore = Math.max(urgencyScore, 6);
          if (monthlyCost >= 15) {
            reason = `Renews in ${daysUntilRenewal} days - decide now`;
          }
        }
        
        return {
          ...sub,
          urgencyScore,
          recommendedAction,
          savingsImpact,
          reason,
          daysUntilRenewal,
          monthlyCost,
          isCritical,
          isOptimization
        };
      }));
      
      // Sort all by urgency
      const sorted = [...subsWithMeta].sort((a, b) => b.urgencyScore - a.urgencyScore);
      
      // Categorize using explicit flags for reliability
      const critical = sorted.filter(s => s.isCritical || s.urgencyScore >= 7);
      
      // Optimization includes cancel/pause/downgrade/review/upgrade recommendations that aren't critical
      const optimization = sorted.filter(s => 
        !s.isCritical && 
        s.urgencyScore < 7 &&
        (s.isOptimization || ['cancel', 'pause', 'downgrade', 'review', 'upgrade'].includes(s.recommendedAction))
      );
      
      const renewals = sorted.filter(s => 
        s.daysUntilRenewal !== undefined && 
        s.daysUntilRenewal <= 14 &&
        s.daysUntilRenewal > 0
      );
      
      // Total monthly and potential savings
      const totalMonthly = Math.round(subsWithMeta.reduce((sum, s) => sum + s.monthlyCost, 0) * 100) / 100;
      const potentialSavings = Math.round(subsWithMeta.reduce((sum, s) => sum + s.savingsImpact, 0));
      
      res.json({
        critical,
        optimization,
        renewals,
        portfolio: sorted,
        totalMonthly,
        potentialSavings
      });
    } catch (error) {
      console.error("Error fetching subscription management data:", error);
      res.status(500).json({ message: "Failed to fetch management data" });
    }
  });

  // =====================================================
  // Categories Endpoints
  // =====================================================

  // Get all available categories
  app.get("/api/categories", async (req: any, res) => {
    try {
      const categories = DEFAULT_CATEGORIES.map((cat, index) => ({
        id: index + 1,
        ...cat,
        isSystem: true
      }));
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Categorize a single transaction
  app.post("/api/categorize", isAuthenticated, async (req: any, res) => {
    try {
      const { description, merchantName } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const result = CategorizationService.categorizeTransaction(description, merchantName);
      res.json(result);
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      res.status(500).json({ message: "Failed to categorize transaction" });
    }
  });

  // Budget Management
  app.get("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Return empty for now - will be populated with real budget data
      res.json([]);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetData = insertBudgetSchema.parse(req.body);
      
      const newBudget = {
        id: Date.now(),
        userId: userId,
        currentSpend: "0",
        ...budgetData,
        createdAt: new Date().toISOString()
      };
      res.json(newBudget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // BNPL Buffer Transactions
  app.get("/api/buffer-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Return empty for now - will be populated with real Klarna transactions
      res.json([]);
    } catch (error) {
      console.error("Error fetching buffer transactions:", error);
      res.status(500).json({ message: "Failed to fetch buffer transactions" });
    }
  });

  app.post("/api/buffer-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Integrate with Klarna API here
      const bufferTransaction = {
        id: Date.now(),
        userId: userId,
        subscriptionId: req.body.subscriptionId,
        amount: req.body.amount,
        provider: "klarna",
        status: "approved",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };
      res.json(bufferTransaction);
    } catch (error) {
      console.error("Error creating buffer transaction:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/buffer/providers", isAuthenticated, async (req: any, res) => {
    try {
      const providers = [
        {
          name: "Klarna",
          description: "Buy now, pay in 30 days",
          available: true
        },
        {
          name: "Afterpay",
          description: "Split into 4 payments",
          available: false
        }
      ];
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Bank Connections for Open Banking
  app.get("/api/bank-connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getBankConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching bank connections:", error);
      res.status(500).json({ message: "Failed to fetch bank connections" });
    }
  });

  app.post("/api/bank-connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankName, accountType } = req.body;
      
      // Generate mock connection details (in production, this would come from Open Banking)
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const openBankingId = `ob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const connectionData = {
        userId,
        bankName: bankName || 'Demo Bank',
        accountType: accountType || 'checking',
        last4,
        openBankingId,
        isActive: true,
        lastSyncAt: new Date(),
      };
      
      const connection = await storage.createBankConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating bank connection:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/bank-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getBankTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching bank transactions:", error);
      res.status(500).json({ message: "Failed to fetch bank transactions" });
    }
  });

  // ===== FINANCIAL MIDDLEWARE API ROUTES =====

  // Virtual Card Management Routes
  app.post('/api/virtual-cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { spendingLimit, assignedToSubscription, merchantRestrictions } = req.body;
      
      // Generate mock card details (in production, this would come from Stripe Issuing)
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const stripeCardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const cardData = {
        userId,
        stripeCardId,
        last4,
        brand: 'visa',
        status: 'active',
        spendingLimit: spendingLimit ? spendingLimit.toString() : null,
        merchantRestrictions: merchantRestrictions || [],
        assignedToSubscription: assignedToSubscription || null,
      };
      
      const card = await storage.createVirtualCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating virtual card:", error);
      res.status(500).json({ message: "Failed to create virtual card" });
    }
  });

  app.get('/api/virtual-cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cards = await storage.getVirtualCards(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching virtual cards:", error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  app.patch('/api/virtual-cards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      const updates = req.body;
      
      const card = await storage.updateVirtualCard(cardId, userId, updates);
      if (!card) {
        return res.status(404).json({ message: "Virtual card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error updating virtual card:", error);
      res.status(500).json({ message: "Failed to update virtual card" });
    }
  });

  app.delete('/api/virtual-cards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      
      await storage.deleteVirtualCard(cardId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting virtual card:", error);
      res.status(500).json({ message: "Failed to delete virtual card" });
    }
  });

  // USW Service Routes (Enhanced)
  app.post('/api/usw/collect-funds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      const transaction = await USWService.collectMonthlyFunds(userId, amount);
      res.json(transaction);
    } catch (error) {
      console.error("Error collecting USW funds:", error);
      res.status(500).json({ message: "Failed to collect funds" });
    }
  });

  app.post('/api/usw/disburse-funds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptions(userId);
      
      const disbursements = await USWService.disburseFunds(userId, subscriptions);
      res.json(disbursements);
    } catch (error) {
      console.error("Error disbursing USW funds:", error);
      res.status(500).json({ message: "Failed to disburse funds" });
    }
  });

  app.get('/api/usw/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await USWService.getTransactionHistory(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching USW transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Mulah Mesh (Merchant Sync) Routes
  app.post('/api/mesh/negotiate-anchor', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, requestedDate, reason } = req.body;
      const userId = req.user.claims.sub;
      
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      const currentDate = new Date(subscription.nextBillingDate).getDate();
      const request = {
        subscriptionId,
        currentDate,
        requestedDate,
        reason
      };
      
      const result = await MeshService.negotiateBillingAnchor(request);
      res.json(result);
    } catch (error) {
      console.error("Error negotiating billing anchor:", error);
      res.status(500).json({ message: "Failed to negotiate billing anchor" });
    }
  });

  app.get('/api/mesh/supported-merchants', async (req, res) => {
    try {
      const merchants = await MeshService.getSupportedMerchants();
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching supported merchants:", error);
      res.status(500).json({ message: "Failed to fetch supported merchants" });
    }
  });

  app.post('/api/mesh/bulk-reschedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetAnchor } = req.body;
      
      const subscriptions = await storage.getSubscriptions(userId);
      const results = await MeshService.bulkReschedule(subscriptions, targetAnchor);
      
      res.json(results);
    } catch (error) {
      console.error("Error bulk rescheduling:", error);
      res.status(500).json({ message: "Failed to bulk reschedule" });
    }
  });

  // Smart Buffer (BNPL) Routes
  app.post('/api/buffer/initiate-bnpl', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subscriptionId, amount } = req.body;
      
      const eligibility = await BufferService.checkBNPLEligibility(userId, amount);
      if (!eligibility.eligible) {
        return res.status(400).json({ 
          message: "BNPL not available", 
          reason: eligibility.reason 
        });
      }
      
      const transaction = await BufferService.initiateBNPL(userId, subscriptionId, amount);
      res.json(transaction);
    } catch (error) {
      console.error("Error initiating BNPL:", error);
      res.status(500).json({ message: "Failed to initiate BNPL" });
    }
  });

  app.get('/api/buffer/active-bnpl', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await BufferService.getActiveBNPL(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching active BNPL:", error);
      res.status(500).json({ message: "Failed to fetch active BNPL" });
    }
  });

  app.get('/api/buffer/exposure', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exposure = await BufferService.getTotalBNPLExposure(userId);
      res.json({ totalExposure: exposure });
    } catch (error) {
      console.error("Error fetching BNPL exposure:", error);
      res.status(500).json({ message: "Failed to fetch BNPL exposure" });
    }
  });

  // Payment Scheduler Routes
  app.get('/api/payments/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      
      const payments = await PaymentSchedulerService.getUpcomingPayments(userId, days);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching upcoming payments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming payments" });
    }
  });

  app.post('/api/payments/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subscriptionId, cardId } = req.body;
      
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      const payment = await PaymentSchedulerService.schedulePayment(userId, subscription, cardId);
      res.json(payment);
    } catch (error) {
      console.error("Error scheduling payment:", error);
      res.status(500).json({ message: "Failed to schedule payment" });
    }
  });

  // Webhook Routes
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      if (!WebhookService.verifyStripeSignature(payload, signature)) {
        return res.status(400).json({ message: "Invalid signature" });
      }
      
      const result = await WebhookService.processStripeWebhook(req.body);
      res.json({ received: true, processed: result.status === 'processed' });
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.post('/api/webhooks/klarna', async (req, res) => {
    try {
      const result = await WebhookService.processKlarnaWebhook(req.body);
      res.json({ received: true, processed: result.status === 'processed' });
    } catch (error) {
      console.error("Error processing Klarna webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.get('/api/webhooks/history', isAuthenticated, async (req, res) => {
    try {
      const source = req.query.source as string;
      const history = await WebhookService.getWebhookHistory(source);
      res.json(history);
    } catch (error) {
      console.error("Error fetching webhook history:", error);
      res.status(500).json({ message: "Failed to fetch webhook history" });
    }
  });

  // ===== IRIS BRAIN API ROUTES =====
  
  // Role-based access control middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // IRIS Navigation Help - available to all authenticated users
  app.get('/api/iris/navigation', isAuthenticated, async (req: any, res) => {
    try {
      const { currentPath, intent } = req.query;
      const navHelp = irisBrain.getNavigationHelp(
        currentPath as string || '/',
        intent as string | undefined
      );
      res.json(navHelp);
    } catch (error) {
      console.error("Error getting navigation help:", error);
      res.status(500).json({ message: "Failed to get navigation help" });
    }
  });

  // IRIS Question Answering - available to all authenticated users
  app.post('/api/iris/ask', isAuthenticated, async (req: any, res) => {
    try {
      const { question, currentPath, scrollPosition, recentActions } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const response = await irisBrain.answerUserQuestion(question, {
        currentPath: currentPath || '/',
        scrollPosition,
        recentActions
      });
      
      res.json(response);
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ message: "Failed to get answer" });
    }
  });

  // Get all navigation pages (for autocomplete/search)
  app.get('/api/iris/pages', isAuthenticated, async (req: any, res) => {
    try {
      res.json(irisBrain.navigationMap);
    } catch (error) {
      console.error("Error getting pages:", error);
      res.status(500).json({ message: "Failed to get pages" });
    }
  });

  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ message: "SuperAdmin access required" });
    }
    next();
  };

  // System Health Monitoring
  app.get('/api/iris/system-health', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const health = await irisBrain.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // AI Health Status
  app.get('/api/ai/health', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const aiHealth = {
        status: 'healthy',
        modelVersion: 'claude-sonnet-4-20250514',
        lastAnalysis: new Date(),
        analysisCount: irisBrain.getInsights().length,
        uptime: process.uptime(),
        apiKeyValid: !!process.env.ANTHROPIC_API_KEY
      };
      res.json(aiHealth);
    } catch (error) {
      console.error("Error fetching AI health:", error);
      res.status(500).json({ message: "Failed to fetch AI health" });
    }
  });

  // User Behavior Analysis
  app.post('/api/iris/analyze-behavior', isAuthenticated, async (req: any, res) => {
    try {
      const { actions, page, sessionDuration, patterns } = req.body;
      
      // Analyze behavior patterns using IRIS
      const analysis = await irisBrain.analyzeBehavior({
        userId: req.user.id,
        actions,
        page,
        sessionDuration,
        patterns,
        timestamp: new Date()
      });

      res.json({
        alerts: analysis.alerts || [],
        insights: analysis.insights || [],
        riskScore: analysis.riskScore || 0
      });
    } catch (error) {
      console.error('IRIS behavior analysis failed:', error);
      res.status(500).json({ 
        message: 'Failed to analyze behavior',
        alerts: [] // Return empty alerts on failure
      });
    }
  });

  // Error Analysis
  app.post('/api/ai/analyze-error', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { error, context } = req.body;
      const insight = await irisBrain.analyzeError(error, context);
      res.json(insight);
    } catch (error) {
      console.error("Error analyzing error:", error);
      res.status(500).json({ message: "Failed to analyze error" });
    }
  });

  // Predictive Analytics
  app.get('/api/ai/predictions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const predictions = await irisBrain.predictIssues();
      res.json(predictions);
    } catch (error) {
      console.error("Error getting predictions:", error);
      res.status(500).json({ message: "Failed to get predictions" });
    }
  });

  // AI Governance - Decisions
  app.get('/api/ai/governance/decisions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 25;
      const decisions = irisBrain.getDecisions(limit);
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching decisions:", error);
      res.status(500).json({ message: "Failed to fetch decisions" });
    }
  });

  app.post('/api/ai/governance/decisions/:id/approve', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const decisionId = req.params.id;
      const success = irisBrain.approveDecision(decisionId);
      if (success) {
        res.json({ success: true, message: "Decision approved" });
      } else {
        res.status(404).json({ message: "Decision not found" });
      }
    } catch (error) {
      console.error("Error approving decision:", error);
      res.status(500).json({ message: "Failed to approve decision" });
    }
  });

  app.post('/api/ai/governance/decisions/:id/reject', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const decisionId = req.params.id;
      const success = irisBrain.rejectDecision(decisionId);
      if (success) {
        res.json({ success: true, message: "Decision rejected" });
      } else {
        res.status(404).json({ message: "Decision not found" });
      }
    } catch (error) {
      console.error("Error rejecting decision:", error);
      res.status(500).json({ message: "Failed to reject decision" });
    }
  });

  // AI Governance Configuration
  app.get('/api/ai/governance/config', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const config = {
        autonomyLevel: 2, // Default to level 2 (recommend only)
        monitoringInterval: 30000,
        isMonitoring: true,
        emergencyStopEnabled: true,
        humanApprovalThreshold: 0.8,
        autoApprovalEnabled: false
      };
      res.json(config);
    } catch (error) {
      console.error("Error fetching governance config:", error);
      res.status(500).json({ message: "Failed to fetch governance config" });
    }
  });

  app.put('/api/ai/governance/config', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { autonomyLevel, monitoringInterval, autoApprovalEnabled } = req.body;
      
      // Validate autonomy level
      if (autonomyLevel && (autonomyLevel < 1 || autonomyLevel > 4)) {
        return res.status(400).json({ message: "Autonomy level must be between 1 and 4" });
      }
      
      const config = {
        autonomyLevel: autonomyLevel || 2,
        monitoringInterval: monitoringInterval || 30000,
        autoApprovalEnabled: autoApprovalEnabled || false,
        updated: new Date()
      };
      
      res.json({ success: true, config });
    } catch (error) {
      console.error("Error updating governance config:", error);
      res.status(500).json({ message: "Failed to update governance config" });
    }
  });

  // Emergency Stop
  app.post('/api/ai/governance/emergency-stop', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      irisBrain.emergencyStop();
      res.json({ success: true, message: "Emergency stop activated", timestamp: new Date() });
    } catch (error) {
      console.error("Error activating emergency stop:", error);
      res.status(500).json({ message: "Failed to activate emergency stop" });
    }
  });

  // System Diagnostics
  app.get('/api/iris/diagnostics/telemetry', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const events = irisBrain.getTelemetryEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching telemetry:", error);
      res.status(500).json({ message: "Failed to fetch telemetry" });
    }
  });

  app.get('/api/iris/diagnostics/insights', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const insights = irisBrain.getInsights(limit);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.post('/api/iris/diagnostics/run-check', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { checkType } = req.body;
      
      let result;
      switch (checkType) {
        case 'health':
          result = await irisBrain.getSystemHealth();
          break;
        case 'predictions':
          result = await irisBrain.predictIssues();
          break;
        case 'ai-analysis':
          result = await irisBrain.analyzeError({ type: 'test', message: 'System diagnostic test' });
          break;
        default:
          return res.status(400).json({ message: "Invalid check type" });
      }
      
      res.json({ success: true, result, timestamp: new Date() });
    } catch (error) {
      console.error("Error running diagnostic check:", error);
      res.status(500).json({ message: "Failed to run diagnostic check" });
    }
  });

  // System Alerts
  app.get('/api/iris/alerts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const criticalEvents = irisBrain.getTelemetryEvents(50).filter(e => e.severity === 'critical');
      const highPriorityInsights = irisBrain.getInsights(25).filter(i => i.priority === 'high' || i.priority === 'critical');
      
      const alerts = [
        ...criticalEvents.map(e => ({
          id: e.id,
          type: 'system_event',
          title: `Critical ${e.type}: ${e.category}`,
          message: e.data?.message || 'Critical system event detected',
          timestamp: e.timestamp,
          priority: 'critical'
        })),
        ...highPriorityInsights.map(i => ({
          id: i.id,
          type: 'ai_insight',
          title: i.title,
          message: i.description,
          timestamp: i.timestamp,
          priority: i.priority
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Manual Event Capture (for testing)
  app.post('/api/iris/events', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { type, severity, category, data } = req.body;
      
      irisBrain.captureEvent({
        type,
        severity,
        category,
        data: { ...data, manualCapture: true },
        userId: req.user.claims.sub
      });
      
      res.json({ success: true, message: "Event captured successfully" });
    } catch (error) {
      console.error("Error capturing manual event:", error);
      res.status(500).json({ message: "Failed to capture event" });
    }
  });

  // Support System Routes
  
  // Create support case
  app.post('/api/support/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Support case request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertSupportCaseSchema.parse(req.body);
      
      // Capture additional context
      const contextData = {
        ...validatedData,
        userId,
        userAgent: req.headers['user-agent'],
        pageContext: req.headers.referer || req.body.pageContext,
        systemState: {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          headers: req.headers
        }
      };
      
      const supportCase = await storage.createSupportCase(contextData);
      
      // Trigger IRIS analysis
      try {
        const irisAnalysis = await irisBrain.analyzeIssue({
          userId,
          caseId: supportCase.id,
          title: supportCase.title,
          description: supportCase.description,
          category: supportCase.category,
          systemState: contextData.systemState,
          userHistory: {
            subscriptions: await storage.getSubscriptions(userId),
            recentActivity: [] // Could be enhanced with actual activity
          }
        });
        
        // Update case with IRIS analysis
        if (irisAnalysis) {
          await storage.updateSupportCase(supportCase.id, {
            irisAnalysis: irisAnalysis as any,
            autoResolved: irisAnalysis.autoResolved || false
          });
        }
      } catch (irisError) {
        console.error("IRIS analysis failed:", irisError);
        // Continue without IRIS analysis
      }
      
      res.status(201).json(supportCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid support case data", errors: error.errors });
      }
      console.error("Error creating support case:", error);
      res.status(500).json({ message: "Failed to create support case" });
    }
  });

  // Get support cases for current user
  app.get('/api/support/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cases = await storage.getSupportCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching support cases:", error);
      res.status(500).json({ message: "Failed to fetch support cases" });
    }
  });

  // Get specific support case
  app.get('/api/support/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseId = parseInt(req.params.id);
      
      const supportCase = await storage.getSupportCase(caseId, userId);
      
      if (!supportCase) {
        return res.status(404).json({ message: "Support case not found" });
      }
      
      // Get case messages
      const messages = await storage.getSupportMessages(caseId);
      
      res.json({ ...supportCase, messages });
    } catch (error) {
      console.error("Error fetching support case:", error);
      res.status(500).json({ message: "Failed to fetch support case" });
    }
  });

  // Add message to support case
  app.post('/api/support/cases/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseId = parseInt(req.params.id);
      
      // Verify case access
      const supportCase = await storage.getSupportCase(caseId, userId);
      if (!supportCase) {
        return res.status(404).json({ message: "Support case not found" });
      }
      
      const validatedData = insertSupportMessageSchema.parse(req.body);
      
      const message = await storage.addSupportMessage({
        ...validatedData,
        caseId,
        authorId: userId,
        authorType: 'user'
      });
      
      // Update case status to in_progress if it was open
      if (supportCase.status === 'open') {
        await storage.updateSupportCase(caseId, { status: 'in_progress' });
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error adding support message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Update support case (admin only)
  app.put('/api/support/cases/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const updates = req.body;
      
      // Add resolution timestamp if status is being set to resolved/closed
      if ((updates.status === 'resolved' || updates.status === 'closed') && !updates.resolvedAt) {
        updates.resolvedAt = new Date();
      }
      
      const supportCase = await storage.updateSupportCase(caseId, updates);
      
      if (!supportCase) {
        return res.status(404).json({ message: "Support case not found" });
      }
      
      res.json(supportCase);
    } catch (error) {
      console.error("Error updating support case:", error);
      res.status(500).json({ message: "Failed to update support case" });
    }
  });

  // Create proactive alert
  app.post('/api/support/proactive-alert', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProactiveAlertSchema.parse(req.body);
      
      const alert = await storage.createProactiveAlert({
        ...validatedData,
        userId
      });
      
      // Check if this should trigger a support case
      if (alert.severity === 'high' && alert.alertType === 'repeated_attempts') {
        try {
          const supportCase = await storage.createSupportCase({
            userId,
            title: `Proactive Alert: ${alert.description}`,
            description: `System detected: ${alert.description}\n\nAlert Type: ${alert.alertType}\nSeverity: ${alert.severity}\nTrigger Data: ${JSON.stringify(alert.triggerData, null, 2)}`,
            category: 'technical',
            priority: alert.severity === 'high' ? 'high' : 'medium',
            source: 'proactive',
            systemState: alert.triggerData as any
          });
          
          // Alert linked to case (logged only)
          
          // Add IRIS analysis
          await irisBrain.analyzeIssue({
            userId,
            caseId: supportCase.id,
            title: supportCase.title,
            description: supportCase.description,
            category: supportCase.category,
            systemState: alert.triggerData,
            isProactive: true
          });
          
        } catch (caseError) {
          console.error("Error creating case from proactive alert:", caseError);
        }
      }
      
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error creating proactive alert:", error);
      res.status(500).json({ message: "Failed to create proactive alert" });
    }
  });

  // Get proactive alerts for current user
  app.get('/api/support/proactive-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getProactiveAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching proactive alerts:", error);
      res.status(500).json({ message: "Failed to fetch proactive alerts" });
    }
  });

  // Get current page context for support reporting
  app.get('/api/support/context', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Gather user context
      const user = await storage.getUser(userId);
      const subscriptions = await storage.getSubscriptions(userId);
      
      const context = {
        user: {
          id: user?.id,
          email: user?.email,
          accountCreated: user?.createdAt,
          isPremium: user?.isPremium
        },
        account: {
          subscriptionCount: subscriptions.length,
          monthlyTotal: subscriptions.reduce((sum, sub) => 
            sum + (sub.billingCycle === 'monthly' ? parseFloat(sub.cost) : 
                  sub.billingCycle === 'yearly' ? parseFloat(sub.cost) / 12 : 
                  parseFloat(sub.cost) * 4.33), 0),
          recentActivity: subscriptions.slice(0, 3)
        },
        system: {
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      };
      
      res.json(context);
    } catch (error) {
      console.error("Error gathering support context:", error);
      res.status(500).json({ message: "Failed to gather context" });
    }
  });

  // IRIS auto-analysis endpoint
  app.post('/api/support/iris-analyze', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { caseId, forceReanalysis } = req.body;
      
      const supportCase = await storage.getSupportCase(caseId);
      if (!supportCase) {
        return res.status(404).json({ message: "Support case not found" });
      }
      
      const analysis = await irisBrain.analyzeIssue({
        userId: supportCase.userId,
        caseId: supportCase.id,
        title: supportCase.title,
        description: supportCase.description,
        category: supportCase.category,
        systemState: supportCase.systemState,
        force: forceReanalysis
      });
      
      // Update case with analysis
      if (analysis) {
        await storage.updateSupportCase(caseId, {
          irisAnalysis: analysis as any,
          autoResolved: analysis.autoResolved || false
        });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error performing IRIS analysis:", error);
      res.status(500).json({ message: "Failed to perform IRIS analysis" });
    }
  });

  // ===== APP CONFIGURATION API =====
  
  // Get all public app configuration
  app.get('/api/config', async (req, res) => {
    try {
      const configs = await storage.getAllPublicConfig();
      const configMap: Record<string, any> = {};
      for (const config of configs) {
        configMap[config.key] = config.value;
      }
      res.json(configMap);
    } catch (error) {
      console.error("Error fetching app config:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });
  
  // Get specific config by key
  app.get('/api/config/:key', async (req, res) => {
    try {
      const config = await storage.getAppConfig(req.params.key);
      if (!config || !config.isPublic) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config.value);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // ===== SUBSCRIPTION CONTROL LAYER API =====

  // Service Directory - Get all services with control methods
  // Supports optional ?category=streaming filter
  app.get('/api/services', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let services = await storage.getServiceDirectory();
      
      // Filter by category if provided
      if (category) {
        services = services.filter(s => s.category === category);
      }
      
      res.json(services);
    } catch (error) {
      console.error("Error fetching service directory:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Service Directory - Get service by slug with plans
  app.get('/api/services/:slug', async (req, res) => {
    try {
      const service = await storage.getServiceBySlug(req.params.slug);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      // Fetch plans for this service
      const plans = await storage.getServicePlans(service.id);
      res.json({ ...service, plans });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });
  
  // Service Plans - Get plans for a service
  app.get('/api/services/:slug/plans', async (req, res) => {
    try {
      const plans = await storage.getServicePlansBySlug(req.params.slug);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching service plans:", error);
      res.status(500).json({ message: "Failed to fetch service plans" });
    }
  });

  // Service Directory - Match subscription to service
  app.get('/api/services/match/:subscriptionName', isAuthenticated, async (req, res) => {
    try {
      const service = await storage.getServiceByName(req.params.subscriptionName);
      res.json(service || null);
    } catch (error) {
      console.error("Error matching service:", error);
      res.status(500).json({ message: "Failed to match service" });
    }
  });

  // API Connection Management - For services with API control method
  app.get('/api/connections/:subscriptionId', isAuthenticated, async (req: any, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      const connection = await storage.getApiConnectionBySubscription(subscriptionId);
      res.json(connection || null);
    } catch (error) {
      console.error("Error getting connection:", error);
      res.status(500).json({ message: "Failed to get connection" });
    }
  });

  app.post('/api/connections/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subscriptionId, serviceSlug, email, password } = req.body;
      
      // Simulate OAuth/API connection (demo mode)
      // In production, this would redirect to actual OAuth flow
      const existingConnection = await storage.getApiConnectionBySubscription(subscriptionId);
      
      if (existingConnection) {
        // Update existing connection
        const updated = await storage.updateApiConnection(existingConnection.id, {
          status: 'connected',
          connectedEmail: email,
          lastSyncedAt: new Date(),
          metadata: { connectedAt: new Date().toISOString(), provider: serviceSlug }
        });
        return res.json({ success: true, connection: updated, message: 'Account connected successfully!' });
      }
      
      // Create new connection
      const connection = await storage.createApiConnection({
        userId,
        subscriptionId,
        serviceSlug,
        status: 'connected',
        connectedEmail: email,
        lastSyncedAt: new Date(),
        metadata: { connectedAt: new Date().toISOString(), provider: serviceSlug }
      });
      
      res.json({ success: true, connection, message: 'Account connected successfully!' });
    } catch (error) {
      console.error("Error connecting account:", error);
      res.status(500).json({ message: "Failed to connect account" });
    }
  });

  app.post('/api/connections/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId } = req.body;
      const connection = await storage.getApiConnectionBySubscription(subscriptionId);
      
      if (connection) {
        await storage.deleteApiConnection(connection.id);
      }
      
      res.json({ success: true, message: 'Account disconnected' });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });

  app.post('/api/connections/reset', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId } = req.body;
      const connection = await storage.getApiConnectionBySubscription(subscriptionId);
      
      if (connection) {
        await storage.deleteApiConnection(connection.id);
      }
      
      // Also reset any demo scenario state
      await storage.deleteDemoScenarioState(subscriptionId);
      
      res.json({ success: true, message: 'Demo reset - you can connect again!' });
    } catch (error) {
      console.error("Error resetting connection:", error);
      res.status(500).json({ message: "Failed to reset" });
    }
  });

  // Demo Scenario State API - For complex subscription scenarios
  app.get('/api/scenarios/:subscriptionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.subscriptionId);
      const state = await storage.getDemoScenarioState(userId, subscriptionId);
      res.json(state?.state || null);
    } catch (error) {
      console.error("Error getting scenario state:", error);
      res.status(500).json({ message: "Failed to get scenario state" });
    }
  });

  app.post('/api/scenarios/:subscriptionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.subscriptionId);
      const { scenarioType, state } = req.body;
      
      const result = await storage.createOrUpdateDemoScenarioState({
        userId,
        subscriptionId,
        scenarioType,
        state
      });
      
      res.json({ success: true, state: result.state });
    } catch (error) {
      console.error("Error saving scenario state:", error);
      res.status(500).json({ message: "Failed to save scenario state" });
    }
  });

  app.delete('/api/scenarios/:subscriptionId', isAuthenticated, async (req: any, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      await storage.deleteDemoScenarioState(subscriptionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario state:", error);
      res.status(500).json({ message: "Failed to delete scenario state" });
    }
  });

  // Concierge Requests - Create a cancellation/pause request
  app.post('/api/concierge/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertConciergeRequestSchema.parse(req.body);
      
      // Create the concierge request
      const request = await storage.createConciergeRequest({
        ...validatedData,
        userId,
      });
      
      // Log the control action
      await storage.createControlActionLog({
        userId,
        subscriptionId: validatedData.subscriptionId,
        conciergeRequestId: request.id,
        actionType: validatedData.requestType,
        controlMethod: 'concierge',
        status: 'pending',
      });
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating concierge request:", error);
      res.status(500).json({ message: "Failed to create concierge request" });
    }
  });

  // Concierge Requests - Get user's requests
  app.get('/api/concierge/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getConciergeRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching concierge requests:", error);
      res.status(500).json({ message: "Failed to fetch concierge requests" });
    }
  });

  // Concierge Requests - Get single request
  app.get('/api/concierge/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const request = await storage.getConciergeRequest(parseInt(req.params.id), userId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching concierge request:", error);
      res.status(500).json({ message: "Failed to fetch concierge request" });
    }
  });

  // Household Bills - Create a bill
  app.post('/api/household-bills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertHouseholdBillSchema.parse(req.body);
      
      const bill = await storage.createHouseholdBill({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(bill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bill data", errors: error.errors });
      }
      console.error("Error creating household bill:", error);
      res.status(500).json({ message: "Failed to create household bill" });
    }
  });

  // Household Bills - Get all bills
  app.get('/api/household-bills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bills = await storage.getHouseholdBills(userId);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching household bills:", error);
      res.status(500).json({ message: "Failed to fetch household bills" });
    }
  });

  // Household Bills - Update a bill
  app.patch('/api/household-bills/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bill = await storage.updateHouseholdBill(
        parseInt(req.params.id),
        userId,
        req.body
      );
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error updating household bill:", error);
      res.status(500).json({ message: "Failed to update household bill" });
    }
  });

  // Household Bills - Delete a bill
  app.delete('/api/household-bills/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteHouseholdBill(parseInt(req.params.id), userId);
      if (!deleted) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting household bill:", error);
      res.status(500).json({ message: "Failed to delete household bill" });
    }
  });

  // Control Action Logs - Get user's action history
  app.get('/api/control/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getControlActionLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching control history:", error);
      res.status(500).json({ message: "Failed to fetch control history" });
    }
  });

  // Subscription Control - Execute action based on service control method
  app.post('/api/subscriptions/:id/control', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptionId = parseInt(req.params.id);
      const { action, userEmail, accountInfo, method } = req.body; // action: 'cancel', 'pause', 'resume', 'mark_cancelled'
      
      // Get the subscription
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Handle mark_cancelled action (user self-service confirmation)
      if (action === 'mark_cancelled') {
        await storage.updateSubscription(subscriptionId, userId, {
          status: 'cancelled',
          isActive: false
        });
        
        await storage.createControlActionLog({
          userId,
          subscriptionId,
          actionType: 'cancel',
          controlMethod: 'self_service',
          status: 'completed',
        });
        
        return res.json({
          method: 'self_service',
          status: 'completed',
          message: `${subscription.name} has been marked as cancelled. It's been removed from your active subscriptions.`
        });
      }
      
      // Try to find matching service in directory
      const service = await storage.getServiceByName(subscription.name);
      
      let result: { method: string; status: string; message: string; requestId?: number } = {
        method: 'unknown',
        status: 'pending',
        message: ''
      };
      
      if (!service) {
        // Unknown service - create concierge request
        const conciergeRequest = await storage.createConciergeRequest({
          userId,
          subscriptionId,
          requestType: action,
          userEmail,
          userAccountInfo: accountInfo,
          status: 'pending',
          priority: 'normal',
        } as any);
        
        result = {
          method: 'concierge',
          status: 'pending',
          message: `We'll handle this ${action} for you. Our team will contact ${subscription.name} on your behalf within 24-48 hours.`,
          requestId: conciergeRequest.id
        };
      } else {
        switch (service.controlMethod) {
          case 'mulah_merchant':
            // Full control - can execute immediately
            await storage.updateSubscription(subscriptionId, userId, {
              status: action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'active',
              isActive: action !== 'cancel'
            });
            result = {
              method: 'mulah_merchant',
              status: 'completed',
              message: `${subscription.name} has been ${action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'resumed'} successfully.`
            };
            break;
            
          case 'api':
            // API control - integrate with Stripe/other APIs via connector service
            try {
              const apiResult = await APIConnectorService.executeAction(
                service.slug,
                action as 'cancel' | 'pause' | 'resume',
                {
                  userEmail: userEmail,
                  atPeriodEnd: true
                }
              );
              
              if (apiResult.success) {
                await storage.updateSubscription(subscriptionId, userId, {
                  status: action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'active',
                  isActive: action !== 'cancel'
                });
                result = {
                  method: 'api',
                  status: 'completed',
                  message: apiResult.message
                };
              } else {
                // API failed - fall back to concierge
                const fallbackRequest = await storage.createConciergeRequest({
                  userId,
                  subscriptionId,
                  serviceId: service.id,
                  requestType: action,
                  userEmail,
                  userAccountInfo: accountInfo,
                  status: 'pending',
                  priority: 'normal',
                } as any);
                
                result = {
                  method: 'api',
                  status: 'pending',
                  message: `API integration unavailable. We've created a concierge request to handle this for you.`,
                  requestId: fallbackRequest.id
                };
              }
            } catch (apiError) {
              console.error('API connector error:', apiError);
              result = {
                method: 'api',
                status: 'pending',
                message: `Processing ${action} request via ${service.apiProvider || 'API'}. This usually completes within minutes.`
              };
            }
            break;
            
          case 'self_service':
            // Provide instructions
            result = {
              method: 'self_service',
              status: 'instructions',
              message: action === 'cancel' 
                ? (service.cancellationInstructions || `Visit ${service.cancellationUrl} to cancel.`)
                : (service.pauseInstructions || `Visit ${service.websiteUrl} to ${action}.`)
            };
            break;
            
          case 'concierge':
          default:
            // Create concierge request
            const request = await storage.createConciergeRequest({
              userId,
              subscriptionId,
              serviceId: service.id,
              requestType: action,
              userEmail,
              userAccountInfo: accountInfo,
              status: 'pending',
              priority: 'normal',
            } as any);
            
            result = {
              method: 'concierge',
              status: 'pending',
              message: `We'll handle this ${action} for you. Expected completion: ${service.estimatedCancellationTime || '24-48 hours'}`,
              requestId: request.id
            };
            break;
        }
      }
      
      // Log the action
      await storage.createControlActionLog({
        userId,
        subscriptionId,
        conciergeRequestId: result.requestId,
        actionType: action,
        controlMethod: result.method,
        status: result.status === 'completed' ? 'completed' : 'pending',
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error executing subscription control:", error);
      res.status(500).json({ message: "Failed to execute control action" });
    }
  });

  // ===== FAMILY MANAGEMENT API =====
  
  // Create a new family
  app.post('/api/families', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, maxMembers } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Family name is required" });
      }
      
      const family = await storage.createFamily({
        name,
        ownerId: userId,
        maxMembers: maxMembers || 6,
      });
      
      res.json(family);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });
  
  // Get user's families
  app.get('/api/families', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const families = await storage.getUserFamilies(userId);
      
      // Enrich each family with member count
      const enrichedFamilies = await Promise.all(families.map(async (family) => {
        const members = await storage.getFamilyMembers(family.id);
        return {
          ...family,
          memberCount: members.length,
          isOwner: family.ownerId === userId,
        };
      }));
      
      res.json(enrichedFamilies);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });
  
  // Get specific family with members
  app.get('/api/families/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      // Check if user is a member
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === userId);
      if (!isMember && family.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get shared subscriptions
      const sharedSubs = await storage.getSharedSubscriptions(familyId);
      
      // Check current user's role
      const currentUserMember = members.find(m => m.userId === userId);
      const isOwner = family.ownerId === userId;
      const isDelegate = currentUserMember?.role === 'delegate';
      
      // Enrich shared subscriptions with subscription details and member info
      const enrichedSharedSubs = await Promise.all(sharedSubs.map(async (shared) => {
        const sub = await storage.getSubscription(shared.subscriptionId, shared.ownerId);
        const shares = await storage.getSubscriptionShares(shared.id);
        // Enrich shares with member display names
        const enrichedShares = shares.map(share => {
          const member = members.find(m => m.id === share.familyMemberId);
          return {
            ...share,
            member: member ? { displayName: member.displayName, email: member.email } : null,
          };
        });
        return {
          ...shared,
          subscription: sub,
          shares: enrichedShares,
        };
      }));
      
      res.json({
        ...family,
        members,
        sharedSubscriptions: enrichedSharedSubs,
        isOwner,
        isDelegate,
        canEditSplits: isOwner || isDelegate,
      });
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });
  
  // Update family
  app.patch('/api/families/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const { name, maxMembers } = req.body;
      
      const family = await storage.getFamily(familyId);
      if (!family || family.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can update the family" });
      }
      
      const updated = await storage.updateFamily(familyId, { name, maxMembers });
      res.json(updated);
    } catch (error) {
      console.error("Error updating family:", error);
      res.status(500).json({ message: "Failed to update family" });
    }
  });
  
  // Delete family
  app.delete('/api/families/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      
      const family = await storage.getFamily(familyId);
      if (!family || family.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can delete the family" });
      }
      
      await storage.deleteFamily(familyId);
      res.json({ message: "Family deleted" });
    } catch (error) {
      console.error("Error deleting family:", error);
      res.status(500).json({ message: "Failed to delete family" });
    }
  });
  
  // Join family by invite code
  app.post('/api/families/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      const family = await storage.getFamilyByInviteCode(inviteCode);
      if (!family) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      const members = await storage.getFamilyMembers(family.id);
      if (members.length >= (family.maxMembers || 6)) {
        return res.status(400).json({ message: "Family is full" });
      }
      
      // Check if already a member
      const user = await storage.getUser(userId);
      const existingMember = await storage.getFamilyMemberByEmail(family.id, user?.email || '');
      if (existingMember && existingMember.status === 'active') {
        return res.status(400).json({ message: "You're already a member of this family" });
      }
      
      // Add as member
      const member = await storage.addFamilyMember({
        familyId: family.id,
        userId,
        email: user?.email || '',
        displayName: user?.firstName || 'Member',
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
      });
      
      res.json({ family, member });
    } catch (error) {
      console.error("Error joining family:", error);
      res.status(500).json({ message: "Failed to join family" });
    }
  });
  
  // Add member to family (invite by email OR add manually by name)
  app.post('/api/families/:id/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const { email, displayName, isManual } = req.body;
      
      // Require at least a display name
      if (!displayName?.trim()) {
        return res.status(400).json({ message: "Display name is required" });
      }
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      // Check if user has permission to invite
      const members = await storage.getFamilyMembers(familyId);
      const userMember = members.find(m => m.userId === userId);
      if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin' && userMember.role !== 'delegate')) {
        return res.status(403).json({ message: "Only owners, delegates, and admins can add members" });
      }
      
      if (members.length >= (family.maxMembers || 6)) {
        return res.status(400).json({ message: "Family is full" });
      }
      
      // Check if email already exists (only if email provided)
      if (email) {
        const existing = await storage.getFamilyMemberByEmail(familyId, email);
        if (existing) {
          return res.status(400).json({ message: "This email is already invited" });
        }
      }
      
      // Check for duplicate display names among manual members
      const duplicateName = members.find(m => 
        m.displayName.toLowerCase() === displayName.trim().toLowerCase() && 
        m.status !== 'removed'
      );
      if (duplicateName) {
        return res.status(400).json({ message: "A member with this name already exists" });
      }
      
      const member = await storage.addFamilyMember({
        familyId,
        email: email || null,
        displayName: displayName.trim(),
        role: 'member',
        status: isManual ? 'active' : 'pending', // Manual members are immediately active
        isManual: isManual || false,
        joinedAt: isManual ? new Date() : undefined,
      });
      
      res.json({ member, inviteCode: family.inviteCode });
    } catch (error) {
      console.error("Error adding member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });
  
  // Remove member from family
  app.delete('/api/families/:id/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      const members = await storage.getFamilyMembers(familyId);
      const userMember = members.find(m => m.userId === userId);
      const targetMember = members.find(m => m.id === memberId);
      
      if (!targetMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Owner can remove anyone, admins can remove members, users can remove themselves
      const canRemove = 
        userMember?.role === 'owner' ||
        (userMember?.role === 'admin' && targetMember.role === 'member') ||
        targetMember.userId === userId;
        
      if (!canRemove) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Can't remove the owner
      if (targetMember.role === 'owner') {
        return res.status(400).json({ message: "Cannot remove the family owner" });
      }
      
      await storage.removeFamilyMember(memberId);
      res.json({ message: "Member removed" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });
  
  // ===== SHARED SUBSCRIPTIONS API =====
  
  // Share a subscription with family
  app.post('/api/families/:id/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const { subscriptionId, splitType, maxSlots, forceShare } = req.body;
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      // Verify user owns the subscription
      const subscription = await storage.getSubscription(subscriptionId, userId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if the subscription plan is family-eligible
      const eligibility = await storage.checkPlanFamilyEligibility(
        subscription.name,
        subscription.planTier
      );
      
      if (!eligibility.isEligible && !forceShare) {
        return res.status(400).json({ 
          message: "This subscription plan is not family-eligible. Family plans like Spotify Family or Netflix Premium support cost-splitting.",
          code: "NOT_FAMILY_ELIGIBLE",
          suggestion: "Consider upgrading to a family plan for this service, or set forceShare=true to share anyway."
        });
      }
      
      // Use the plan's max members if available
      const effectiveMaxSlots = eligibility.maxMembers || maxSlots || 6;
      
      const shared = await storage.createSharedSubscription({
        familyId,
        subscriptionId,
        ownerId: userId,
        splitType: splitType || 'equal',
        totalCost: subscription.cost,
        currency: subscription.currency || 'EUR',
        maxSlots: effectiveMaxSlots,
        usedSlots: 1,
      });
      
      // Create share for the owner
      const members = await storage.getFamilyMembers(familyId);
      const ownerMember = members.find(m => m.userId === userId);
      if (ownerMember) {
        await storage.createSubscriptionShare({
          sharedSubscriptionId: shared.id,
          familyMemberId: ownerMember.id,
          shareAmount: subscription.cost,
          sharePercentage: "100",
          status: 'active',
        });
      }
      
      res.json(shared);
    } catch (error) {
      console.error("Error sharing subscription:", error);
      res.status(500).json({ message: "Failed to share subscription" });
    }
  });
  
  // Add member to shared subscription
  app.post('/api/shared-subscriptions/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedSubId = parseInt(req.params.id);
      const { familyMemberId } = req.body;
      
      const sharedSub = await storage.getSharedSubscription(sharedSubId);
      if (!sharedSub) {
        return res.status(404).json({ message: "Shared subscription not found" });
      }
      
      // Verify ownership
      if (sharedSub.ownerId !== userId) {
        return res.status(403).json({ message: "Only the subscription owner can add members" });
      }
      
      // Check slot availability
      if ((sharedSub.usedSlots || 0) >= (sharedSub.maxSlots || 6)) {
        return res.status(400).json({ message: "No available slots" });
      }
      
      // Get existing shares to calculate new split
      const existingShares = await storage.getSubscriptionShares(sharedSubId);
      const newMemberCount = existingShares.length + 1;
      const totalCost = parseFloat(sharedSub.totalCost);
      const shareAmount = totalCost / newMemberCount;
      const sharePercentage = (100 / newMemberCount).toFixed(2);
      
      // Create share for new member
      const share = await storage.createSubscriptionShare({
        sharedSubscriptionId: sharedSubId,
        familyMemberId,
        shareAmount: shareAmount.toString(),
        sharePercentage,
        status: 'active',
      });
      
      // Update existing shares
      for (const existing of existingShares) {
        await storage.updateSubscriptionShare(existing.id, {
          shareAmount: shareAmount.toString(),
          sharePercentage,
        });
      }
      
      // Update used slots
      await storage.updateSharedSubscription(sharedSubId, {
        usedSlots: newMemberCount,
      });
      
      res.json(share);
    } catch (error) {
      console.error("Error adding member to shared subscription:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });
  
  // Remove member from shared subscription
  app.delete('/api/shared-subscriptions/:id/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedSubId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);
      
      const sharedSub = await storage.getSharedSubscription(sharedSubId);
      if (!sharedSub) {
        return res.status(404).json({ message: "Shared subscription not found" });
      }
      
      if (sharedSub.ownerId !== userId) {
        return res.status(403).json({ message: "Only the subscription owner can remove members" });
      }
      
      // Find and delete the share
      const shares = await storage.getSubscriptionShares(sharedSubId);
      const shareToRemove = shares.find(s => s.familyMemberId === memberId);
      if (!shareToRemove) {
        return res.status(404).json({ message: "Member not part of this subscription" });
      }
      
      await storage.deleteSubscriptionShare(shareToRemove.id);
      
      // Recalculate shares
      const remainingShares = shares.filter(s => s.id !== shareToRemove.id);
      const totalCost = parseFloat(sharedSub.totalCost);
      const shareAmount = remainingShares.length > 0 ? totalCost / remainingShares.length : totalCost;
      const sharePercentage = remainingShares.length > 0 ? (100 / remainingShares.length).toFixed(2) : "100";
      
      for (const existing of remainingShares) {
        await storage.updateSubscriptionShare(existing.id, {
          shareAmount: shareAmount.toString(),
          sharePercentage,
        });
      }
      
      // Update used slots
      await storage.updateSharedSubscription(sharedSubId, {
        usedSlots: remainingShares.length,
      });
      
      res.json({ message: "Member removed from subscription" });
    } catch (error) {
      console.error("Error removing member from shared subscription:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });
  
  // Get family cost summary
  app.get('/api/families/:id/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sharedSubs = await storage.getSharedSubscriptions(familyId);
      
      // Calculate totals
      let totalMonthly = 0;
      let userShare = 0;
      const userMember = members.find(m => m.userId === userId);
      
      for (const shared of sharedSubs) {
        totalMonthly += parseFloat(shared.totalCost);
        
        if (userMember) {
          const shares = await storage.getSubscriptionShares(shared.id);
          const userShareRecord = shares.find(s => s.familyMemberId === userMember.id);
          if (userShareRecord) {
            userShare += parseFloat(userShareRecord.shareAmount);
          }
        }
      }
      
      res.json({
        familyId,
        memberCount: members.length,
        sharedSubscriptionCount: sharedSubs.length,
        totalMonthly: totalMonthly.toFixed(2),
        yourShare: userShare.toFixed(2),
        savings: (totalMonthly - userShare).toFixed(2),
      });
    } catch (error) {
      console.error("Error getting family summary:", error);
      res.status(500).json({ message: "Failed to get summary" });
    }
  });

  // Set delegate member (owner only)
  app.patch('/api/families/:id/delegate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const { memberId } = req.body;
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      // Only owner can set delegate
      if (family.ownerId !== userId) {
        return res.status(403).json({ message: "Only the family owner can set a delegate" });
      }
      
      const members = await storage.getFamilyMembers(familyId);
      const targetMember = members.find(m => m.id === memberId);
      
      if (!targetMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Can't set owner as delegate
      if (targetMember.userId === userId) {
        return res.status(400).json({ message: "Owner cannot be set as delegate" });
      }
      
      // Update family with new delegate
      await storage.updateFamily(familyId, { delegateMemberId: memberId });
      
      // Update member roles
      for (const member of members) {
        if (member.userId === userId) {
          await storage.updateFamilyMember(member.id, { role: 'owner' });
        } else if (member.id === memberId) {
          await storage.updateFamilyMember(member.id, { role: 'delegate' });
        } else if (member.role === 'delegate') {
          // Remove previous delegate role
          await storage.updateFamilyMember(member.id, { role: 'member' });
        }
      }
      
      res.json({ success: true, delegateMemberId: memberId });
    } catch (error) {
      console.error("Error setting delegate:", error);
      res.status(500).json({ message: "Failed to set delegate" });
    }
  });

  // Update subscription share configuration (owner/delegate only)
  app.patch('/api/families/:id/subscriptions/:sharedSubId/shares', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const familyId = parseInt(req.params.id);
      const sharedSubId = parseInt(req.params.sharedSubId);
      const { shares, shareType } = req.body; // shares: [{ memberId, amount, percentage }], shareType: 'equal' | 'percentage' | 'fixed'
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      // Check if user is owner or delegate
      const members = await storage.getFamilyMembers(familyId);
      const userMember = members.find(m => m.userId === userId);
      
      if (!userMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const isOwner = family.ownerId === userId;
      const isDelegate = userMember.role === 'delegate';
      
      if (!isOwner && !isDelegate) {
        return res.status(403).json({ message: "Only owner or delegate can update split configuration" });
      }
      
      // Get the shared subscription
      const sharedSub = await storage.getSharedSubscription(sharedSubId);
      if (!sharedSub || sharedSub.familyId !== familyId) {
        return res.status(404).json({ message: "Shared subscription not found" });
      }
      
      // Validate shares sum to 100% or match total cost
      const totalCost = parseFloat(sharedSub.totalCost);
      
      if (shareType === 'percentage') {
        const totalPercentage = shares.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return res.status(400).json({ message: "Percentages must sum to 100%" });
        }
      } else if (shareType === 'fixed') {
        const totalFixed = shares.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
        if (Math.abs(totalFixed - totalCost) > 0.01) {
          return res.status(400).json({ message: `Amounts must sum to €${totalCost.toFixed(2)}` });
        }
      }
      
      // Update each share
      const currentShares = await storage.getSubscriptionShares(sharedSubId);
      
      for (const shareUpdate of shares) {
        const existingShare = currentShares.find(s => s.familyMemberId === shareUpdate.memberId);
        
        let shareAmount: number;
        let sharePercentage: number = 0;
        
        if (shareType === 'equal') {
          const activeMembers = members.filter(m => m.status === 'active').length;
          shareAmount = totalCost / activeMembers;
          sharePercentage = 100 / activeMembers;
        } else if (shareType === 'percentage') {
          sharePercentage = shareUpdate.percentage || 0;
          shareAmount = (totalCost * sharePercentage) / 100;
        } else {
          shareAmount = shareUpdate.amount;
          sharePercentage = (shareAmount / totalCost) * 100;
        }
        
        if (existingShare) {
          await storage.updateSubscriptionShare(existingShare.id, {
            shareType,
            shareAmount: shareAmount.toFixed(2),
            sharePercentage: sharePercentage?.toFixed(2) || null,
            isLocked: shareUpdate.isLocked || false
          });
        }
      }
      
      const updatedShares = await storage.getSubscriptionShares(sharedSubId);
      res.json({ success: true, shares: updatedShares });
    } catch (error) {
      console.error("Error updating shares:", error);
      res.status(500).json({ message: "Failed to update shares" });
    }
  });

  // Seed service directory endpoint (admin only)
  app.post('/api/admin/seed-services', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { serviceDirectorySeed } = await import('./seeds/serviceDirectory');
      
      let created = 0;
      let skipped = 0;
      
      for (const serviceData of serviceDirectorySeed) {
        const existing = await storage.getServiceBySlug(serviceData.slug);
        if (existing) {
          skipped++;
          continue;
        }
        await storage.createService(serviceData);
        created++;
      }
      
      res.json({ 
        message: `Seeded ${created} services, skipped ${skipped} existing`,
        created,
        skipped
      });
    } catch (error) {
      console.error("Error seeding services:", error);
      res.status(500).json({ message: "Failed to seed services" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
