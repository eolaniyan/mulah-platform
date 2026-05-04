import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription } from "@shared/schema";
import { 
  CreditCard, 
  TrendingUp, 
  Euro, 
  Calendar, 
  Users, 
  Wallet,
  ChevronRight,
  Sparkles,
  List,
  PieChart,
  Lightbulb,
  Headphones,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface Analytics {
  monthlyTotal: number;
  annualTotal: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
  upcomingRenewals: Subscription[];
}

interface CashflowData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  subscriptionExpenses: number;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function getDisplayName(user: User | null): string {
  if (!user) return 'User';
  if (user.firstName) return user.firstName;
  if (user.email) {
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return 'User';
}

export default function Home() {
  const { user: rawUser, isLoading: authLoading } = useAuth();
  const user = rawUser as User | null;

  const { data: subscriptions, isLoading: subsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
    enabled: !!user,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
    enabled: !!user,
  });

  const { data: cashflow, isLoading: cashflowLoading } = useQuery<CashflowData>({
    queryKey: ['/api/analytics/cashflow'],
    enabled: !!user,
  });

  const isLoading = authLoading || subsLoading || analyticsLoading || cashflowLoading;
  const monthlyTotal = analytics?.monthlyTotal || 0;
  const activeCount = subscriptions?.filter(s => s.isActive && s.status !== 'cancelled').length || 0;
  const upcomingCount = analytics?.upcomingRenewals?.length || 0;
  const netCashflow = cashflow?.netCashflow || 0;

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-700 flex flex-col items-center justify-center p-6 text-white">
        <Sparkles className="h-16 w-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Mulah</h1>
        <p className="text-center text-white/80 mb-8">Your AI-powered subscription control platform</p>
        <Link href="/api/login">
          <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-white/60">Welcome back,</p>
            <h1 className="text-xl font-bold">{getDisplayName(user)}</h1>
          </div>
          <Link href="/profile">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-lg font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
          </Link>
        </div>
        <p className="text-sm text-white/50">Choose a module to get started</p>
      </div>

      {/* Hub Cards */}
      <div className="px-4 py-6 space-y-6">
        {/* Subscription Hub Card */}
        <Link href="/subscriptions" className="block">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]" data-testid="card-subscription-hub">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Subscription Hub</h2>
                      <p className="text-sm text-white/80">Manage & control subscriptions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70" />
                </div>
              </div>
              
              {/* Subscription Summary */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 dark:text-white">€{monthlyTotal.toFixed(0)}</p>
                    )}
                    <p className="text-xs text-gray-500">Monthly</p>
                  </div>
                  <div className="text-center border-x border-gray-100 dark:border-gray-700">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{activeCount}</p>
                    )}
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    ) : (
                      <p className="text-lg font-bold text-amber-600">{upcomingCount}</p>
                    )}
                    <p className="text-xs text-gray-500">Upcoming</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: List, label: 'Subscriptions' },
                    { icon: Wallet, label: 'USW' },
                    { icon: CreditCard, label: 'Cards' },
                    { icon: Users, label: 'Family' },
                    { icon: Calendar, label: 'Calendar' },
                    { icon: Headphones, label: 'Concierge' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      <Icon className="h-2.5 w-2.5" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Finance Hub Card */}
        <Link href="/cashflow" className="block">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]" data-testid="card-finance-hub">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Finance Hub</h2>
                      <p className="text-sm text-white/80">Insights & money analytics</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70" />
                </div>
              </div>
              
              {/* Finance Summary */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Net Cashflow</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <div className="flex items-center gap-1">
                        {netCashflow >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <p className={`text-lg font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{Math.abs(netCashflow).toFixed(0)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Sub Expenses</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 dark:text-white">€{(cashflow?.subscriptionExpenses || monthlyTotal).toFixed(0)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: TrendingUp, label: 'Cashflow' },
                    { icon: Lightbulb, label: 'Insights' },
                    { icon: PieChart, label: 'Analytics' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      <Icon className="h-2.5 w-2.5" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/add">
            <Card className="hover:shadow-md transition-all cursor-pointer border-dashed border-2 border-teal-300 dark:border-teal-700 hover:border-teal-400 active:scale-[0.98]" data-testid="card-quick-add">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-2">
                  <Euro className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Subscription</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support">
            <Card className="hover:shadow-md transition-all cursor-pointer active:scale-[0.98]" data-testid="card-quick-support">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Get Help</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Renewals Preview */}
        {analytics?.upcomingRenewals && analytics.upcomingRenewals.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Bills</h3>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-teal-600 h-8">
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {analytics.upcomingRenewals.slice(0, 3).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: sub.iconColor || '#1B5A52' }}
                      >
                        {sub.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sub.nextBillingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">€{parseFloat(sub.cost).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
