export type ControlMethod = 'mulah_merchant' | 'api' | 'self_service' | 'concierge';

export interface ControlMethodActions {
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
  canDowngrade: boolean;
  isInstant: boolean;
  requiresConnection: boolean;
  requiresConcierge: boolean;
  showSteps: boolean;
  uiStyle: 'instant' | 'automated' | 'guided' | 'request';
}

export const CONTROL_METHOD_ACTIONS: Record<ControlMethod, ControlMethodActions> = {
  mulah_merchant: {
    canPause: true,
    canResume: true,
    canCancel: true,
    canDowngrade: true,
    isInstant: true,
    requiresConnection: false,
    requiresConcierge: false,
    showSteps: false,
    uiStyle: 'instant',
  },
  api: {
    canPause: true,
    canResume: true,
    canCancel: true,
    canDowngrade: true,
    isInstant: true,
    requiresConnection: true,
    requiresConcierge: false,
    showSteps: false,
    uiStyle: 'automated',
  },
  self_service: {
    canPause: false,
    canResume: false,
    canCancel: true,
    canDowngrade: true,
    isInstant: false,
    requiresConnection: false,
    requiresConcierge: false,
    showSteps: true,
    uiStyle: 'guided',
  },
  concierge: {
    canPause: true,
    canResume: true,
    canCancel: true,
    canDowngrade: true,
    isInstant: false,
    requiresConnection: false,
    requiresConcierge: true,
    showSteps: false,
    uiStyle: 'request',
  },
};

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatEuro = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};
