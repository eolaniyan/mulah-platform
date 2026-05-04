import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// ─── Virtual Cards ────────────────────────────────────────────────────────────

export interface VirtualCard {
  id: number;
  userId: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
  spendLimit?: string | null;
  currency: string;
  linkedSubscriptionId?: number | null;
  createdAt?: string;
}

export interface CreateVirtualCardInput {
  spendLimit?: string;
  currency?: string;
  linkedSubscriptionId?: number;
}

export const virtualCardsApi = {
  getAll: () => apiGet<VirtualCard[]>("/api/virtual-cards"),
  create: (data: CreateVirtualCardInput) =>
    apiPost<VirtualCard>("/api/virtual-cards", data),
  update: (id: number, data: Partial<VirtualCard>) =>
    apiPatch<VirtualCard>(`/api/virtual-cards/${id}`, data),
  delete: (id: number) =>
    apiDelete<{ message: string }>(`/api/virtual-cards/${id}`),
};

// ─── Bank Connections ─────────────────────────────────────────────────────────

export interface BankConnection {
  id: number;
  userId: string;
  provider: string;
  accountName: string;
  accountType: string;
  status: string;
  lastSyncAt?: string | null;
  createdAt?: string;
}

export interface BankTransaction {
  id: number;
  bankConnectionId: number;
  transactionDate: string;
  amount: string;
  description: string;
  merchantName?: string | null;
  category?: string | null;
  direction: "in" | "out";
  isRecurring?: boolean;
  createdAt?: string;
}

export const bankApi = {
  getConnections: () => apiGet<BankConnection[]>("/api/bank-connections"),
  createConnection: (data: Partial<BankConnection>) =>
    apiPost<BankConnection>("/api/bank-connections", data),
  getTransactions: () => apiGet<BankTransaction[]>("/api/bank-transactions"),
};

// ─── Budgets ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: number;
  userId: string;
  category: string;
  amount: string;
  currency: string;
  period: string;
  createdAt?: string;
}

export const budgetsApi = {
  getAll: () => apiGet<Budget[]>("/api/budgets"),
  create: (data: Partial<Budget>) => apiPost<Budget>("/api/budgets", data),
};

// ─── USW (Unified Subscription Wallet) ───────────────────────────────────────

export interface USWCalculation {
  totalMonthly: number;
  totalAnnual: number;
  potentialSavings: number;
  subscriptionCount: number;
  breakdown: Array<{ name: string; cost: number; dueDate: string }>;
}

export interface USWTransaction {
  id: number;
  type: "collect" | "disburse";
  amount: string;
  description: string;
  createdAt: string;
}

export const uswApi = {
  calculate: () => apiGet<USWCalculation>("/api/usw/calculate"),
  run: (subscriptionIds?: number[]) =>
    apiPost<{ success: boolean; message: string }>("/api/usw/run", {
      subscriptionIds,
    }),
  collectFunds: (amount: number) =>
    apiPost<USWTransaction>("/api/usw/collect-funds", { amount }),
  disburseFunds: (subscriptionId: number) =>
    apiPost<USWTransaction>("/api/usw/disburse-funds", { subscriptionId }),
  getTransactions: () => apiGet<USWTransaction[]>("/api/usw/transactions"),
};

// ─── Mesh (Billing Anchor Negotiation) ───────────────────────────────────────

export interface MeshMerchant {
  id: string;
  name: string;
  supportsAnchoring: boolean;
  supportedDates: number[];
}

export const meshApi = {
  getSupportedMerchants: () =>
    apiGet<MeshMerchant[]>("/api/mesh/supported-merchants"),
  negotiateAnchor: (subscriptionId: number, preferredDate: number) =>
    apiPost<{ success: boolean; newDate?: string }>(
      "/api/mesh/negotiate-anchor",
      { subscriptionId, preferredDate }
    ),
  bulkReschedule: (targetDate: number) =>
    apiPost<{ rescheduled: number }>("/api/mesh/bulk-reschedule", {
      targetDate,
    }),
};

// ─── Buffer / BNPL ────────────────────────────────────────────────────────────

export interface BufferTransaction {
  id: number;
  userId: string;
  amount: string;
  provider: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

export const bufferApi = {
  getTransactions: () =>
    apiGet<BufferTransaction[]>("/api/buffer-transactions"),
  createTransaction: (data: Partial<BufferTransaction>) =>
    apiPost<BufferTransaction>("/api/buffer-transactions", data),
  getProviders: () => apiGet<unknown[]>("/api/buffer/providers"),
  initiateBNPL: (subscriptionId: number, amount: number) =>
    apiPost<BufferTransaction>("/api/buffer/initiate-bnpl", {
      subscriptionId,
      amount,
    }),
  getActiveBNPL: () => apiGet<BufferTransaction[]>("/api/buffer/active-bnpl"),
  getExposure: () =>
    apiGet<{ total: number; limit: number }>("/api/buffer/exposure"),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface UpcomingPayment {
  id: number;
  name: string;
  amount: string;
  dueDate: string;
  status: string;
}

export const paymentsApi = {
  getUpcoming: () => apiGet<UpcomingPayment[]>("/api/payments/upcoming"),
  schedule: (subscriptionId: number, date: string) =>
    apiPost<{ success: boolean }>("/api/payments/schedule", {
      subscriptionId,
      date,
    }),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

export const categoriesApi = {
  getAll: () => apiGet<Category[]>("/api/categories"),
  categorize: (description: string, amount?: number) =>
    apiPost<{ category: string; categorySlug: string; confidence: number }>(
      "/api/categorize",
      { description, amount }
    ),
};

// ─── Support ──────────────────────────────────────────────────────────────────

export interface SupportCase {
  id: number;
  userId: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export const supportApi = {
  createCase: (data: { subject: string; description: string; priority?: string }) =>
    apiPost<SupportCase>("/api/support/cases", data),
  getCases: () => apiGet<SupportCase[]>("/api/support/cases"),
};

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const waitlistApi = {
  join: (email: string) => apiPost<{ success: boolean }>("/api/waitlist", { email }),
  getCount: () => apiGet<{ count: number }>("/api/waitlist/count"),
};

// ─── Demo ─────────────────────────────────────────────────────────────────────

export const demoApi = {
  populate: () => apiPost<{ message: string }>("/api/demo/populate"),
  clear: () => apiDelete<{ message: string }>("/api/demo/clear"),
};
