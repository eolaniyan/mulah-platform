import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Categories for transaction classification
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(), // groceries, rent, bills, transport, etc.
  icon: varchar("icon").default("fa-tag"),
  color: varchar("color").default("#6B7280"),
  isSystem: boolean("is_system").default(true), // true = predefined, false = user-created
  parentId: integer("parent_id"), // for subcategories
  createdAt: timestamp("created_at").defaultNow(),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  hasUsedUSW: boolean("has_used_usw").default(false),
  uswRunCount: integer("usw_run_count").default(0),
  firstUSWRunAt: timestamp("first_usw_run_at"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  planTier: varchar("plan_tier"), // Basic, Standard, Premium, etc.
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // monthly, yearly, weekly, custom
  nextBillingDate: timestamp("next_billing_date").notNull(),
  category: varchar("category").notNull(),
  categoryId: integer("category_id").references(() => categories.id), // FK to categories table
  description: text("description"),
  iconColor: varchar("icon_color").default("#1B5A52"),
  iconName: varchar("icon_name").default("fa-star"),
  isActive: boolean("is_active").default(true).notNull(),
  status: varchar("status").default("active"), // active, paused, cancelled
  controlMethod: varchar("control_method").default("self_service"), // mulah_merchant, api, self_service, concierge (derived from service or set manually)
  linkedAccountId: integer("linked_account_id"), // linked bank account (FK to bankConnections)
  averageBillingAmount: decimal("average_billing_amount", { precision: 10, scale: 2 }), // calculated from transaction history
  detectedFromTransactions: boolean("detected_from_transactions").default(false), // true if auto-detected
  archivedAt: timestamp("archived_at"), // soft-delete without canceling (for external merchants)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const waitlistSignups = pgTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Virtual Cards for Stripe Issuing integration
export const virtualCards = pgTable("virtual_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripeCardId: varchar("stripe_card_id").unique().notNull(),
  last4: varchar("last_4", { length: 4 }).notNull(),
  brand: varchar("brand").notNull(), // visa, mastercard, etc.
  status: varchar("status").notNull(), // active, inactive, canceled
  spendingLimit: decimal("spending_limit", { precision: 10, scale: 2 }),
  merchantRestrictions: text("merchant_restrictions").array(),
  assignedToSubscription: integer("assigned_to_subscription").references(() => subscriptions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// USW Transactions for monthly fund collection/disbursement
export const uswTransactions = pgTable("usw_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // collection, disbursement, fee
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: varchar("status").notNull(), // pending, completed, failed, refunded
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  scheduledFor: timestamp("scheduled_for"),
  processedAt: timestamp("processed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Merchant Sync via Mulah Mesh
export const merchantSync = pgTable("merchant_sync", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  merchantName: varchar("merchant_name").notNull(),
  syncStatus: varchar("sync_status").notNull(), // pending, synced, failed, unsupported
  billingAnchorDate: integer("billing_anchor_date"), // 1-28 or 31 for month-end
  lastSyncAt: timestamp("last_sync_at"),
  nextAttemptAt: timestamp("next_attempt_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// BNPL Buffer transactions with Klarna
export const bufferTransactions = pgTable("buffer_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  provider: varchar("provider").notNull(), // klarna, afterpay, etc.
  providerTransactionId: varchar("provider_transaction_id"),
  status: varchar("status").notNull(), // pending, approved, declined, paid
  dueDate: timestamp("due_date"),
  repaidAt: timestamp("repaid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank Account connections for Open Banking
export const bankConnections = pgTable("bank_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bankName: varchar("bank_name").notNull(),
  accountType: varchar("account_type").notNull(), // checking, savings, credit
  last4: varchar("last_4", { length: 4 }).notNull(),
  openBankingId: varchar("open_banking_id").unique().notNull(),
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank Transactions from Open Banking sync
export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bankConnectionId: integer("bank_connection_id").references(() => bankConnections.id).notNull(),
  transactionId: varchar("transaction_id").unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  direction: varchar("direction").default("out").notNull(), // 'in' (income) or 'out' (expense)
  description: text("description").notNull(),
  rawDescription: text("raw_description"), // original bank description before normalization
  merchantName: varchar("merchant_name"),
  category: varchar("category"), // AI-classified category (legacy)
  categoryId: integer("category_id").references(() => categories.id), // FK to categories table
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence score
  subscriptionId: integer("subscription_id").references(() => subscriptions.id), // if matched to subscription
  transactionDate: timestamp("transaction_date").notNull(),
  isRecurring: boolean("is_recurring").default(false), // true if detected as recurring payment
  isSubscriptionPayment: boolean("is_subscription_payment").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Events for webhook processing
export const paymentEvents = pgTable("payment_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type").notNull(), // payment_succeeded, payment_failed, etc.
  provider: varchar("provider").notNull(), // stripe, klarna, bank
  providerEventId: varchar("provider_event_id").unique().notNull(),
  relatedTransactionId: varchar("related_transaction_id"),
  status: varchar("status").notNull(), // processed, failed, retry
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  eventData: jsonb("event_data"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing Cycles - tracks payment status per billing period
export const billingCycles = pgTable("billing_cycles", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  // Status based on control method:
  // mulah_merchant: scheduled -> processing -> settled (auto-pay via virtual card)
  // api: scheduled -> confirmed (via webhook from connected service)
  // self_service/concierge: pending_confirmation -> confirmed (user marks paid externally)
  status: varchar("status").notNull().default("scheduled"), // scheduled, processing, settled, pending_confirmation, confirmed, failed
  controlMethod: varchar("control_method").notNull(), // mulah_merchant, api, self_service, concierge (matches serviceDirectory)
  paymentMethod: varchar("payment_method"), // virtual_card, bank_transfer, external
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  confirmedAt: timestamp("confirmed_at"), // when user confirmed (for external) or webhook confirmed
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Insights and classifications
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  insightType: varchar("insight_type").notNull(), // spending_pattern, subscription_suggestion, budget_alert
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  actionable: boolean("actionable").default(true),
  priority: varchar("priority").notNull(), // low, medium, high, urgent
  relatedTransactionId: integer("related_transaction_id").references(() => bankTransactions.id),
  relatedSubscriptionId: integer("related_subscription_id").references(() => subscriptions.id),
  metadata: jsonb("metadata"),
  viewedAt: timestamp("viewed_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budgets and spending limits
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  category: varchar("category"), // entertainment, productivity, etc.
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).notNull(),
  currentSpend: decimal("current_spend", { precision: 10, scale: 2 }).default("0"),
  alertThreshold: decimal("alert_threshold", { precision: 3, scale: 2 }).default("0.8"), // 80%
  isActive: boolean("is_active").default(true),
  resetDay: integer("reset_day").default(1), // day of month to reset
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type VirtualCard = typeof virtualCards.$inferSelect;
export type USWTransaction = typeof uswTransactions.$inferSelect;
export type MerchantSync = typeof merchantSync.$inferSelect;
export type BufferTransaction = typeof bufferTransactions.$inferSelect;
export type BankConnection = typeof bankConnections.$inferSelect;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BillingCycle = typeof billingCycles.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlistSignups).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBankConnectionSchema = createInsertSchema(bankConnections).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertBillingCycleSchema = createInsertSchema(billingCycles).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertBillingCycle = z.infer<typeof insertBillingCycleSchema>;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type InsertVirtualCard = z.infer<typeof insertVirtualCardSchema>;
export type InsertBankConnection = z.infer<typeof insertBankConnectionSchema>;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;

// Support Cases Schema
export const supportCases = pgTable('support_cases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  caseNumber: text('case_number').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'subscription', 'payment', 'account', 'technical', 'other'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: text('status').notNull().default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  source: text('source').notNull(), // 'contextual', 'support_center', 'proactive'
  pageContext: text('page_context'), // URL where issue was reported
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info'),
  errorLogs: jsonb('error_logs'),
  systemState: jsonb('system_state'),
  irisAnalysis: jsonb('iris_analysis'),
  autoResolved: boolean('auto_resolved').default(false),
  assignedTo: text('assigned_to'), // admin user ID
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Support Case Messages/Updates
export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').references(() => supportCases.id).notNull(),
  authorId: text('author_id').notNull(),
  authorType: text('author_type').notNull(), // 'user', 'admin', 'iris'
  message: text('message').notNull(),
  isInternal: boolean('is_internal').default(false), // visible to admins only
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Proactive Issue Detection
export const proactiveAlerts = pgTable('proactive_alerts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  alertType: text('alert_type').notNull(), // 'failed_action', 'repeated_attempts', 'error_pattern'
  severity: text('severity').notNull(), // 'low', 'medium', 'high'
  description: text('description').notNull(),
  triggerData: jsonb('trigger_data'),
  actionTaken: text('action_taken'), // 'case_created', 'auto_resolved', 'ignored'
  caseId: integer('case_id').references(() => supportCases.id),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Support schema types and validation
// Note: userId is omitted as it's added server-side from the authenticated session
export const insertSupportCaseSchema = createInsertSchema(supportCases).omit({ 
  id: true, 
  userId: true,
  createdAt: true, 
  updatedAt: true, 
  caseNumber: true 
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProactiveAlertSchema = createInsertSchema(proactiveAlerts).omit({ 
  id: true, 
  createdAt: true 
});

export type SupportCase = typeof supportCases.$inferSelect;
export type NewSupportCase = z.infer<typeof insertSupportCaseSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type ProactiveAlert = typeof proactiveAlerts.$inferSelect;
export type NewProactiveAlert = z.infer<typeof insertProactiveAlertSchema>;

// ===== SUBSCRIPTION CONTROL LAYER =====

// Service Directory - Catalog of known services with control methods
export const serviceDirectory = pgTable("service_directory", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  category: varchar("category").notNull(),
  logoUrl: varchar("logo_url"),
  websiteUrl: varchar("website_url"),
  controlMethod: varchar("control_method").notNull(), // 'mulah_merchant', 'api', 'concierge', 'self_service'
  apiProvider: varchar("api_provider"), // 'stripe', 'chargebee', 'custom', null
  apiEndpoint: varchar("api_endpoint"),
  cancellationUrl: varchar("cancellation_url"),
  pauseSupported: boolean("pause_supported").default(false),
  cancellationInstructions: text("cancellation_instructions"),
  pauseInstructions: text("pause_instructions"),
  estimatedCancellationTime: varchar("estimated_cancellation_time"), // '5 minutes', '24-48 hours'
  requiredInfo: text("required_info").array(), // ['email', 'account_number', 'last4']
  conciergeEmailTemplate: text("concierge_email_template"),
  conciergeMerchantEmail: varchar("concierge_merchant_email"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Concierge Requests - Track cancellation/pause requests handled by Mulah team
export const conciergeRequests = pgTable("concierge_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  serviceId: integer("service_id").references(() => serviceDirectory.id),
  requestType: varchar("request_type").notNull(), // 'cancel', 'pause', 'downgrade', 'billing_date_change'
  status: varchar("status").notNull().default("pending"), // 'pending', 'in_progress', 'awaiting_merchant', 'completed', 'failed'
  priority: varchar("priority").default("normal"), // 'normal', 'urgent'
  userEmail: varchar("user_email"),
  userAccountInfo: jsonb("user_account_info"), // encrypted user details for merchant
  merchantResponse: text("merchant_response"),
  internalNotes: text("internal_notes"),
  emailsSent: jsonb("emails_sent"), // array of {sentAt, template, to}
  completedAction: varchar("completed_action"), // 'cancelled', 'paused', 'downgraded', 'refunded'
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchants - Businesses using Mulah as their billing engine
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  businessName: varchar("business_name").notNull(),
  slug: varchar("slug").notNull().unique(),
  businessEmail: varchar("business_email").notNull(),
  businessType: varchar("business_type").notNull(), // 'saas', 'gym', 'service', 'media', 'education'
  logoUrl: varchar("logo_url"),
  websiteUrl: varchar("website_url"),
  stripeConnectId: varchar("stripe_connect_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  billingAnchorFlexible: boolean("billing_anchor_flexible").default(true), // allows user to choose billing date
  pauseEnabled: boolean("pause_enabled").default(true),
  cancelEnabled: boolean("cancel_enabled").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchant Plans - Subscription plans offered by merchants
export const merchantPlans = pgTable("merchant_plans", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // 'monthly', 'yearly', 'weekly'
  trialDays: integer("trial_days").default(0),
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  stripePriceId: varchar("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchant Customers - Subscribers to merchant plans via Mulah
export const merchantCustomers = pgTable("merchant_customers", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => merchantPlans.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id), // link to user's subscription record
  status: varchar("status").notNull().default("active"), // 'active', 'paused', 'cancelled', 'past_due'
  billingAnchorDay: integer("billing_anchor_day").notNull(), // 1-28 user's preferred billing day
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  pausedAt: timestamp("paused_at"),
  pauseResumeDate: timestamp("pause_resume_date"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Household Bills - Rent, utilities, insurance, etc.
export const householdBills = pgTable("household_bills", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // 'rent', 'utilities', 'insurance', 'loan', 'other'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // 'monthly', 'quarterly', 'yearly'
  dueDay: integer("due_day").notNull(), // 1-28 day of month
  payee: varchar("payee"), // who receives payment
  accountReference: varchar("account_reference"), // account/reference number
  paymentMethod: varchar("payment_method"), // 'direct_debit', 'bank_transfer', 'card'
  isAutoPay: boolean("is_auto_pay").default(false),
  reminderDaysBefore: integer("reminder_days_before").default(3),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Control Action Log - Audit trail of all control actions
export const controlActionLog = pgTable("control_action_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  conciergeRequestId: integer("concierge_request_id").references(() => conciergeRequests.id),
  actionType: varchar("action_type").notNull(), // 'cancel', 'pause', 'resume', 'downgrade', 'upgrade', 'billing_change'
  controlMethod: varchar("control_method").notNull(), // 'mulah_merchant', 'api', 'concierge', 'self_service'
  status: varchar("status").notNull(), // 'initiated', 'pending', 'completed', 'failed'
  requestedAt: timestamp("requested_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

// API Connections - Store user account connections for API-controlled services
export const apiConnections = pgTable("api_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  serviceSlug: varchar("service_slug").notNull(), // matches serviceDirectory.slug
  status: varchar("status").notNull().default("disconnected"), // 'disconnected', 'pending', 'connected', 'error'
  connectedEmail: varchar("connected_email"), // email used to connect
  lastSyncedAt: timestamp("last_synced_at"),
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"), // store additional data from API
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Demo Scenario State - Store state for complex demo scenarios
export const demoScenarioState = pgTable("demo_scenario_state", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  scenarioType: varchar("scenario_type").notNull(), // 'skyshield', 'unityhub', 'pilates', 'fusionstream', 'trialbox'
  state: jsonb("state").notNull(), // scenario-specific state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas and types for new tables
export const insertServiceDirectorySchema = createInsertSchema(serviceDirectory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConciergeRequestSchema = createInsertSchema(conciergeRequests).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantPlanSchema = createInsertSchema(merchantPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantCustomerSchema = createInsertSchema(merchantCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHouseholdBillSchema = createInsertSchema(householdBills).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertControlActionLogSchema = createInsertSchema(controlActionLog).omit({
  id: true,
  requestedAt: true,
});

export type ServiceDirectory = typeof serviceDirectory.$inferSelect;
export type InsertServiceDirectory = z.infer<typeof insertServiceDirectorySchema>;
export type ConciergeRequest = typeof conciergeRequests.$inferSelect;
export type InsertConciergeRequest = z.infer<typeof insertConciergeRequestSchema>;
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type MerchantPlan = typeof merchantPlans.$inferSelect;
export type InsertMerchantPlan = z.infer<typeof insertMerchantPlanSchema>;
export type MerchantCustomer = typeof merchantCustomers.$inferSelect;
export type InsertMerchantCustomer = z.infer<typeof insertMerchantCustomerSchema>;
export type HouseholdBill = typeof householdBills.$inferSelect;
export type InsertHouseholdBill = z.infer<typeof insertHouseholdBillSchema>;
export type ControlActionLog = typeof controlActionLog.$inferSelect;
export type InsertControlActionLog = z.infer<typeof insertControlActionLogSchema>;

export const insertApiConnectionSchema = createInsertSchema(apiConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemoScenarioStateSchema = createInsertSchema(demoScenarioState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApiConnection = typeof apiConnections.$inferSelect;
export type InsertApiConnection = z.infer<typeof insertApiConnectionSchema>;
export type DemoScenarioState = typeof demoScenarioState.$inferSelect;
export type InsertDemoScenarioState = z.infer<typeof insertDemoScenarioStateSchema>;

// ===== APP CONFIGURATION =====

// App Configuration - Key-value store for app settings (USW fees, feature flags, etc.)
export const appConfig = pgTable("app_config", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false), // if true, can be fetched without auth
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service Plans - Plans offered by services in the directory (external services, not Mulah merchants)
export const servicePlans = pgTable("service_plans", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => serviceDirectory.id).notNull(),
  name: varchar("name").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  features: text("features").array(),
  isPopular: boolean("is_popular").default(false),
  isFamilyEligible: boolean("is_family_eligible").default(false), // true for family/shared plans that can be cost-split
  maxFamilyMembers: integer("max_family_members"), // max users for family plans (e.g., 6 for Spotify Family)
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServicePlanSchema = createInsertSchema(servicePlans).omit({
  id: true,
  createdAt: true,
});

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type ServicePlan = typeof servicePlans.$inferSelect;
export type InsertServicePlan = z.infer<typeof insertServicePlanSchema>;

// ===== FAMILY / SHARED SUBSCRIPTION MANAGEMENT =====

// Families - Groups of users who share subscriptions
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  delegateMemberId: integer("delegate_member_id"), // optional backup admin who can edit splits (FK added after familyMembers)
  inviteCode: varchar("invite_code").unique(), // shareable code for invites
  maxMembers: integer("max_members").default(6),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family Members - Users belonging to a family
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // null if invited but not yet registered
  email: varchar("email"), // optional - null for manually added members
  displayName: varchar("display_name").notNull(),
  role: varchar("role").notNull().default("member"), // 'owner', 'delegate', 'member' (only owner and 1 delegate can edit splits)
  status: varchar("status").notNull().default("pending"), // 'pending', 'active', 'removed'
  isManual: boolean("is_manual").default(false), // true if added manually without email/account
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  removedAt: timestamp("removed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shared Subscriptions - Subscriptions shared within a family
export const sharedSubscriptions = pgTable("shared_subscriptions", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(), // who pays/manages
  splitType: varchar("split_type").notNull().default("equal"), // 'equal', 'custom', 'owner_pays'
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  maxSlots: integer("max_slots").default(6), // max users that can use this subscription
  usedSlots: integer("used_slots").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Shares - Individual member shares for a shared subscription
export const subscriptionShares = pgTable("subscription_shares", {
  id: serial("id").primaryKey(),
  sharedSubscriptionId: integer("shared_subscription_id").references(() => sharedSubscriptions.id).notNull(),
  familyMemberId: integer("family_member_id").references(() => familyMembers.id).notNull(),
  shareType: varchar("share_type").notNull().default("equal"), // 'equal', 'percentage', 'fixed' - determines how share is calculated
  shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(), // calculated amount to pay
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }), // used when shareType='percentage'
  isLocked: boolean("is_locked").default(false), // if true, this member's share won't auto-recalculate on changes
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  status: varchar("status").notNull().default("active"), // 'active', 'paused', 'removed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for family tables
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  ownerId: true,
  inviteCode: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedSubscriptionSchema = createInsertSchema(sharedSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionShareSchema = createInsertSchema(subscriptionShares).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for family management
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type SharedSubscription = typeof sharedSubscriptions.$inferSelect;
export type InsertSharedSubscription = z.infer<typeof insertSharedSubscriptionSchema>;
export type SubscriptionShare = typeof subscriptionShares.$inferSelect;
export type InsertSubscriptionShare = z.infer<typeof insertSubscriptionShareSchema>;
