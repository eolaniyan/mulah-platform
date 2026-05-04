import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionsApi,
  type Subscription,
  type CreateSubscriptionInput,
} from "../api/subscriptions";

const SUBSCRIPTIONS_KEY = ["/api/subscriptions"];

export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: SUBSCRIPTIONS_KEY,
    queryFn: () => subscriptionsApi.getAll(),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubscriptionInput) => subscriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSubscriptionInput> }) =>
      subscriptionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subscriptionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

export function useDetectSubscriptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionIds?: number[]) => subscriptionsApi.detect(transactionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

export function useSubscriptionManagement() {
  return useQuery({
    queryKey: ["/api/subscriptions/management"],
    queryFn: () => subscriptionsApi.getManagement(),
  });
}

export function useSubscriptionFamilyEligibility(id: number) {
  return useQuery({
    queryKey: ["/api/subscriptions", id, "family-eligibility"],
    queryFn: () => subscriptionsApi.getFamilyEligibility(id),
    enabled: id > 0,
  });
}
