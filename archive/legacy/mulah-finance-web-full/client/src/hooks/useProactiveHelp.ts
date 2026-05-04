import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface UserAction {
  type: 'page_view' | 'click' | 'form_error' | 'api_error' | 'navigation' | 'scroll' | 'idle' | 'focus_loss';
  page: string;
  element?: string;
  error?: string;
  timestamp: number;
  duration?: number;
  context?: Record<string, any>;
}

interface ProactiveAlert {
  id: string;
  type: 'confusion' | 'error_pattern' | 'abandoned_flow' | 'repeated_action' | 'stuck';
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number;
  page: string;
  context: Record<string, any>;
}

// Dismissal cooldown storage key
const DISMISSAL_KEY = 'proactive_help_dismissed';
const DISMISSAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown

function getDismissedAlerts(): Record<string, number> {
  try {
    const stored = localStorage.getItem(DISMISSAL_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setDismissedAlert(alertType: string): void {
  try {
    const dismissed = getDismissedAlerts();
    dismissed[alertType] = Date.now();
    localStorage.setItem(DISMISSAL_KEY, JSON.stringify(dismissed));
  } catch {
    // Ignore storage errors
  }
}

function isAlertDismissed(alertType: string): boolean {
  const dismissed = getDismissedAlerts();
  const dismissedAt = dismissed[alertType];
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < DISMISSAL_COOLDOWN_MS;
}

export function useProactiveHelp() {
  const { isAuthenticated } = useAuth();
  const [actions, setActions] = useState<UserAction[]>([]);
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const pageStartTime = useRef<number>(Date.now());
  const lastActivity = useRef<number>(Date.now());
  const clickPattern = useRef<Array<{ element: string; timestamp: number }>>([]);
  const scrollPattern = useRef<Array<{ position: number; timestamp: number }>>([]);
  const errorPattern = useRef<Array<{ error: string; timestamp: number }>>([]);

  // Send behavioral data to IRIS for analysis
  const analyzeActionsMutation = useMutation({
    mutationFn: (behaviorData: any) => apiRequest('POST', '/api/iris/analyze-behavior', behaviorData),
    onSuccess: (response: any) => {
      if (response.alerts && response.alerts.length > 0) {
        setAlerts(prev => [...prev, ...response.alerts]);
      }
    }
  });

  // Track user action
  const trackAction = useCallback((action: Omit<UserAction, 'timestamp'>) => {
    if (!isAuthenticated || !isMonitoring) return;

    const fullAction: UserAction = {
      ...action,
      timestamp: Date.now()
    };

    setActions(prev => {
      const newActions = [...prev, fullAction];
      // Keep only last 50 actions for analysis
      return newActions.slice(-50);
    });

    lastActivity.current = Date.now();

    // Immediate pattern detection
    detectImmediatePatterns(fullAction);
  }, [isAuthenticated, isMonitoring]);

  // Detect immediate concerning patterns
  const detectImmediatePatterns = useCallback((action: UserAction) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    switch (action.type) {
      case 'click':
        // Track rapid clicking on same element (increased threshold to reduce false positives)
        if (action.element) {
          // Ignore navigation elements and common UI components
          const isNavigationElement = action.element.includes('nav') || 
            action.element.includes('link') || 
            action.element.includes('button') ||
            action.element.includes('profile') ||
            action.element.includes('menu');
          
          if (!isNavigationElement) {
            clickPattern.current.push({ element: action.element, timestamp: now });
            clickPattern.current = clickPattern.current.filter(c => c.timestamp > fiveMinutesAgo);
            
            // Increased threshold from 5 to 10 clicks and within 30 seconds
            const thirtySecondsAgo = now - 30 * 1000;
            const recentSameClicks = clickPattern.current.filter(
              c => c.element === action.element && c.timestamp > thirtySecondsAgo
            );
            if (recentSameClicks.length >= 10) {
              generateAlert({
                type: 'repeated_action',
                title: 'Having trouble with this button?',
                description: 'I noticed you\'ve clicked this button several times. Let me help you!',
                suggestedAction: 'Open contextual help for this page',
                confidence: 0.8,
                page: action.page,
                context: { element: action.element, clicks: recentSameClicks.length }
              });
            }
          }
        }
        break;

      case 'form_error':
      case 'api_error':
        // Track error patterns
        if (action.error) {
          errorPattern.current.push({ error: action.error, timestamp: now });
          errorPattern.current = errorPattern.current.filter(e => e.timestamp > fiveMinutesAgo);
          
          if (errorPattern.current.length >= 3) {
            generateAlert({
              type: 'error_pattern',
              title: 'Multiple errors detected',
              description: 'You\'ve encountered several errors. I can help troubleshoot this issue.',
              suggestedAction: 'Create support case with error details',
              confidence: 0.9,
              page: action.page,
              context: { errors: errorPattern.current.slice(-3) }
            });
          }
        }
        break;

      case 'scroll':
        // Track excessive scrolling (possible confusion) - MUCH higher threshold
        if (action.context?.position !== undefined) {
          scrollPattern.current.push({ position: action.context.position, timestamp: now });
          // Only keep events from last 90 seconds
          const ninetySecondsAgo = now - 90 * 1000;
          scrollPattern.current = scrollPattern.current.filter(s => s.timestamp > ninetySecondsAgo);
          
          // Require 60+ scroll events over 90 seconds (very excessive scrolling)
          if (scrollPattern.current.length >= 60) {
            generateAlert({
              type: 'confusion',
              title: 'Looking for something specific?',
              description: 'I noticed you\'re scrolling around quite a bit. Can I help you find what you\'re looking for?',
              suggestedAction: 'Show quick navigation or search',
              confidence: 0.85,
              page: action.page,
              context: { scrollEvents: scrollPattern.current.length }
            });
            // Clear scroll pattern after generating alert to prevent rapid re-triggers
            scrollPattern.current = [];
          }
        }
        break;
    }
  }, []);

  // Generate proactive alert with dismissal cooldown check
  const generateAlert = useCallback((alert: Omit<ProactiveAlert, 'id'>) => {
    // Check if this alert type was recently dismissed - respect user's choice
    if (isAlertDismissed(alert.type)) {
      return; // Don't show alerts user recently dismissed
    }
    
    // Require minimum 0.85 confidence to show alert
    if (alert.confidence < 0.85) {
      return; // Don't show low confidence alerts
    }

    const newAlert: ProactiveAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9)
    };

    setAlerts(prev => {
      // Prevent duplicate alerts for same issue within 10 minutes
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentSimilar = prev.find(a => 
        a.type === alert.type && 
        a.page === alert.page && 
        Date.now() - parseInt(a.id, 36) < tenMinutesAgo
      );
      
      if (recentSimilar) return prev;
      
      return [...prev, newAlert];
    });
  }, []);

  // Set up monitoring
  useEffect(() => {
    if (!isAuthenticated) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);
    pageStartTime.current = Date.now();
    
    // Track page view
    trackAction({
      type: 'page_view',
      page: window.location.pathname
    });

    // Set up event listeners
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Handle SVG elements which have SVGAnimatedString for className
      let classNameStr = '';
      try {
        const cn = target.className;
        if (cn) {
          if (typeof cn === 'string') {
            classNameStr = cn;
          } else if (typeof cn === 'object' && 'baseVal' in cn) {
            // SVGAnimatedString
            classNameStr = (cn as SVGAnimatedString).baseVal;
          }
        }
      } catch {
        // Ignore errors getting className
      }
      
      const element = target.tagName.toLowerCase() + 
        (classNameStr ? '.' + classNameStr.replace(/\s+/g, '.') : '') +
        (target.id ? '#' + target.id : '');
      
      trackAction({
        type: 'click',
        page: window.location.pathname,
        element
      });
    };

    const handleScroll = () => {
      trackAction({
        type: 'scroll',
        page: window.location.pathname,
        context: { position: window.scrollY }
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackAction({
          type: 'focus_loss',
          page: window.location.pathname,
          duration: Date.now() - lastActivity.current
        });
      }
    };

    // Idle detection
    const idleTimeout = setInterval(() => {
      const idleTime = Date.now() - lastActivity.current;
      if (idleTime > 30000) { // 30 seconds idle
        trackAction({
          type: 'idle',
          page: window.location.pathname,
          duration: idleTime
        });
      }
    }, 30000);

    // Add listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(idleTimeout);
    };
  }, [isAuthenticated, trackAction]);

  // Send batch analysis to IRIS every 2 minutes
  useEffect(() => {
    if (!isAuthenticated || actions.length === 0) return;

    const interval = setInterval(() => {
      if (actions.length >= 5) {
        const behaviorData = {
          actions: actions.slice(-20), // Last 20 actions
          page: window.location.pathname,
          sessionDuration: Date.now() - pageStartTime.current,
          patterns: {
            clicks: clickPattern.current.slice(-10),
            scrolls: scrollPattern.current.slice(-10),
            errors: errorPattern.current.slice(-5)
          }
        };

        analyzeActionsMutation.mutate(behaviorData);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [actions, isAuthenticated, analyzeActionsMutation]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    // Find the alert type before removing it
    setAlerts(prev => {
      const alert = prev.find(a => a.id === alertId);
      if (alert) {
        // Store dismissal in localStorage for cooldown
        setDismissedAlert(alert.type);
        // Clear related patterns when dismissed
        if (alert.type === 'confusion') {
          scrollPattern.current = [];
        } else if (alert.type === 'repeated_action') {
          clickPattern.current = [];
        } else if (alert.type === 'error_pattern') {
          errorPattern.current = [];
        }
      }
      return prev.filter(a => a.id !== alertId);
    });
  }, []);

  // Track specific error
  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    trackAction({
      type: 'api_error',
      page: window.location.pathname,
      error,
      context
    });
  }, [trackAction]);

  // Track form error
  const trackFormError = useCallback((error: string, field?: string) => {
    trackAction({
      type: 'form_error',
      page: window.location.pathname,
      error,
      element: field,
    });
  }, [trackAction]);

  return {
    alerts,
    isMonitoring,
    trackAction,
    trackError,
    trackFormError,
    dismissAlert,
    actions: actions.slice(-10) // For debugging
  };
}