import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  Wallet,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface CashflowData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  transactionCount: number;
}

interface CategoryTotals {
  categories: Array<{
    category: string;
    categorySlug: string;
    icon: string;
    color: string;
    total: number;
    percentage: number;
    transactionCount: number;
  }>;
  grandTotal: number;
  transactionCount: number;
}

export default function Cashflow() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "3months" | "custom">("month");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Separate state for the calendar selection vs the applied range
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Update selected range when time range tab changes
  useEffect(() => {
    const now = new Date();
    if (timeRange === "week") {
      setSelectedRange({ from: subDays(now, 7), to: now });
    } else if (timeRange === "month") {
      setSelectedRange({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (timeRange === "3months") {
      setSelectedRange({ from: subMonths(now, 3), to: now });
    }
    // For "custom", keep the existing selectedRange
  }, [timeRange]);
  
  const { from, to } = selectedRange;
  
  // Build URLs with query parameters
  const cashflowUrl = `/api/analytics/cashflow?from=${from.toISOString()}&to=${to.toISOString()}`;
  const categoryUrl = `/api/analytics/category-totals?from=${from.toISOString()}&to=${to.toISOString()}`;
  
  const { data: cashflow, isLoading: cashflowLoading } = useQuery<CashflowData>({
    queryKey: [cashflowUrl],
    retry: false
  });
  
  const { data: categoryTotals, isLoading: categoryLoading } = useQuery<CategoryTotals>({
    queryKey: [categoryUrl],
    retry: false
  });

  const isLoading = cashflowLoading || categoryLoading;

  const netCashflow = cashflow?.netCashflow || 0;
  const isPositive = netCashflow >= 0;

  // Handle date range selection from calendar
  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    
    // If we have both dates selected
    if (range.from && range.to) {
      setSelectedRange({ from: range.from, to: range.to });
      setTimeRange("custom");
      setDatePickerOpen(false);
    } else if (range.from) {
      // First click - just update the from date, keep picker open
      setSelectedRange(prev => ({ ...prev, from: range.from! }));
    }
  };

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-header">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-teal-500" />
            Cashflow
          </h1>
          <p className="text-sm text-gray-600">
            Track your money in and out
          </p>
        </div>

        <div className="mobile-content space-y-4 pb-32">
          {/* Date Range Display */}
          <Card className="compact-card bg-gray-50">
            <CardContent className="p-3">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      {format(from, 'MMM d')} - {format(to, 'MMM d, yyyy')}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="range"
                    selected={{ from, to }}
                    onSelect={handleDateSelect}
                    numberOfMonths={1}
                    defaultMonth={from}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week" data-testid="tab-week">7 Days</TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-month">This Month</TabsTrigger>
              <TabsTrigger value="3months" data-testid="tab-3months">3 Months</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              <Card className="animate-pulse h-32 bg-gray-100" />
              <Card className="animate-pulse h-48 bg-gray-100" />
            </div>
          ) : (
            <>
              {/* Net Cashflow Card */}
              <Card className={`compact-card ${isPositive ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Net Cashflow</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-0.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs text-sm">
                          Net cashflow shows your income minus expenses. Positive means you're saving money, negative means you're spending more than you earn.
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? "Positive" : "Negative"}
                    </Badge>
                  </div>
                  <div className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-cashflow">
                    {isPositive ? '+' : '-'}€{Math.abs(netCashflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              {/* Income vs Expenses */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="compact-card border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Income</span>
                    </div>
                    <div className="text-xl font-bold text-green-600" data-testid="text-income">
                      €{(cashflow?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="compact-card border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Expenses</span>
                    </div>
                    <div className="text-xl font-bold text-red-600" data-testid="text-expenses">
                      €{(cashflow?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card className="compact-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="h-5 w-5 text-teal-500" />
                    Spending by Category
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-0.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs text-sm">
                        Shows all your expenses broken down by category. This includes subscriptions and any other tracked spending.
                      </PopoverContent>
                    </Popover>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {categoryTotals?.categories && categoryTotals.categories.length > 0 ? (
                    <div className="space-y-3">
                      {(showAllCategories ? categoryTotals.categories : categoryTotals.categories.slice(0, 6)).map((cat) => (
                        <div key={cat.categorySlug} data-testid={`category-row-${cat.categorySlug}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{cat.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">€{cat.total.toFixed(2)}</span>
                              <Badge variant="outline" className="text-xs">{cat.percentage}%</Badge>
                            </div>
                          </div>
                          <Progress 
                            value={cat.percentage} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {categoryTotals.categories.length > 6 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-teal-600"
                          onClick={() => setShowAllCategories(!showAllCategories)}
                        >
                          {showAllCategories ? (
                            <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
                          ) : (
                            <>+{categoryTotals.categories.length - 6} more categories <ChevronDown className="h-3 w-3 ml-1" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No spending data yet</p>
                      <p className="text-sm text-gray-400">Add your subscriptions to see category breakdown</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="compact-card bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800" data-testid="text-transaction-count">
                        {cashflow?.transactionCount || 0}
                      </div>
                      <div className="text-xs text-gray-500">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800" data-testid="text-category-count">
                        {categoryTotals?.categories?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </div>
    </>
  );
}
