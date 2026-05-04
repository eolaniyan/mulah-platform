import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Shield,
  Settings2,
  Info,
  Calendar,
  CreditCard,
  Zap,
  ArrowRight
} from "lucide-react";

interface USWCalculation {
  subscriptionTotal: number;
  mulahFee: number;
  totalCharge: number;
  isPremium: boolean;
  canRun: boolean;
  message: string;
  nextRunDate: string;
  breakdown: {
    monthly: number;
    yearly: number;
    weekly: number;
    subscriptionCount: number;
  };
}

interface ConciergeRequest {
  id: number;
  subscriptionId: number;
  requestType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
}

interface USWFeeConfig {
  baseFee: number;
  perSubscriptionFee: number;
  freeSubscriptions: number;
  premiumDiscount: number;
  currency: string;
}

const DEFAULT_FEE_CONFIG: USWFeeConfig = {
  baseFee: 3.99,
  perSubscriptionFee: 1.00,
  freeSubscriptions: 3,
  premiumDiscount: 1.0,
  currency: "EUR"
};

function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

function USWOnboardingView({ 
  uswCalculation, 
  onEnroll, 
  isEnrolling,
  feeConfig
}: { 
  uswCalculation: USWCalculation;
  onEnroll: () => void;
  isEnrolling: boolean;
  feeConfig: USWFeeConfig;
}) {
  const subscriptionCount = uswCalculation.breakdown.subscriptionCount;

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-center">
        <div className="text-5xl mb-3">💰</div>
        <h2 className="text-xl font-bold text-white mb-2">Unified Subscription Wallet</h2>
        <p className="text-emerald-100 text-sm mb-4">
          One monthly payment. All your subscriptions covered.
        </p>
        
        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 mb-4">
          <div className="text-emerald-100 text-xs uppercase tracking-wider mb-1">Your Monthly Total</div>
          <div className="text-3xl font-bold text-white">{formatEuro(uswCalculation.totalCharge)}</div>
          <div className="text-emerald-200 text-xs mt-1">
            {subscriptionCount} subscriptions + {uswCalculation.isPremium ? "no fees" : "service fee"}
          </div>
        </div>

        {uswCalculation.canRun ? (
          <Button
            onClick={onEnroll}
            className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
            disabled={isEnrolling}
            data-testid="button-enroll-usw"
          >
            {isEnrolling ? "Enrolling..." : "Enroll in USW"}
          </Button>
        ) : (
          <div className="bg-white/10 rounded-xl p-3 text-emerald-100 text-sm">
            {uswCalculation.message}
          </div>
        )}
      </div>

      {/* How It Works */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800">How USW Works</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">You Pay Once</h4>
              <p className="text-xs text-gray-600">Single monthly charge to your preferred payment method</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">We Handle Everything</h4>
              <p className="text-xs text-gray-600">Mulah pays all your subscriptions on time, every time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">Never Miss a Payment</h4>
              <p className="text-xs text-gray-600">All services stay active without you tracking dates</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fee Breakdown */}
      <Card className="p-5 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800">Fee Breakdown</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Base fee covers payment processing. Per-subscription fee applies after {feeConfig.freeSubscriptions} free subscriptions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Subscription Total</span>
            <span className="font-semibold text-gray-800">{formatEuro(uswCalculation.subscriptionTotal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-gray-600 text-sm">Base Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Covers secure payment processing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium text-gray-700">
              {uswCalculation.isPremium ? (
                <span className="text-emerald-600">€0.00 (Premium)</span>
              ) : (
                formatEuro(feeConfig.baseFee)
              )}
            </span>
          </div>
          
          {subscriptionCount > feeConfig.freeSubscriptions && !uswCalculation.isPremium && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-gray-600 text-sm">Extra Subscriptions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{subscriptionCount - feeConfig.freeSubscriptions} additional × €{feeConfig.perSubscriptionFee.toFixed(2)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium text-gray-700">
                {formatEuro((subscriptionCount - feeConfig.freeSubscriptions) * feeConfig.perSubscriptionFee)}
              </span>
            </div>
          )}
          
          <hr className="border-gray-200" />
          
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg -mx-1">
            <span className="font-bold text-gray-800">Total Monthly Payment</span>
            <span className="font-bold text-emerald-600 text-lg">{formatEuro(uswCalculation.totalCharge)}</span>
          </div>
        </div>
      </Card>

      {/* Benefits */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Why Use USW?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, text: "One billing date" },
            { icon: Shield, text: "Never miss payments" },
            { icon: CreditCard, text: "Simplified budgeting" },
            { icon: Zap, text: "Full control" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <Icon className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-gray-700">{text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function USWDashboardView({ 
  uswCalculation,
  user,
  conciergeRequests 
}: { 
  uswCalculation: USWCalculation;
  user: any;
  conciergeRequests: ConciergeRequest[];
}) {
  const [, navigate] = useLocation();
  const subscriptionCount = uswCalculation.breakdown.subscriptionCount;
  const activeRequests = conciergeRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = conciergeRequests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-600 text-white text-xs">Active</Badge>
              {uswCalculation.isPremium && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs">Premium</Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-800">USW Wallet</h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Next charge</div>
            <div className="text-sm font-semibold text-gray-700">
              {new Date(uswCalculation.nextRunDate).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monthly Payment</div>
            <div className="text-3xl font-bold text-emerald-600">{formatEuro(uswCalculation.totalCharge)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {subscriptionCount} subscription{subscriptionCount !== 1 ? 's' : ''} covered
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">{user?.uswRunCount || 0}</div>
            <div className="text-xs text-gray-500">Runs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">{subscriptionCount}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">
              {formatEuro(uswCalculation.isPremium ? uswCalculation.mulahFee : 0)}
            </div>
            <div className="text-xs text-gray-500">Saved</div>
          </div>
        </div>
      </Card>

      {/* Payment Breakdown */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-bold text-base mb-3 text-gray-800">Payment Breakdown</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Subscriptions</span>
            <span className="font-medium text-gray-800">{formatEuro(uswCalculation.subscriptionTotal)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Service Fee</span>
            {uswCalculation.isPremium ? (
              <span className="text-emerald-600 font-medium">€0.00 (Premium)</span>
            ) : (
              <span className="font-medium text-gray-800">{formatEuro(uswCalculation.mulahFee)}</span>
            )}
          </div>
          
          <hr className="border-gray-100" />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-emerald-600">{formatEuro(uswCalculation.totalCharge)}</span>
          </div>
        </div>
      </Card>

      {/* Subscription Breakdown by Cycle */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="font-bold text-base mb-3 text-gray-800">Billing Cycle Breakdown</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Monthly subscriptions</span>
            <span className="font-medium text-gray-800">{formatEuro(uswCalculation.breakdown.monthly)}</span>
          </div>
          {uswCalculation.breakdown.yearly > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Yearly (converted)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Annual costs divided by 12</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium text-gray-800">{formatEuro(uswCalculation.breakdown.yearly / 12)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-5 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-gray-800">Subscription Control</h3>
          {activeRequests.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
              {activeRequests.length} active
            </Badge>
          )}
        </div>

        {activeRequests.length > 0 ? (
          <div className="space-y-2 mb-3">
            {activeRequests.slice(0, 2).map((request) => (
              <div 
                key={request.id}
                className="bg-gray-50 rounded-lg p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {request.status === 'pending' ? (
                    <Clock className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <Users className="h-3 w-3 text-blue-500 animate-pulse" />
                  )}
                  <span className="text-xs font-medium capitalize">{request.requestType}</span>
                </div>
                <Progress value={request.status === 'pending' ? 25 : 50} className="w-12 h-1" />
              </div>
            ))}
          </div>
        ) : completedRequests.length > 0 ? (
          <div className="bg-emerald-50 rounded-lg p-2 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span className="text-xs text-emerald-700">All requests completed</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1 text-xs"
            onClick={() => navigate('/dashboard')}
            data-testid="button-manage-subscriptions"
          >
            <Settings2 className="h-3 w-3" />
            Manage
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1 text-xs"
            onClick={() => navigate('/concierge')}
            data-testid="button-view-concierge"
          >
            <Users className="h-3 w-3" />
            Concierge
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function USW() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);

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

  const { data: uswCalculation, isLoading: calculationLoading } = useQuery<USWCalculation>({
    queryKey: ["/api/usw/calculate"],
    enabled: isAuthenticated,
  });

  const { data: conciergeRequests = [] } = useQuery<ConciergeRequest[]>({
    queryKey: ["/api/concierge/requests"],
    enabled: isAuthenticated,
  });

  const { data: appConfigData } = useQuery<Record<string, any>>({
    queryKey: ["/api/config"],
  });
  
  const feeConfig: USWFeeConfig = appConfigData?.usw_fees || DEFAULT_FEE_CONFIG;

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/usw/run");
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.isFirstRun) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
      
      toast({
        title: data.isFirstRun ? "Welcome to USW!" : "USW Updated",
        description: data.isFirstRun 
          ? "You're now enrolled. Your subscriptions are consolidated!" 
          : "Your USW wallet has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usw/calculate"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in USW",
        variant: "destructive",
      });
    },
  });

  const isEnrolled = (user as any)?.hasUsedUSW;

  if (authLoading || calculationLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!uswCalculation) return null;

  return (
    <>
      <div className="mobile-container min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mobile-header bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {isEnrolled ? "USW Wallet" : "Unified Subscription Wallet"}
            </h1>
            <p className="text-xs text-gray-500">
              {isEnrolled ? "Your consolidated payments" : "One payment. All subscriptions."}
            </p>
          </div>
          <Badge variant={uswCalculation.isPremium ? "default" : "secondary"} className="text-xs">
            {uswCalculation.isPremium ? "Premium" : "Free"}
          </Badge>
        </div>

        <div className="mobile-content pb-32">
          {isEnrolled ? (
            <USWDashboardView 
              uswCalculation={uswCalculation}
              user={user}
              conciergeRequests={conciergeRequests}
            />
          ) : (
            <USWOnboardingView 
              uswCalculation={uswCalculation}
              onEnroll={() => enrollMutation.mutate()}
              isEnrolling={enrollMutation.isPending}
              feeConfig={feeConfig}
            />
          )}
        </div>
      </div>
      
      {/* First-Run Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                backgroundColor: ['#10b981', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <Card className="bg-white max-w-sm mx-4 p-6 text-center shadow-xl">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to USW!</h2>
              <p className="text-gray-600 text-sm mb-4">
                Your subscriptions are now consolidated into one simple payment.
              </p>
              <div className="bg-emerald-50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">One Payment</span>
                  <ArrowRight className="h-4 w-4" />
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">All Covered</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowCelebration(false)} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Got it!
              </Button>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
