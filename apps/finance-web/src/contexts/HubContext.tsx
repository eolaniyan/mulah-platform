import { createContext, useContext, useMemo } from "react";
import { useLocation } from "wouter";

type HubType = "subscriptions" | "finance" | "none";

interface HubContextValue {
  currentHub: HubType;
  isInHub: boolean;
  hubName: string;
}

const HubContext = createContext<HubContextValue>({
  currentHub: "none",
  isInHub: false,
  hubName: "",
});

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const value = useMemo(() => {
    if (location.startsWith("/subscriptions") || 
        location === "/add" || 
        location === "/usw" || 
        location === "/cards" ||
        location === "/family" || 
        location === "/calendar" || 
        location === "/concierge" ||
        location.startsWith("/subscriptions/")) {
      return {
        currentHub: "subscriptions" as HubType,
        isInHub: true,
        hubName: "Subscription Hub",
      };
    }
    
    if (location.startsWith("/finance") || 
        location === "/cashflow" || 
        location === "/insights" || 
        location === "/analytics") {
      return {
        currentHub: "finance" as HubType,
        isInHub: true,
        hubName: "Finance Hub",
      };
    }

    return {
      currentHub: "none" as HubType,
      isInHub: false,
      hubName: "",
    };
  }, [location]);

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  return useContext(HubContext);
}
