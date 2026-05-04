import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { HubProvider } from "@/contexts/HubContext";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionHubLayout } from "@/components/SubscriptionHubLayout";
import { FinanceHubLayout } from "@/components/FinanceHubLayout";
import GetStarted from "@/pages/GetStarted";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AddSubscription from "@/pages/AddSubscription";
import Analytics from "@/pages/Analytics";
import USW from "@/pages/USW";
import IRIS from "@/pages/IRIS";
import Support from "@/pages/Support";
import Waitlist from "@/pages/Waitlist";
import ProactiveHelpProvider from "@/components/ProactiveHelpProvider";
import OnboardingTour from "@/components/OnboardingTour";
import Profile from "@/pages/Profile";
import Cashflow from "@/pages/Cashflow";
import BillCalendar from "@/pages/BillCalendar";
import CFAInsights from "@/pages/CFAInsights";
import SubscriptionControl from "@/pages/SubscriptionControl";
import ConciergeRequests from "@/pages/ConciergeRequests";
import Family from "@/pages/Family";
import VirtualCards from "@/pages/VirtualCards";
import NotFound from "@/pages/not-found";

function SubscriptionDashboard() {
  return (
    <SubscriptionHubLayout title="Subscriptions">
      <Dashboard />
    </SubscriptionHubLayout>
  );
}

function SubscriptionAdd() {
  return (
    <SubscriptionHubLayout title="Add Subscription">
      <AddSubscription />
    </SubscriptionHubLayout>
  );
}

function SubscriptionUSW() {
  return (
    <SubscriptionHubLayout title="Unified Wallet">
      <USW />
    </SubscriptionHubLayout>
  );
}

function SubscriptionCards() {
  return (
    <SubscriptionHubLayout title="Virtual Cards">
      <VirtualCards />
    </SubscriptionHubLayout>
  );
}

function SubscriptionFamily() {
  return (
    <SubscriptionHubLayout title="Family Sharing">
      <Family />
    </SubscriptionHubLayout>
  );
}

function SubscriptionCalendar() {
  return (
    <SubscriptionHubLayout title="Bill Calendar">
      <BillCalendar />
    </SubscriptionHubLayout>
  );
}

function SubscriptionConcierge() {
  return (
    <SubscriptionHubLayout title="Concierge">
      <ConciergeRequests />
    </SubscriptionHubLayout>
  );
}

function SubscriptionControlPage() {
  return (
    <SubscriptionHubLayout title="Subscription Control">
      <SubscriptionControl />
    </SubscriptionHubLayout>
  );
}

function FinanceCashflow() {
  return (
    <FinanceHubLayout title="Cashflow">
      <Cashflow />
    </FinanceHubLayout>
  );
}

function FinanceInsights() {
  return (
    <FinanceHubLayout title="Insights">
      <CFAInsights />
    </FinanceHubLayout>
  );
}

function FinanceAnalytics() {
  return (
    <FinanceHubLayout title="Analytics">
      <Analytics />
    </FinanceHubLayout>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-900 text-2xl font-bold">M</span>
          </div>
          <p className="text-white/80 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const hasCompletedOnboarding = (user as any)?.hasCompletedOnboarding || tourCompleted;
  const needsOnboarding = isAuthenticated && !hasCompletedOnboarding;

  if (needsOnboarding && !showTour) {
    setShowTour(true);
  }

  return (
    <>
    {showTour && !tourCompleted && (
      <OnboardingTour onComplete={() => {
        setTourCompleted(true);
        setShowTour(false);
      }} />
    )}
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={GetStarted} />
          <Route path="/waitlist" component={Waitlist} />
        </>
      ) : (
        <>
          {/* Home - No bottom nav */}
          <Route path="/" component={Home} />
          
          {/* Subscription Hub pages */}
          <Route path="/subscriptions" component={SubscriptionDashboard} />
          <Route path="/add" component={SubscriptionAdd} />
          <Route path="/usw" component={SubscriptionUSW} />
          <Route path="/cards" component={SubscriptionCards} />
          <Route path="/family" component={SubscriptionFamily} />
          <Route path="/calendar" component={SubscriptionCalendar} />
          <Route path="/concierge" component={SubscriptionConcierge} />
          <Route path="/subscriptions/control/:id" component={SubscriptionControlPage} />
          
          {/* Finance Hub pages */}
          <Route path="/cashflow" component={FinanceCashflow} />
          <Route path="/insights" component={FinanceInsights} />
          <Route path="/analytics" component={FinanceAnalytics} />
          
          {/* Standalone pages */}
          <Route path="/iris" component={IRIS} />
          <Route path="/support" component={Support} />
          <Route path="/profile" component={Profile} />
          <Route path="/waitlist" component={Waitlist} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
    <ProactiveHelpProvider />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="mulah-ui-theme">
        <HubProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </HubProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
