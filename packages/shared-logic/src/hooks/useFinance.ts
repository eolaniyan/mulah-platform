import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  virtualCardsApi,
  bankApi,
  budgetsApi,
  uswApi,
  meshApi,
  bufferApi,
  paymentsApi,
  categoriesApi,
  type CreateVirtualCardInput,
} from "../api/finance";

// ─── Virtual Cards ────────────────────────────────────────────────────────────

export function useVirtualCards() {
  return useQuery({
    queryKey: ["/api/virtual-cards"],
    queryFn: () => virtualCardsApi.getAll(),
  });
}

export function useCreateVirtualCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVirtualCardInput) => virtualCardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
    },
  });
}

export function useDeleteVirtualCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => virtualCardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
    },
  });
}

// ─── Bank ─────────────────────────────────────────────────────────────────────

export function useBankConnections() {
  return useQuery({
    queryKey: ["/api/bank-connections"],
    queryFn: () => bankApi.getConnections(),
  });
}

export function useBankTransactions() {
  return useQuery({
    queryKey: ["/api/bank-transactions"],
    queryFn: () => bankApi.getTransactions(),
  });
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export function useBudgets() {
  return useQuery({
    queryKey: ["/api/budgets"],
    queryFn: () => budgetsApi.getAll(),
  });
}

// ─── USW ─────────────────────────────────────────────────────────────────────

export function useUSWCalculation() {
  return useQuery({
    queryKey: ["/api/usw/calculate"],
    queryFn: () => uswApi.calculate(),
  });
}

export function useUSWTransactions() {
  return useQuery({
    queryKey: ["/api/usw/transactions"],
    queryFn: () => uswApi.getTransactions(),
  });
}

export function useRunUSW() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionIds?: number[]) => uswApi.run(subscriptionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usw/calculate"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usw/transactions"] });
    },
  });
}

// ─── Mesh ─────────────────────────────────────────────────────────────────────

export function useMeshMerchants() {
  return useQuery({
    queryKey: ["/api/mesh/supported-merchants"],
    queryFn: () => meshApi.getSupportedMerchants(),
  });
}

// ─── Buffer ───────────────────────────────────────────────────────────────────

export function useBufferTransactions() {
  return useQuery({
    queryKey: ["/api/buffer-transactions"],
    queryFn: () => bufferApi.getTransactions(),
  });
}

export function useBufferExposure() {
  return useQuery({
    queryKey: ["/api/buffer/exposure"],
    queryFn: () => bufferApi.getExposure(),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useUpcomingPayments() {
  return useQuery({
    queryKey: ["/api/payments/upcoming"],
    queryFn: () => paymentsApi.getUpcoming(),
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => categoriesApi.getAll(),
    staleTime: Infinity,
  });
}
