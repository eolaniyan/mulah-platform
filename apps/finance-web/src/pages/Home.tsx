import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
  ArrowDownRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Analytics {
  monthlyTotal: number;
  annualTotal: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
  upcomingRenewals: Subscription[];
}

interface CashflowSummary {
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
  if (!user) return "there";
  if (user.firstName) return user.firstName;
  if (user.email) {
    const emailName = user.email.split("@")[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return "there";
}

export default function Home() {
  const { user: rawUser, isLoading: authLoading } = useAuth();
  const user = rawUser as User | null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [demoLoaded, setDemoLoaded] = useState(false);

  const { data: subscriptions, isLoading: subsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  const { data: cashflow, isLoading: cashflowLoading } = useQuery<CashflowSummary>({
    queryKey: ["/api/analytics/cashflow"],
    enabled: !!user,
  });

  const loadDemo = useMutation({
    mutationFn: () => apiRequest("POST", "/api/demo/populate"),
    onSuccess: () => {
      setDemoLoaded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/cashflow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfa/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions"] });
      toast({
        title: "Demo data loaded",
        description: "6 months of real Irish household data — explore all features now.",
      });
    },
    onError: () => {
      toast({ title: "Couldn't load demo", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const isLoading = authLoading || subsLoading || analyticsLoading || cashflowLoading;
  const monthlyTotal = analytics?.monthlyTotal ?? 0;
  const activeCount = subscriptions?.filter((s) => s.isActive && s.status !== "cancelled").length ?? 0;
  const upcomingCount = analytics?.upcomingRenewals?.length ?? 0;
  const netCashflow = cashflow?.netCashflow ?? 0;
  const subscriptionExpenses = cashflow?.subscriptionExpenses ?? monthlyTotal;
  const hasData = activeCount > 0 || (cashflow?.totalIncome ?? 0) > 0;

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-700 flex flex-col items-center justify-center p-6 text-white">
        <Sparkles className="h-16 w-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Mulah</h1>
        <p className="text-center text-white/80 mb-8">Your AI-powered finance control platform</p>
        <a href="/api/login">
          <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
            Get Started
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm text-white/60">Welcome back,</p>
            <h1 className="text-xl font-bold">{getDisplayName(user)}</h1>
          </div>
          <Link href="/profile">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 cursor-pointer">
              <span className="text-lg font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || "M"}
              </span>
            </div>
          </Link>
        </div>
        <p className="text-xs text-white/40">Your finance command centre</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Demo banner — show when no data */}
        {!isLoading && !hasData && (
          <div className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-0.5">See Mulah in action</p>
                <p className="text-xs text-white/80 mb-3">
                  Load 6 months of real Irish household data — salary, rent, groceries, subscriptions — and see CFA insights instantly.
                </p>
                <Button
                  size="sm"
                  className="bg-white text-teal-700 hover:bg-white/90 h-8 text-xs font-semibold"
                  onClick={() => loadDemo.mutate()}
                  disabled={loadDemo.isPending}
                >
                  {loadDemo.isPending ? (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Load Demo Data</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Demo reload button — show when data is loaded */}
        {!isLoading && hasData && !demoLoaded && (
          <button
            onClick={() => loadDemo.mutate()}
            disabled={loadDemo.isPending}
            className="w-full text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5 py-1"
          >
            <RefreshCw className={`h-3 w-3 ${loadDemo.isPending ? "animate-spin" : ""}`} />
            {loadDemo.isPending ? "Refreshing demo data…" : "Reload demo data"}
          </button>
        )}

        {/* Subscription Hub Card */}
        <Link href="/subscriptions" className="block">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
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

              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    {isLoading ? (
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        €{monthlyTotal.toFixed(0)}
                      </p>
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
                    { icon: List, label: "Subscriptions" },
                    { icon: Wallet, label: "USW" },
                    { icon: CreditCard, label: "Cards" },
                    { icon: Users, label: "Family" },
                    { icon: Calendar, label: "Calendar" },
                    { icon: Headphones, label: "Concierge" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                    >
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Finance Hub</h2>
                      <p className="text-sm text-white/80">CFA insights & money analytics</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/70" />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Net Cashflow</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : cashflow?.totalIncome ? (
                      <div className="flex items-center gap-1">
                        {netCashflow >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <p className={`text-lg font-bold ${netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                          €{Math.abs(netCashflow).toFixed(0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Add data to see</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Sub Expenses</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        €{subscriptionExpenses.toFixed(0)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: TrendingUp, label: "Cashflow" },
                    { icon: Lightbulb, label: "Insights" },
                    { icon: PieChart, label: "Analytics" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                    >
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
        <div className="grid grid-cols-2 gap-3">
          <Link href="/add">
            <Card className="hover:shadow-md transition-all cursor-pointer border-dashed border-2 border-teal-300 dark:border-teal-700 hover:border-teal-400 active:scale-[0.98]">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-2">
                  <Euro className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Subscription</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/iris">
            <Card className="hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask IRIS</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Renewals Preview */}
        {analytics?.upcomingRenewals && analytics.upcomingRenewals.length > 0 && (
          <Card>
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
                {analytics.upcomingRenewals.slice(0, 4).map((sub) => {
                  const daysUntil = Math.ceil(
                    (new Date(sub.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: sub.iconColor || "#1B5A52" }}
                        >
                          {sub.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.name}</p>
                          <p className={`text-xs ${daysUntil <= 3 ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                            {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        €{parseFloat(sub.cost).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
