import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export interface Subscription {
  id: number;
  userId: string;
  name: string;
  planTier?: string | null;
  cost: string;
  currency: string;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  categoryId?: number | null;
  description?: string | null;
  iconColor?: string | null;
  iconName?: string | null;
  isActive: boolean;
  status?: string | null;
  controlMethod?: string | null;
  linkedAccountId?: number | null;
  averageBillingAmount?: string | null;
  detectedFromTransactions?: boolean;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubscriptionInput {
  name: string;
  planTier?: string;
  cost: string;
  currency?: string;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  description?: string;
  iconColor?: string;
  iconName?: string;
}

export interface DetectedSubscription {
  id: string;
  merchantName: string;
  description: string;
  averageAmount: number;
  frequency: "weekly" | "monthly" | "yearly";
  estimatedInterval: number;
  transactionCount: number;
  confidence: number;
  lastPaymentDate: string;
  nextEstimatedDate: string;
  matchedTransactionIds: number[];
  existingSubscriptionId?: number;
}

export interface SubscriptionManagement {
  id: number;
  name: string;
  tier: string;
  controlMethod: string;
  cancelUrl?: string;
  supportEmail?: string;
  canPause: boolean;
  canDowngrade: boolean;
  alternatives?: Array<{ name: string; savings: number }>;
}

export const subscriptionsApi = {
  getAll: () => apiGet<Subscription[]>("/api/subscriptions"),
  create: (data: CreateSubscriptionInput) =>
    apiPost<Subscription>("/api/subscriptions", data),
  update: (id: number, data: Partial<CreateSubscriptionInput>) =>
    apiPut<Subscription>(`/api/subscriptions/${id}`, data),
  delete: (id: number) => apiDelete<{ message: string }>(`/api/subscriptions/${id}`),
  deleteAll: () => apiDelete<{ message: string }>("/api/subscriptions/all"),
  detect: (transactionIds?: number[]) =>
    apiPost<DetectedSubscription[]>("/api/subscriptions/detect", { transactionIds }),
  getManagement: () =>
    apiGet<SubscriptionManagement[]>("/api/subscriptions/management"),
  getFamilyEligibility: (id: number) =>
    apiGet<{ eligible: boolean; reason?: string }>(
      `/api/subscriptions/${id}/family-eligibility`
    ),
};
