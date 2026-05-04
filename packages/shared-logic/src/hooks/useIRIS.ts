import { useQuery, useMutation } from "@tanstack/react-query";
import { irisApi, type IRISMessage } from "../api/iris";

export function useIRISNavigation() {
  return useQuery({
    queryKey: ["/api/iris/navigation"],
    queryFn: () => irisApi.getNavigation(),
    staleTime: 30_000,
  });
}

export function useIRISPages() {
  return useQuery({
    queryKey: ["/api/iris/pages"],
    queryFn: () => irisApi.getPages(),
  });
}

export function useIRISAsk() {
  return useMutation({
    mutationFn: ({
      message,
      context,
    }: {
      message: string;
      context?: Record<string, unknown>;
    }) => irisApi.ask(message, context),
  });
}

export function useIRISBehaviorAnalysis() {
  return useMutation({
    mutationFn: (sessionData: Record<string, unknown>) =>
      irisApi.analyzeBehavior(sessionData),
  });
}

export function buildIRISContext(messages: IRISMessage[]) {
  return {
    messageCount: messages.length,
    lastUserMessage: messages.filter((m) => m.role === "user").at(-1)?.content,
    sessionStarted: messages[0]?.timestamp,
  };
}
