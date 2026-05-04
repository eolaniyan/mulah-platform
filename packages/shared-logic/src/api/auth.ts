import { apiGet, apiPost } from "./client";

export interface MulahUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  isPremium?: boolean;
  hasUsedUSW?: boolean;
  uswRunCount?: number;
  hasCompletedOnboarding?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const authApi = {
  getUser: () => apiGet<MulahUser>("/api/auth/user"),
  completeOnboarding: () => apiPost<MulahUser>("/api/auth/onboarding-complete"),
};
