import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Zap,
  Hand
} from "lucide-react";
import { format, addMonths, subMonths, addDays } from "date-fns";

interface BillingSummary {
  totalDue: number;
  billCount: number;
  autoPayCount: number;
  needsAttentionCount: number;
  bills: Bill[];
  autoPayBills: Bill[];
  needsAttentionBills: Bill[];
  month: number;
  year: number;
}

interface Bill {
  id: number;
  name: string;
  cost: number;
  nextBillingDate: string;
  billingCycle?: string;
  category?: string;
  status?: string;
  controlMethod: string;
  iconColor?: string;
  iconName?: string;
}

const CONTROL_METHOD_LABELS: Record<string, string> = {
  mulah_merchant: "Auto-Pay",
  api: "Connected",
  self_service: "Manual",
  concierge: "Concierge"
};

export default function BillCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const month = currentMonth.getMonth() + 1;
  const year = currentMonth.getFullYear();
  
  const { data: billingSummary, isLoading } = useQuery<BillingSummary>({
    queryKey: ['/api/billing/monthly-summary', { month, year }],
    retry: false
  });

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getDaysUntilRenewal = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(dateStr);
    renewal.setHours(0, 0, 0, 0);
    const diff = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil < 0) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (daysUntil === 0) {
      return <Badge variant="destructive" className="text-xs">Due Today</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge variant="default" className="text-xs bg-orange-500">In {daysUntil}d</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge variant="outline" className="text-xs">In {daysUntil}d</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{format(addDays(new Date(), daysUntil), 'MMM d')}</Badge>;
  };

  const getControlMethodBadge = (controlMethod: string) => {
    if (controlMethod === 'mulah_merchant' || controlMethod === 'api') {
      return (
        <Badge className="text-xs bg-teal-100 text-teal-700 border-teal-200">
          <Zap className="h-3 w-3 mr-1" />
          {CONTROL_METHOD_LABELS[controlMethod] || 'Auto'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <Hand className="h-3 w-3 mr-1" />
        {CONTROL_METHOD_LABELS[controlMethod] || 'Manual'}
      </Badge>
    );
  };

  const totalDue = billingSummary?.totalDue || 0;
  const billCount = billingSummary?.billCount || 0;
  const autoPayBills = billingSummary?.autoPayBills || [];
  const needsAttentionBills = billingSummary?.needsAttentionBills || [];
  const allBills = billingSummary?.bills || [];

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-header">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-teal-500" />
            Bill Calendar
          </h1>
          <p className="text-sm text-gray-600">
            Never miss a payment
          </p>
        </div>

        <div className="mobile-content space-y-4 pb-32">
          {/* Month Navigation */}
          <Card className="compact-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <h2 className="text-lg font-semibold" data-testid="text-current-month">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <Button variant="link" size="sm" onClick={goToToday} className="text-xs text-teal-600 p-0 h-auto">
                    Today
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="compact-card bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Due This Month</p>
                  <p className="text-2xl font-bold text-teal-700" data-testid="text-total-due">
                    €{totalDue.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Bills</p>
                  <p className="text-2xl font-bold text-teal-700" data-testid="text-bill-count">
                    {billCount}
                  </p>
                </div>
              </div>
              {/* Auto-pay vs Manual breakdown */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-teal-200/50">
                <div className="flex items-center gap-1 text-sm">
                  <Zap className="h-4 w-4 text-teal-600" />
                  <span className="text-gray-600">{autoPayBills.length} Auto-Pay</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Hand className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-600">{needsAttentionBills.length} Manual</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Pay Schedule Section */}
          {autoPayBills.length > 0 && (
            <Card className="compact-card border-teal-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-teal-700">
                  <Zap className="h-5 w-5" />
                  Auto-Pay Schedule
                  <Badge className="ml-auto bg-teal-100 text-teal-700 text-xs">
                    {autoPayBills.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-gray-500">These will be paid automatically</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {autoPayBills.map((bill) => {
                    const daysUntil = getDaysUntilRenewal(bill.nextBillingDate);
                    return (
                      <div 
                        key={bill.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-teal-50/50 border border-teal-100"
                        data-testid={`autopay-bill-${bill.id}`}
                      >
                        <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate text-gray-900">{bill.name}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(bill.nextBillingDate), 'EEE, MMM d')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">€{bill.cost.toFixed(2)}</p>
                          {getUrgencyBadge(daysUntil)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Needs Attention Section */}
          {needsAttentionBills.length > 0 && (
            <Card className="compact-card border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  Needs Attention
                  <Badge className="ml-auto bg-orange-100 text-orange-700 text-xs">
                    {needsAttentionBills.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-gray-500">Confirm when you've paid these externally</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {needsAttentionBills.map((bill) => {
                      const daysUntil = getDaysUntilRenewal(bill.nextBillingDate);
                      
                      return (
                        <div 
                          key={bill.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            daysUntil <= 3 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'
                          }`}
                          data-testid={`attention-bill-${bill.id}`}
                        >
                          <Hand className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate text-gray-900">{bill.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(bill.nextBillingDate), 'EEE, MMM d')}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-semibold text-gray-900">€{bill.cost.toFixed(2)}</p>
                            {getUrgencyBadge(daysUntil)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Clear State */}
          {billCount === 0 && !isLoading && (
            <Card className="compact-card">
              <CardContent className="p-8">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500">No bills due this month</p>
                  <p className="text-sm text-gray-400">You're all caught up!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pro tip */}
          {needsAttentionBills.length > 0 && (
            <Card className="compact-card bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4 text-teal-500" />
                  <span>Pro tip: Enable USW to auto-pay all your subscriptions with one balance</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
