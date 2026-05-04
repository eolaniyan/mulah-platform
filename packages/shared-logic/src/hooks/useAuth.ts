import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type MulahUser } from "../api/auth";

export function useAuth() {
  const { data: user, isLoading } = useQuery<MulahUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        return await authApi.getUser();
      } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith("401")) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: !!(user as MulahUser & { isAdmin?: boolean })?.isAdmin,
    isSuperAdmin: !!(user as MulahUser & { isSuperAdmin?: boolean })?.isSuperAdmin,
  };
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
