import { apiGet, apiPost } from "./client";

/** GET /api/services — optional ?category= */
export const servicesCatalogApi = {
  getAll: (category?: string) =>
    apiGet<unknown[]>(
      `/api/services${category ? `?category=${encodeURIComponent(category)}` : ""}`
    ),
};

export const configApi = {
  get: () => apiGet<Record<string, unknown>>("/api/config"),
};

export const familiesApi = {
  list: () => apiGet<unknown[]>("/api/families"),
  get: (id: number) => apiGet<unknown>(`/api/families/${id}`),
  create: (name: string, maxMembers?: number) =>
    apiPost<unknown>("/api/families", { name, maxMembers }),
  invite: (familyId: number, email: string) =>
    apiPost<unknown>(`/api/families/${familyId}/invite`, { email }),
};

export const conciergeApi = {
  list: () => apiGet<unknown[]>("/api/concierge/requests"),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/api/concierge/requests", body),
};
