import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigationState } from '@react-navigation/native';

type HubType = 'subscriptions' | 'finance' | 'none';

interface HubContextType {
  currentHub: HubType;
  isInHub: boolean;
  hubName: string;
}

const HubContext = createContext<HubContextType>({
  currentHub: 'none',
  isInHub: false,
  hubName: '',
});

const subscriptionRoutes = ['SubscriptionDashboard', 'AddSubscription', 'USW', 'VirtualCards', 'Family', 'Calendar', 'Concierge'];
const financeRoutes = ['Cashflow', 'Insights', 'Analytics'];

export function HubProvider({ children }: { children: ReactNode }) {
  const routeName = useNavigationState(state => {
    if (!state) return '';
    const route = state.routes[state.index];
    return route?.name || '';
  });

  let value: HubContextType = {
    currentHub: 'none',
    isInHub: false,
    hubName: '',
  };

  if (subscriptionRoutes.includes(routeName)) {
    value = {
      currentHub: 'subscriptions',
      isInHub: true,
      hubName: 'Subscription Hub',
    };
  } else if (financeRoutes.includes(routeName)) {
    value = {
      currentHub: 'finance',
      isInHub: true,
      hubName: 'Finance Hub',
    };
  }

  return (
    <HubContext.Provider value={value}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  return useContext(HubContext);
}
