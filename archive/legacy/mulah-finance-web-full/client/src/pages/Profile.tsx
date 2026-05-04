import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  ChevronRight, 
  Crown, 
  Bell, 
  HelpCircle, 
  LogOut,
  Wallet,
  CreditCard,
  TrendingDown,
  Settings,
  Shield,
  Sparkles,
  Play,
  Trash2,
  Database
} from "lucide-react";
import OnboardingTour from "@/components/OnboardingTour";
import type { Subscription } from "@shared/schema";

function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTour, setShowTour] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  const typedUser = user as any;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
  });

  const monthlySpend = subscriptions.reduce((total, sub) => {
    const rawCost = typeof sub.cost === 'string' ? parseFloat(sub.cost) : sub.cost;
    const cost = isNaN(rawCost) || rawCost == null ? 0 : rawCost;
    if (sub.billingCycle === 'yearly') return total + cost / 12;
    if (sub.billingCycle === 'weekly') return total + cost * 4.33;
    return total + cost;
  }, 0);

  const annualSpend = monthlySpend * 12;

  const demoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/demo/populate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/annual"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      toast({
        title: "Demo Data Added",
        description: "Sample subscriptions added for testing.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add demo data",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/demo/clear", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/annual"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      toast({
        title: "Data Cleared",
        description: "All your data has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-2xl"></div>
            <div className="h-20 bg-gray-200 rounded-xl"></div>
            <div className="h-16 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = typedUser?.firstName?.[0] || typedUser?.email?.[0]?.toUpperCase() || 'U';
  const userName = typedUser?.firstName && typedUser?.lastName 
    ? `${typedUser.firstName} ${typedUser.lastName}`
    : typedUser?.email?.split('@')[0] || 'User';

  return (
    <>
      <div className="mobile-container min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 pt-8 pb-16 px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-white/90">Profile</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center ring-2 ring-white/30">
              {typedUser?.profileImageUrl ? (
                <img 
                  src={typedUser.profileImageUrl} 
                  alt={userName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">{userInitial}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <p className="text-white/70 text-sm">{typedUser?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {typedUser?.isPremium ? (
                  <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                ) : (
                  <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                    Free Plan
                  </Badge>
                )}
                {typedUser?.hasUsedUSW && (
                  <Badge className="bg-emerald-400/20 text-emerald-200 border-emerald-400/30 text-xs">
                    <Wallet className="h-3 w-3 mr-1" />
                    USW Member
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Overlapping Header */}
        <div className="px-4 -mt-10">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{subscriptions.length}</div>
                  <div className="text-xs text-gray-500">Subscriptions</div>
                </div>
                <div className="border-x border-gray-100">
                  <div className="text-2xl font-bold text-emerald-600">{formatEuro(monthlySpend)}</div>
                  <div className="text-xs text-gray-500">Monthly</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{formatEuro(annualSpend)}</div>
                  <div className="text-xs text-gray-500">Yearly</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-4 pb-32">
          
          {/* Premium Upgrade (for non-premium users) */}
          {!typedUser?.isPremium && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">Upgrade to Premium</h3>
                    <p className="text-xs text-gray-600">No USW fees, priority support</p>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                    €9.99/mo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Account</h3>
            <Card className="border-0 shadow-sm">
              <div className="divide-y divide-gray-100">
                <MenuItem 
                  icon={<Wallet className="h-5 w-5 text-emerald-600" />}
                  label="USW Wallet"
                  sublabel={typedUser?.hasUsedUSW ? `${typedUser?.uswRunCount || 1} runs` : "Not enrolled"}
                  href="/usw"
                />
                <MenuItem 
                  icon={<CreditCard className="h-5 w-5 text-blue-600" />}
                  label="Payment Methods"
                  sublabel="Manage cards"
                  disabled
                  badge="Soon"
                />
                <MenuItem 
                  icon={<TrendingDown className="h-5 w-5 text-purple-600" />}
                  label="Spending Insights"
                  sublabel="View analytics"
                  href="/insights"
                />
              </div>
            </Card>
          </div>

          {/* Preferences Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Preferences</h3>
            <Card className="border-0 shadow-sm">
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Renewal Alerts</p>
                      <p className="text-xs text-gray-500">3 days before billing</p>
                    </div>
                  </div>
                  <Switch defaultChecked data-testid="switch-renewal-alerts" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">USW Notifications</p>
                      <p className="text-xs text-gray-500">Monthly confirmations</p>
                    </div>
                  </div>
                  <Switch defaultChecked data-testid="switch-usw-notifications" />
                </div>
              </div>
            </Card>
          </div>

          {/* Support Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Support</h3>
            <Card className="border-0 shadow-sm">
              <div className="divide-y divide-gray-100">
                <MenuItem 
                  icon={<Play className="h-5 w-5 text-emerald-600" />}
                  label="App Tour"
                  sublabel="Replay walkthrough"
                  onClick={() => setShowTour(true)}
                />
                <MenuItem 
                  icon={<HelpCircle className="h-5 w-5 text-blue-600" />}
                  label="Help & FAQ"
                  sublabel="Get answers"
                  disabled
                />
                <MenuItem 
                  icon={<Sparkles className="h-5 w-5 text-purple-600" />}
                  label="What's New"
                  sublabel="v1.0 MVP"
                  disabled
                />
              </div>
            </Card>
          </div>

          {/* Developer Tools (Collapsible) */}
          <div className="space-y-1">
            <button 
              className="flex items-center justify-between w-full px-1 py-2"
              onClick={() => setShowDevTools(!showDevTools)}
            >
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Developer Tools</h3>
              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showDevTools ? 'rotate-90' : ''}`} />
            </button>
            
            {showDevTools && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <Button
                    onClick={() => demoMutation.mutate()}
                    disabled={demoMutation.isPending}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    data-testid="button-add-demo"
                  >
                    <Database className="h-4 w-4 text-blue-600" />
                    <span>{demoMutation.isPending ? "Adding..." : "Add Demo Data"}</span>
                  </Button>
                  <Button
                    onClick={() => clearDataMutation.mutate()}
                    disabled={clearDataMutation.isPending}
                    variant="outline"
                    className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
                    data-testid="button-clear-data"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{clearDataMutation.isPending ? "Clearing..." : "Clear All Data"}</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sign Out */}
          <Button
            onClick={() => window.location.href = '/api/logout'}
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
      
      {showTour && (
        <OnboardingTour onComplete={() => setShowTour(false)} />
      )}
    </>
  );
}

function MenuItem({ 
  icon, 
  label, 
  sublabel, 
  href, 
  onClick,
  disabled,
  badge
}: { 
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  const content = (
    <div className={`flex items-center justify-between p-4 ${disabled ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer active:bg-gray-100'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <Badge variant="secondary" className="text-xs bg-gray-100">{badge}</Badge>
        )}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );

  if (disabled) {
    return content;
  }

  if (href) {
    return (
      <Link href={href}>
        <div className="block cursor-pointer">{content}</div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}
