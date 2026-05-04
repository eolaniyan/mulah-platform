import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-app.replit.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  getUser: () => api.get('/api/auth/user'),
  logout: () => api.post('/api/logout'),
};

export const subscriptionsApi = {
  getAll: () => api.get('/api/subscriptions'),
  getOne: (id: number) => api.get(`/api/subscriptions/${id}`),
  create: (data: any) => api.post('/api/subscriptions', data),
  update: (id: number, data: any) => api.patch(`/api/subscriptions/${id}`, data),
  delete: (id: number) => api.delete(`/api/subscriptions/${id}`),
};

export const analyticsApi = {
  getSummary: () => api.get('/api/analytics'),
  getCashflow: () => api.get('/api/analytics/cashflow'),
  getCategoryTotals: () => api.get('/api/analytics/category-totals'),
};

export const servicesApi = {
  getAll: (category?: string) => api.get('/api/services', { params: { category } }),
  getCategories: () => api.get('/api/categories'),
};

export const configApi = {
  get: () => api.get('/api/config'),
};

export const cfaApi = {
  getSummary: () => api.get('/api/cfa/summary'),
};

export const familyApi = {
  getFamily: () => api.get('/api/family'),
  createFamily: (name: string) => api.post('/api/family', { name }),
  inviteMember: (email: string) => api.post('/api/family/invite', { email }),
  getMembers: () => api.get('/api/family/members'),
};

export const cardsApi = {
  getAll: () => api.get('/api/virtual-cards'),
  create: (data: any) => api.post('/api/virtual-cards', data),
  freeze: (id: number) => api.post(`/api/virtual-cards/${id}/freeze`),
  unfreeze: (id: number) => api.post(`/api/virtual-cards/${id}/unfreeze`),
};

export const conciergeApi = {
  getRequests: () => api.get('/api/concierge-requests'),
  createRequest: (data: any) => api.post('/api/concierge-requests', data),
};

export const irisApi = {
  chat: (message: string, context?: any) => api.post('/api/iris/chat', { message, context }),
  getInsights: () => api.get('/api/iris/insights'),
};

export default api;
