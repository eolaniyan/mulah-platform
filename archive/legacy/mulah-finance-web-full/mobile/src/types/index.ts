export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPremium?: boolean;
  hasCompletedOnboarding?: boolean;
}

export interface Subscription {
  id: number;
  userId: string;
  name: string;
  cost: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category: string;
  description?: string;
  nextBillingDate: string;
  currency: string;
  iconColor?: string;
  iconName?: string;
  isActive: boolean;
  status?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ServiceDirectory {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
  logoUrl?: string;
  defaultIcon?: string;
  defaultColor?: string;
}

export interface ServicePlan {
  id: number;
  serviceId: number;
  name: string;
  price: string;
  currency: string;
  billingCycle: string;
  features?: string[];
  isFamilyEligible?: boolean;
}

export interface Analytics {
  monthlyTotal: number;
  annualTotal: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
  upcomingRenewals: Subscription[];
}

export interface CashflowData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  subscriptionExpenses: number;
}

export interface VirtualCard {
  id: number;
  userId: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  spendingLimit?: string;
  isFrozen: boolean;
  subscriptionId?: number;
  createdAt: string;
}

export interface FamilyMember {
  id: number;
  familyId: number;
  userId: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
}

export interface ConciergeRequest {
  id: number;
  userId: string;
  subscriptionId?: number;
  requestType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  createdAt: string;
}

export interface CFAInsight {
  category: string;
  score: number;
  recommendation: string;
  trend: 'up' | 'down' | 'stable';
}

export interface USWConfig {
  baseFee: number;
  premiumFee: number;
  percentageFee: number;
  premiumPercentageFee: number;
  currency: string;
  maxNonPremiumCharge: number;
}
