import React from 'react';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  setApiBaseUrl,
  setTokenProvider,
  setUnauthorizedHandler,
} from '@mulah/shared-logic';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://your-app.replit.app';

setApiBaseUrl(API_BASE);
setTokenProvider(() => SecureStore.getItemAsync('auth_token'));
setUnauthorizedHandler(async () => {
  await SecureStore.deleteItemAsync('auth_token');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
