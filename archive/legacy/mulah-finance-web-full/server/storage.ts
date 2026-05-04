import {
  users,
  subscriptions,
  waitlistSignups,
  supportCases,
  supportMessages,
  proactiveAlerts,
  virtualCards,
  bankConnections,
  bankTransactions,
  serviceDirectory,
  conciergeRequests,
  merchants,
  merchantPlans,
  merchantCustomers,
  householdBills,
  controlActionLog,
  apiConnections,
  demoScenarioState,
  appConfig,
  servicePlans,
  families,
  familyMembers,
  sharedSubscriptions,
  subscriptionShares,
  type User,
  type UpsertUser,
  type Subscription,
  type InsertSubscription,
  type WaitlistSignup,
  type InsertWaitlist,
  type SupportCase,
  type NewSupportCase,
  type SupportMessage,
  type NewSupportMessage,
  type ProactiveAlert,
  type NewProactiveAlert,
  type VirtualCard,
  type InsertVirtualCard,
  type BankConnection,
  type InsertBankConnection,
  type BankTransaction,
  type InsertBankTransaction,
  type ServiceDirectory,
  type InsertServiceDirectory,
  type ConciergeRequest,
  type InsertConciergeRequest,
  type Merchant,
  type InsertMerchant,
  type MerchantPlan,
  type InsertMerchantPlan,
  type MerchantCustomer,
  type InsertMerchantCustomer,
  type HouseholdBill,
  type InsertHouseholdBill,
  type ControlActionLog,
  type InsertControlActionLog,
  type ApiConnection,
  type InsertApiConnection,
  type DemoScenarioState,
  type InsertDemoScenarioState,
  type AppConfig,
  type ServicePlan,
  type Family,
  type InsertFamily,
  type FamilyMember,
  type InsertFamilyMember,
  type SharedSubscription,
  type InsertSharedSubscription,
  type SubscriptionShare,
  type InsertSubscriptionShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, gte, lte, ilike, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Subscription operations
  getSubscriptions(userId: string): Promise<Subscription[]>;
  getSubscription(id: number, userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription & { userId: string }): Promise<Subscription>;
  updateSubscription(id: number, userId: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number, userId: string): Promise<boolean>;
  
  // Analytics operations
  getMonthlyTotal(userId: string, year: number, month: number): Promise<number>;
  getAnnualTotal(userId: string, year: number): Promise<number>;
  getSubscriptionsByCategory(userId: string): Promise<{ category: string; total: number; count: number }[]>;
  getUpcomingRenewals(userId: string, days: number): Promise<Subscription[]>;
  
  // Unified billing window - centralized source of truth for billing calculations
  getSubscriptionsDueInMonth(userId: string, year: number, month: number): Promise<Subscription[]>;
  
  // Waitlist operations
  addToWaitlist(waitlist: InsertWaitlist & { userId?: string }): Promise<WaitlistSignup>;
  getWaitlistCount(): Promise<number>;
  
  // Admin operations
  deleteAllSubscriptions(userId: string): Promise<void>;
  
  // Support operations
  createSupportCase(caseData: NewSupportCase & { userId: string }): Promise<SupportCase>;
  getSupportCases(userId?: string): Promise<SupportCase[]>;
  getSupportCase(id: number, userId?: string): Promise<SupportCase | undefined>;
  updateSupportCase(id: number, updates: Partial<SupportCase>): Promise<SupportCase | undefined>;
  addSupportMessage(messageData: NewSupportMessage): Promise<SupportMessage>;
  getSupportMessages(caseId: number): Promise<SupportMessage[]>;
  createProactiveAlert(alertData: NewProactiveAlert): Promise<ProactiveAlert>;
  getProactiveAlerts(userId?: string): Promise<ProactiveAlert[]>;
  generateCaseNumber(): Promise<string>;
  
  // Virtual Card operations
  createVirtualCard(cardData: InsertVirtualCard & { userId: string }): Promise<VirtualCard>;
  getVirtualCards(userId: string): Promise<VirtualCard[]>;
  getVirtualCard(id: number, userId: string): Promise<VirtualCard | undefined>;
  updateVirtualCard(id: number, userId: string, updates: Partial<InsertVirtualCard>): Promise<VirtualCard | undefined>;
  deleteVirtualCard(id: number, userId: string): Promise<boolean>;
  
  // Bank Connection operations  
  createBankConnection(connectionData: InsertBankConnection & { userId: string }): Promise<BankConnection>;
  getBankConnections(userId: string): Promise<BankConnection[]>;
  getBankConnection(id: number, userId: string): Promise<BankConnection | undefined>;
  updateBankConnection(id: number, userId: string, updates: Partial<InsertBankConnection>): Promise<BankConnection | undefined>;
  deleteBankConnection(id: number, userId: string): Promise<boolean>;
  
  // Bank Transaction operations
  createBankTransaction(transactionData: InsertBankTransaction): Promise<BankTransaction>;
  getBankTransactions(userId: string): Promise<BankTransaction[]>;
  deleteBankTransactionsByConnection(bankConnectionId: number): Promise<void>;
  deleteAllBankTransactions(userId: string): Promise<void>;
  deleteAllBankConnections(userId: string): Promise<void>;
  deleteAllVirtualCards(userId: string): Promise<void>;
  
  // User update operations
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  
  // Service Directory operations
  getServiceDirectory(): Promise<ServiceDirectory[]>;
  getServiceBySlug(slug: string): Promise<ServiceDirectory | undefined>;
  getServiceByName(name: string): Promise<ServiceDirectory | undefined>;
  createService(serviceData: InsertServiceDirectory): Promise<ServiceDirectory>;
  updateService(id: number, updates: Partial<InsertServiceDirectory>): Promise<ServiceDirectory | undefined>;
  
  // Concierge Request operations
  createConciergeRequest(requestData: InsertConciergeRequest & { userId: string }): Promise<ConciergeRequest>;
  getConciergeRequests(userId: string): Promise<ConciergeRequest[]>;
  getConciergeRequest(id: number, userId: string): Promise<ConciergeRequest | undefined>;
  updateConciergeRequest(id: number, updates: Partial<ConciergeRequest>): Promise<ConciergeRequest | undefined>;
  getAllPendingConciergeRequests(): Promise<ConciergeRequest[]>;
  
  // Merchant operations
  createMerchant(merchantData: InsertMerchant & { ownerId: string }): Promise<Merchant>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantBySlug(slug: string): Promise<Merchant | undefined>;
  getMerchantsByOwner(ownerId: string): Promise<Merchant[]>;
  updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant | undefined>;
  
  // Merchant Plan operations
  createMerchantPlan(planData: InsertMerchantPlan): Promise<MerchantPlan>;
  getMerchantPlans(merchantId: number): Promise<MerchantPlan[]>;
  getMerchantPlan(id: number): Promise<MerchantPlan | undefined>;
  updateMerchantPlan(id: number, updates: Partial<InsertMerchantPlan>): Promise<MerchantPlan | undefined>;
  
  // Merchant Customer operations
  createMerchantCustomer(customerData: InsertMerchantCustomer): Promise<MerchantCustomer>;
  getMerchantCustomers(merchantId: number): Promise<MerchantCustomer[]>;
  getMerchantCustomer(id: number): Promise<MerchantCustomer | undefined>;
  getMerchantCustomerByUser(merchantId: number, userId: string): Promise<MerchantCustomer | undefined>;
  updateMerchantCustomer(id: number, updates: Partial<InsertMerchantCustomer>): Promise<MerchantCustomer | undefined>;
  
  // Household Bill operations
  createHouseholdBill(billData: InsertHouseholdBill & { userId: string }): Promise<HouseholdBill>;
  getHouseholdBills(userId: string): Promise<HouseholdBill[]>;
  getHouseholdBill(id: number, userId: string): Promise<HouseholdBill | undefined>;
  updateHouseholdBill(id: number, userId: string, updates: Partial<InsertHouseholdBill>): Promise<HouseholdBill | undefined>;
  deleteHouseholdBill(id: number, userId: string): Promise<boolean>;
  
  // Control Action Log operations
  createControlActionLog(logData: InsertControlActionLog): Promise<ControlActionLog>;
  getControlActionLogs(userId: string): Promise<ControlActionLog[]>;
  
  // API Connection operations
  getApiConnection(userId: string, serviceSlug: string): Promise<ApiConnection | undefined>;
  getApiConnectionBySubscription(subscriptionId: number): Promise<ApiConnection | undefined>;
  createApiConnection(data: InsertApiConnection): Promise<ApiConnection>;
  updateApiConnection(id: number, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined>;
  deleteApiConnection(id: number): Promise<boolean>;
  
  // Demo Scenario State operations
  getDemoScenarioState(userId: string, subscriptionId: number): Promise<DemoScenarioState | undefined>;
  createOrUpdateDemoScenarioState(data: InsertDemoScenarioState): Promise<DemoScenarioState>;
  deleteDemoScenarioState(subscriptionId: number): Promise<boolean>;
  
  // App Configuration operations
  getAppConfig(key: string): Promise<AppConfig | undefined>;
  getAllPublicConfig(): Promise<AppConfig[]>;
  setAppConfig(key: string, value: any, description?: string, isPublic?: boolean): Promise<AppConfig>;
  
  // Service Plans operations
  getServicePlans(serviceId: number): Promise<ServicePlan[]>;
  getServicePlansBySlug(serviceSlug: string): Promise<ServicePlan[]>;
  checkPlanFamilyEligibility(serviceName: string, planTier: string | null): Promise<{ isEligible: boolean; maxMembers: number | null }>;
  
  // Family operations
  createFamily(familyData: InsertFamily & { ownerId: string }): Promise<Family>;
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined>;
  getUserFamilies(userId: string): Promise<Family[]>;
  updateFamily(id: number, updates: Partial<InsertFamily>): Promise<Family | undefined>;
  deleteFamily(id: number): Promise<boolean>;
  
  // Family Member operations
  addFamilyMember(memberData: InsertFamilyMember): Promise<FamilyMember>;
  getFamilyMembers(familyId: number): Promise<FamilyMember[]>;
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  getFamilyMemberByEmail(familyId: number, email: string): Promise<FamilyMember | undefined>;
  updateFamilyMember(id: number, updates: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined>;
  removeFamilyMember(id: number): Promise<boolean>;
  
  // Shared Subscription operations
  createSharedSubscription(data: InsertSharedSubscription): Promise<SharedSubscription>;
  getSharedSubscriptions(familyId: number): Promise<SharedSubscription[]>;
  getSharedSubscription(id: number): Promise<SharedSubscription | undefined>;
  updateSharedSubscription(id: number, updates: Partial<InsertSharedSubscription>): Promise<SharedSubscription | undefined>;
  deleteSharedSubscription(id: number): Promise<boolean>;
  
  // Subscription Share operations
  createSubscriptionShare(data: InsertSubscriptionShare): Promise<SubscriptionShare>;
  getSubscriptionShares(sharedSubscriptionId: number): Promise<SubscriptionShare[]>;
  updateSubscriptionShare(id: number, updates: Partial<InsertSubscriptionShare>): Promise<SubscriptionShare | undefined>;
  deleteSubscriptionShare(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Subscription operations
  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId), 
        eq(subscriptions.isActive, true),
        isNull(subscriptions.archivedAt) // Exclude archived subscriptions
      ))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscription(id: number, userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription & { userId: string }): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateSubscription(id: number, userId: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSubscription(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(subscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Analytics operations
  async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    // Use UTC-safe date boundaries to match getSubscriptionsDueInMonth
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    const result = await db
      .select({ total: sum(subscriptions.cost) })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          gte(subscriptions.nextBillingDate, startDate),
          lte(subscriptions.nextBillingDate, endDate)
        )
      );
    
    return Number(result[0]?.total || 0);
  }

  async getAnnualTotal(userId: string, year: number): Promise<number> {
    const userSubscriptions = await this.getSubscriptions(userId);
    
    let total = 0;
    for (const sub of userSubscriptions) {
      const cost = Number(sub.cost);
      if (sub.billingCycle === 'monthly') {
        total += cost * 12;
      } else if (sub.billingCycle === 'yearly') {
        total += cost;
      }
    }
    
    return total;
  }

  async getSubscriptionsByCategory(userId: string): Promise<{ category: string; total: number; count: number }[]> {
    const userSubscriptions = await this.getSubscriptions(userId);
    
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    for (const sub of userSubscriptions) {
      const cost = Number(sub.cost);
      const category = sub.category;
      
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)!;
        categoryMap.set(category, {
          total: existing.total + cost,
          count: existing.count + 1
        });
      } else {
        categoryMap.set(category, { total: cost, count: 1 });
      }
    }
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    }));
  }

  async getUpcomingRenewals(userId: string, days: number): Promise<Subscription[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          gte(subscriptions.nextBillingDate, today),
          lte(subscriptions.nextBillingDate, futureDate)
        )
      )
      .orderBy(subscriptions.nextBillingDate);
  }

  // Centralized billing window - single source of truth for month billing calculations
  async getSubscriptionsDueInMonth(userId: string, year: number, month: number): Promise<Subscription[]> {
    // Use UTC-safe date boundaries for consistent calculations
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          gte(subscriptions.nextBillingDate, monthStart),
          lte(subscriptions.nextBillingDate, monthEnd)
        )
      )
      .orderBy(subscriptions.nextBillingDate);
  }

  // Waitlist operations
  async addToWaitlist(waitlist: InsertWaitlist & { userId?: string }): Promise<WaitlistSignup> {
    const [signup] = await db
      .insert(waitlistSignups)
      .values(waitlist)
      .onConflictDoNothing()
      .returning();
    return signup;
  }

  async getWaitlistCount(): Promise<number> {
    const result = await db
      .select({ count: sum(waitlistSignups.id) })
      .from(waitlistSignups);
    return Number(result[0]?.count || 0);
  }

  async deleteAllSubscriptions(userId: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
  }

  // Support operations
  async generateCaseNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MULAH-${timestamp.slice(-6)}-${random}`;
  }

  async createSupportCase(caseData: NewSupportCase & { userId: string }): Promise<SupportCase> {
    const caseNumber = await this.generateCaseNumber();
    const [supportCase] = await db
      .insert(supportCases)
      .values({
        ...caseData,
        caseNumber,
      })
      .returning();
    return supportCase;
  }

  async getSupportCases(userId?: string): Promise<SupportCase[]> {
    const query = db.select().from(supportCases);
    
    if (userId) {
      return await query.where(eq(supportCases.userId, userId)).orderBy(desc(supportCases.createdAt));
    }
    
    // Admin view - return all cases
    return await query.orderBy(desc(supportCases.createdAt));
  }

  async getSupportCase(id: number, userId?: string): Promise<SupportCase | undefined> {
    if (userId) {
      const [supportCase] = await db.select().from(supportCases)
        .where(and(eq(supportCases.id, id), eq(supportCases.userId, userId)));
      return supportCase;
    }
    
    // Admin view
    const [supportCase] = await db.select().from(supportCases)
      .where(eq(supportCases.id, id));
    return supportCase;
  }

  async updateSupportCase(id: number, updates: Partial<SupportCase>): Promise<SupportCase | undefined> {
    const [supportCase] = await db
      .update(supportCases)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(supportCases.id, id))
      .returning();
    return supportCase;
  }

  async addSupportMessage(messageData: NewSupportMessage): Promise<SupportMessage> {
    const [message] = await db
      .insert(supportMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getSupportMessages(caseId: number): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.caseId, caseId))
      .orderBy(supportMessages.createdAt);
  }

  async createProactiveAlert(alertData: NewProactiveAlert): Promise<ProactiveAlert> {
    const [alert] = await db
      .insert(proactiveAlerts)
      .values(alertData)
      .returning();
    return alert;
  }

  async getProactiveAlerts(userId?: string): Promise<ProactiveAlert[]> {
    const query = db.select().from(proactiveAlerts);
    
    if (userId) {
      return await query.where(eq(proactiveAlerts.userId, userId)).orderBy(desc(proactiveAlerts.createdAt));
    }
    
    // Admin view
    return await query.orderBy(desc(proactiveAlerts.createdAt));
  }

  // Virtual Card operations
  async createVirtualCard(cardData: InsertVirtualCard & { userId: string }): Promise<VirtualCard> {
    const [card] = await db
      .insert(virtualCards)
      .values(cardData)
      .returning();
    return card;
  }

  async getVirtualCards(userId: string): Promise<VirtualCard[]> {
    return await db
      .select()
      .from(virtualCards)
      .where(eq(virtualCards.userId, userId))
      .orderBy(desc(virtualCards.createdAt));
  }

  async getVirtualCard(id: number, userId: string): Promise<VirtualCard | undefined> {
    const [card] = await db
      .select()
      .from(virtualCards)
      .where(and(eq(virtualCards.id, id), eq(virtualCards.userId, userId)));
    return card;
  }

  async updateVirtualCard(id: number, userId: string, updates: Partial<InsertVirtualCard>): Promise<VirtualCard | undefined> {
    const [card] = await db
      .update(virtualCards)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(virtualCards.id, id), eq(virtualCards.userId, userId)))
      .returning();
    return card;
  }

  async deleteVirtualCard(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(virtualCards)
      .where(and(eq(virtualCards.id, id), eq(virtualCards.userId, userId)));
    return true;
  }

  // Bank Connection operations
  async createBankConnection(connectionData: InsertBankConnection & { userId: string }): Promise<BankConnection> {
    const [connection] = await db
      .insert(bankConnections)
      .values(connectionData)
      .returning();
    return connection;
  }

  async getBankConnections(userId: string): Promise<BankConnection[]> {
    return await db
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.userId, userId), eq(bankConnections.isActive, true)))
      .orderBy(desc(bankConnections.createdAt));
  }

  async getBankConnection(id: number, userId: string): Promise<BankConnection | undefined> {
    const [connection] = await db
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));
    return connection;
  }

  async updateBankConnection(id: number, userId: string, updates: Partial<InsertBankConnection>): Promise<BankConnection | undefined> {
    const [connection] = await db
      .update(bankConnections)
      .set(updates)
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)))
      .returning();
    return connection;
  }

  async deleteBankConnection(id: number, userId: string): Promise<boolean> {
    await db
      .update(bankConnections)
      .set({ isActive: false })
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));
    return true;
  }
  
  // Bank Transaction operations
  async createBankTransaction(transactionData: InsertBankTransaction): Promise<BankTransaction> {
    const [transaction] = await db
      .insert(bankTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }
  
  async getBankTransactions(userId: string): Promise<BankTransaction[]> {
    return await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.userId, userId))
      .orderBy(desc(bankTransactions.transactionDate));
  }
  
  async deleteBankTransactionsByConnection(bankConnectionId: number): Promise<void> {
    await db
      .delete(bankTransactions)
      .where(eq(bankTransactions.bankConnectionId, bankConnectionId));
  }
  
  async deleteAllBankTransactions(userId: string): Promise<void> {
    await db
      .delete(bankTransactions)
      .where(eq(bankTransactions.userId, userId));
  }
  
  async deleteAllBankConnections(userId: string): Promise<void> {
    await db
      .delete(bankConnections)
      .where(eq(bankConnections.userId, userId));
  }
  
  async deleteAllVirtualCards(userId: string): Promise<void> {
    await db
      .delete(virtualCards)
      .where(eq(virtualCards.userId, userId));
  }
  
  // User update operations
  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Service Directory operations
  async getServiceDirectory(): Promise<ServiceDirectory[]> {
    return await db.select().from(serviceDirectory).orderBy(serviceDirectory.name);
  }
  
  async getServiceBySlug(slug: string): Promise<ServiceDirectory | undefined> {
    const [service] = await db.select().from(serviceDirectory).where(eq(serviceDirectory.slug, slug));
    return service;
  }
  
  async getServiceByName(name: string): Promise<ServiceDirectory | undefined> {
    // First try exact match (case-insensitive)
    const [exactMatch] = await db.select().from(serviceDirectory).where(ilike(serviceDirectory.name, name));
    if (exactMatch) return exactMatch;
    
    // Then try partial match - check if subscription name starts with service name
    // This handles cases like "StreamFlix Premium" matching "StreamFlix"
    const allServices = await db.select().from(serviceDirectory);
    const partialMatch = allServices.find(s => 
      name.toLowerCase().startsWith(s.name.toLowerCase())
    );
    return partialMatch;
  }
  
  async createService(serviceData: InsertServiceDirectory): Promise<ServiceDirectory> {
    const [service] = await db.insert(serviceDirectory).values(serviceData).returning();
    return service;
  }
  
  async updateService(id: number, updates: Partial<InsertServiceDirectory>): Promise<ServiceDirectory | undefined> {
    const [service] = await db
      .update(serviceDirectory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceDirectory.id, id))
      .returning();
    return service;
  }
  
  // Concierge Request operations
  async createConciergeRequest(requestData: InsertConciergeRequest & { userId: string }): Promise<ConciergeRequest> {
    const [request] = await db.insert(conciergeRequests).values(requestData).returning();
    return request;
  }
  
  async getConciergeRequests(userId: string): Promise<ConciergeRequest[]> {
    return await db
      .select()
      .from(conciergeRequests)
      .where(eq(conciergeRequests.userId, userId))
      .orderBy(desc(conciergeRequests.createdAt));
  }
  
  async getConciergeRequest(id: number, userId: string): Promise<ConciergeRequest | undefined> {
    const [request] = await db
      .select()
      .from(conciergeRequests)
      .where(and(eq(conciergeRequests.id, id), eq(conciergeRequests.userId, userId)));
    return request;
  }
  
  async updateConciergeRequest(id: number, updates: Partial<ConciergeRequest>): Promise<ConciergeRequest | undefined> {
    const [request] = await db
      .update(conciergeRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conciergeRequests.id, id))
      .returning();
    return request;
  }
  
  async getAllPendingConciergeRequests(): Promise<ConciergeRequest[]> {
    return await db
      .select()
      .from(conciergeRequests)
      .where(eq(conciergeRequests.status, "pending"))
      .orderBy(conciergeRequests.createdAt);
  }
  
  // Merchant operations
  async createMerchant(merchantData: InsertMerchant & { ownerId: string }): Promise<Merchant> {
    const [merchant] = await db.insert(merchants).values(merchantData).returning();
    return merchant;
  }
  
  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }
  
  async getMerchantBySlug(slug: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.slug, slug));
    return merchant;
  }
  
  async getMerchantsByOwner(ownerId: string): Promise<Merchant[]> {
    return await db.select().from(merchants).where(eq(merchants.ownerId, ownerId));
  }
  
  async updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();
    return merchant;
  }
  
  // Merchant Plan operations
  async createMerchantPlan(planData: InsertMerchantPlan): Promise<MerchantPlan> {
    const [plan] = await db.insert(merchantPlans).values(planData).returning();
    return plan;
  }
  
  async getMerchantPlans(merchantId: number): Promise<MerchantPlan[]> {
    return await db
      .select()
      .from(merchantPlans)
      .where(and(eq(merchantPlans.merchantId, merchantId), eq(merchantPlans.isActive, true)));
  }
  
  async getMerchantPlan(id: number): Promise<MerchantPlan | undefined> {
    const [plan] = await db.select().from(merchantPlans).where(eq(merchantPlans.id, id));
    return plan;
  }
  
  async updateMerchantPlan(id: number, updates: Partial<InsertMerchantPlan>): Promise<MerchantPlan | undefined> {
    const [plan] = await db
      .update(merchantPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchantPlans.id, id))
      .returning();
    return plan;
  }
  
  // Merchant Customer operations
  async createMerchantCustomer(customerData: InsertMerchantCustomer): Promise<MerchantCustomer> {
    const [customer] = await db.insert(merchantCustomers).values(customerData).returning();
    return customer;
  }
  
  async getMerchantCustomers(merchantId: number): Promise<MerchantCustomer[]> {
    return await db.select().from(merchantCustomers).where(eq(merchantCustomers.merchantId, merchantId));
  }
  
  async getMerchantCustomer(id: number): Promise<MerchantCustomer | undefined> {
    const [customer] = await db.select().from(merchantCustomers).where(eq(merchantCustomers.id, id));
    return customer;
  }
  
  async getMerchantCustomerByUser(merchantId: number, userId: string): Promise<MerchantCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(merchantCustomers)
      .where(and(eq(merchantCustomers.merchantId, merchantId), eq(merchantCustomers.userId, userId)));
    return customer;
  }
  
  async updateMerchantCustomer(id: number, updates: Partial<InsertMerchantCustomer>): Promise<MerchantCustomer | undefined> {
    const [customer] = await db
      .update(merchantCustomers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchantCustomers.id, id))
      .returning();
    return customer;
  }
  
  // Household Bill operations
  async createHouseholdBill(billData: InsertHouseholdBill & { userId: string }): Promise<HouseholdBill> {
    const [bill] = await db.insert(householdBills).values(billData).returning();
    return bill;
  }
  
  async getHouseholdBills(userId: string): Promise<HouseholdBill[]> {
    return await db
      .select()
      .from(householdBills)
      .where(and(eq(householdBills.userId, userId), eq(householdBills.isActive, true)))
      .orderBy(householdBills.dueDay);
  }
  
  async getHouseholdBill(id: number, userId: string): Promise<HouseholdBill | undefined> {
    const [bill] = await db
      .select()
      .from(householdBills)
      .where(and(eq(householdBills.id, id), eq(householdBills.userId, userId)));
    return bill;
  }
  
  async updateHouseholdBill(id: number, userId: string, updates: Partial<InsertHouseholdBill>): Promise<HouseholdBill | undefined> {
    const [bill] = await db
      .update(householdBills)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(householdBills.id, id), eq(householdBills.userId, userId)))
      .returning();
    return bill;
  }
  
  async deleteHouseholdBill(id: number, userId: string): Promise<boolean> {
    const [bill] = await db
      .update(householdBills)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(householdBills.id, id), eq(householdBills.userId, userId)))
      .returning();
    return !!bill;
  }
  
  // Control Action Log operations
  async createControlActionLog(logData: InsertControlActionLog): Promise<ControlActionLog> {
    const [log] = await db.insert(controlActionLog).values(logData).returning();
    return log;
  }
  
  async getControlActionLogs(userId: string): Promise<ControlActionLog[]> {
    return await db
      .select()
      .from(controlActionLog)
      .where(eq(controlActionLog.userId, userId))
      .orderBy(desc(controlActionLog.requestedAt));
  }
  
  // API Connection operations
  async getApiConnection(userId: string, serviceSlug: string): Promise<ApiConnection | undefined> {
    const [connection] = await db
      .select()
      .from(apiConnections)
      .where(and(eq(apiConnections.userId, userId), eq(apiConnections.serviceSlug, serviceSlug)));
    return connection;
  }
  
  async getApiConnectionBySubscription(subscriptionId: number): Promise<ApiConnection | undefined> {
    const [connection] = await db
      .select()
      .from(apiConnections)
      .where(eq(apiConnections.subscriptionId, subscriptionId));
    return connection;
  }
  
  async createApiConnection(data: InsertApiConnection): Promise<ApiConnection> {
    const [connection] = await db.insert(apiConnections).values(data).returning();
    return connection;
  }
  
  async updateApiConnection(id: number, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined> {
    const [connection] = await db
      .update(apiConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiConnections.id, id))
      .returning();
    return connection;
  }
  
  async deleteApiConnection(id: number): Promise<boolean> {
    const result = await db.delete(apiConnections).where(eq(apiConnections.id, id));
    return true;
  }
  
  // Demo Scenario State operations
  async getDemoScenarioState(userId: string, subscriptionId: number): Promise<DemoScenarioState | undefined> {
    const [state] = await db
      .select()
      .from(demoScenarioState)
      .where(and(eq(demoScenarioState.userId, userId), eq(demoScenarioState.subscriptionId, subscriptionId)));
    return state;
  }
  
  async createOrUpdateDemoScenarioState(data: InsertDemoScenarioState): Promise<DemoScenarioState> {
    // Try to find existing
    const existing = await this.getDemoScenarioState(data.userId!, data.subscriptionId!);
    if (existing) {
      const [updated] = await db
        .update(demoScenarioState)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(demoScenarioState.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(demoScenarioState).values(data).returning();
    return created;
  }
  
  async deleteDemoScenarioState(subscriptionId: number): Promise<boolean> {
    await db.delete(demoScenarioState).where(eq(demoScenarioState.subscriptionId, subscriptionId));
    return true;
  }
  
  // App Configuration operations
  async getAppConfig(key: string): Promise<AppConfig | undefined> {
    const [config] = await db.select().from(appConfig).where(eq(appConfig.key, key));
    return config;
  }
  
  async getAllPublicConfig(): Promise<AppConfig[]> {
    return await db.select().from(appConfig).where(eq(appConfig.isPublic, true));
  }
  
  async setAppConfig(key: string, value: any, description?: string, isPublic?: boolean): Promise<AppConfig> {
    const existing = await this.getAppConfig(key);
    if (existing) {
      const [updated] = await db
        .update(appConfig)
        .set({ value, description, isPublic, updatedAt: new Date() })
        .where(eq(appConfig.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(appConfig).values({ key, value, description, isPublic }).returning();
    return created;
  }
  
  // Service Plans operations
  async getServicePlans(serviceId: number): Promise<ServicePlan[]> {
    return await db.select().from(servicePlans).where(eq(servicePlans.serviceId, serviceId));
  }
  
  async getServicePlansBySlug(serviceSlug: string): Promise<ServicePlan[]> {
    const service = await this.getServiceBySlug(serviceSlug);
    if (!service) return [];
    return await this.getServicePlans(service.id);
  }
  
  async checkPlanFamilyEligibility(serviceName: string, planTier: string | null): Promise<{ isEligible: boolean; maxMembers: number | null }> {
    // Look up service by name (fuzzy match)
    const [service] = await db.select().from(serviceDirectory).where(
      ilike(serviceDirectory.name, serviceName)
    );
    
    if (!service) {
      // If service not in directory, default to not family-eligible
      return { isEligible: false, maxMembers: null };
    }
    
    // Get plans for this service
    const plans = await this.getServicePlans(service.id);
    
    // Try to match the plan tier
    if (planTier) {
      const matchedPlan = plans.find(p => 
        p.name.toLowerCase() === planTier.toLowerCase() ||
        p.name.toLowerCase().includes(planTier.toLowerCase()) ||
        planTier.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (matchedPlan) {
        return {
          isEligible: matchedPlan.isFamilyEligible || false,
          maxMembers: matchedPlan.maxFamilyMembers
        };
      }
    }
    
    // Check if any plan for this service is family eligible (for unspecified tiers)
    const familyPlan = plans.find(p => p.isFamilyEligible);
    if (familyPlan) {
      return { isEligible: false, maxMembers: null }; // They have a plan but didn't select the family one
    }
    
    return { isEligible: false, maxMembers: null };
  }
  
  // ===== FAMILY MANAGEMENT OPERATIONS =====
  
  // Generate a unique invite code
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  async createFamily(familyData: InsertFamily & { ownerId: string }): Promise<Family> {
    const inviteCode = this.generateInviteCode();
    const [family] = await db.insert(families).values({
      ...familyData,
      inviteCode,
    }).returning();
    
    // Also add the owner as a family member
    const ownerUser = await this.getUser(familyData.ownerId);
    await this.addFamilyMember({
      familyId: family.id,
      userId: familyData.ownerId,
      email: ownerUser?.email || '',
      displayName: ownerUser?.firstName || 'Owner',
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });
    
    return family;
  }
  
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }
  
  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, inviteCode));
    return family;
  }
  
  async getUserFamilies(userId: string): Promise<Family[]> {
    // Get families where user is owner or member
    const memberFamilies = await db
      .select({ familyId: familyMembers.familyId })
      .from(familyMembers)
      .where(and(
        eq(familyMembers.userId, userId),
        eq(familyMembers.status, 'active')
      ));
    
    const familyIds = memberFamilies.map(m => m.familyId);
    if (familyIds.length === 0) return [];
    
    const result: Family[] = [];
    for (const familyId of familyIds) {
      const [family] = await db.select().from(families).where(
        and(eq(families.id, familyId), eq(families.isActive, true))
      );
      if (family) result.push(family);
    }
    return result;
  }
  
  async updateFamily(id: number, updates: Partial<InsertFamily>): Promise<Family | undefined> {
    const [family] = await db
      .update(families)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(families.id, id))
      .returning();
    return family;
  }
  
  async deleteFamily(id: number): Promise<boolean> {
    await db.update(families).set({ isActive: false, updatedAt: new Date() }).where(eq(families.id, id));
    return true;
  }
  
  // Family Member operations
  async addFamilyMember(memberData: InsertFamilyMember): Promise<FamilyMember> {
    const [member] = await db.insert(familyMembers).values(memberData).returning();
    return member;
  }
  
  async getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.status, 'active')));
  }
  
  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const [member] = await db.select().from(familyMembers).where(eq(familyMembers.id, id));
    return member;
  }
  
  async getFamilyMemberByEmail(familyId: number, email: string): Promise<FamilyMember | undefined> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.email, email)));
    return member;
  }
  
  async updateFamilyMember(id: number, updates: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const [member] = await db
      .update(familyMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(familyMembers.id, id))
      .returning();
    return member;
  }
  
  async removeFamilyMember(id: number): Promise<boolean> {
    await db
      .update(familyMembers)
      .set({ status: 'removed', removedAt: new Date(), updatedAt: new Date() })
      .where(eq(familyMembers.id, id));
    return true;
  }
  
  // Shared Subscription operations
  async createSharedSubscription(data: InsertSharedSubscription): Promise<SharedSubscription> {
    const [shared] = await db.insert(sharedSubscriptions).values(data).returning();
    return shared;
  }
  
  async getSharedSubscriptions(familyId: number): Promise<SharedSubscription[]> {
    return await db
      .select()
      .from(sharedSubscriptions)
      .where(and(eq(sharedSubscriptions.familyId, familyId), eq(sharedSubscriptions.isActive, true)));
  }
  
  async getSharedSubscription(id: number): Promise<SharedSubscription | undefined> {
    const [shared] = await db.select().from(sharedSubscriptions).where(eq(sharedSubscriptions.id, id));
    return shared;
  }
  
  async updateSharedSubscription(id: number, updates: Partial<InsertSharedSubscription>): Promise<SharedSubscription | undefined> {
    const [shared] = await db
      .update(sharedSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedSubscriptions.id, id))
      .returning();
    return shared;
  }
  
  async deleteSharedSubscription(id: number): Promise<boolean> {
    await db.update(sharedSubscriptions).set({ isActive: false, updatedAt: new Date() }).where(eq(sharedSubscriptions.id, id));
    return true;
  }
  
  // Subscription Share operations
  async createSubscriptionShare(data: InsertSubscriptionShare): Promise<SubscriptionShare> {
    const [share] = await db.insert(subscriptionShares).values(data).returning();
    return share;
  }
  
  async getSubscriptionShares(sharedSubscriptionId: number): Promise<SubscriptionShare[]> {
    return await db
      .select()
      .from(subscriptionShares)
      .where(eq(subscriptionShares.sharedSubscriptionId, sharedSubscriptionId));
  }
  
  async updateSubscriptionShare(id: number, updates: Partial<InsertSubscriptionShare>): Promise<SubscriptionShare | undefined> {
    const [share] = await db
      .update(subscriptionShares)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionShares.id, id))
      .returning();
    return share;
  }
  
  async deleteSubscriptionShare(id: number): Promise<boolean> {
    await db.delete(subscriptionShares).where(eq(subscriptionShares.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
