import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  CreditCard,
  Plus,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays } from "date-fns";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

export default function SmartBuffer() {
  const [isBufferDialogOpen, setIsBufferDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: bufferTransactions, isLoading } = useQuery({
    queryKey: ['/api/buffer-transactions'],
    retry: false
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['/api/subscriptions'],
    retry: false
  });

  const { data: bufferStats } = useQuery({
    queryKey: ['/api/buffer-transactions/stats'],
    retry: false
  });

  const { data: availableProviders } = useQuery({
    queryKey: ['/api/buffer/providers'],
    retry: false
  });

  // Mutations
  const createBufferMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/buffer-transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buffer-transactions'] });
      setIsBufferDialogOpen(false);
      setSelectedSubscription(null);
      toast({
        title: "Smart Buffer Activated",
        description: "Your payment has been covered with BNPL",
      });
    },
    onError: () => {
      toast({
        title: "Buffer Failed",
        description: "Unable to activate Smart Buffer for this payment",
        variant: "destructive",
      });
    }
  });

  const repayBufferMutation = useMutation({
    mutationFn: (transactionId: number) => 
      apiRequest('POST', `/api/buffer-transactions/${transactionId}/repay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buffer-transactions'] });
      toast({
        title: "Payment Complete",
        description: "Buffer transaction has been repaid",
      });
    }
  });

  const handleCreateBuffer = (subscriptionId: number) => {
    const subscription = subscriptions?.find((s: any) => s.id === subscriptionId);
    if (!subscription) return;

    createBufferMutation.mutate({
      subscriptionId,
      amount: parseFloat(subscription.cost),
      provider: 'klarna' // Default to Klarna
    });
  };

  const upcomingPayments = subscriptions?.filter((sub: any) => {
    const nextBilling = new Date(sub.nextBillingDate);
    const now = new Date();
    const diffDays = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }) || [];

  return (
    <>
    <div className="mobile-container">
      <div className="mobile-header">
        <h1 className="text-2xl font-bold">Smart Buffer</h1>
        <p className="text-sm text-gray-600">
          BNPL fallback for subscription payments when funds are low
        </p>
      </div>

      <div className="mobile-content space-y-6">
        {/* Smart Buffer Overview */}
        <Card className="compact-card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-600" />
              Smart Buffer Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <h4 className="font-semibold text-lg text-purple-600">
                    {bufferStats?.activeBuffers || 0}
                  </h4>
                  <p className="text-xs text-gray-600">Active Buffers</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <h4 className="font-semibold text-lg text-green-600">
                    €{bufferStats?.totalCovered || 0}
                  </h4>
                  <p className="text-xs text-gray-600">Total Covered</p>
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">How Smart Buffer Works</span>
                </div>
                <p className="text-xs text-gray-600">
                  When your account balance is insufficient for a subscription payment, 
                  Smart Buffer automatically covers it using Klarna BNPL, giving you 30 days to repay.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments That May Need Buffer */}
        {upcomingPayments.length > 0 && (
          <Card className="compact-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                Upcoming Payments
                <Badge variant="secondary" className="ml-auto">
                  {upcomingPayments.length} due this week
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingPayments.map((subscription: any) => {
                  const daysUntil = Math.ceil(
                    (new Date(subscription.nextBillingDate).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: subscription.iconColor }}
                        >
                          <i className={subscription.iconName}></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{subscription.name}</h4>
                          <p className="text-xs text-gray-500">
                            Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">€{parseFloat(subscription.cost).toFixed(2)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2 mt-1"
                          onClick={() => handleCreateBuffer(subscription.id)}
                          disabled={createBufferMutation.isPending}
                        >
                          Cover This
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Buffer Transactions */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="compact-card">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bufferTransactions && bufferTransactions.length > 0 ? (
          <Card className="compact-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Active Buffers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bufferTransactions.map((transaction: any) => {
                  const subscription = subscriptions?.find((s: any) => s.id === transaction.subscriptionId);
                  const daysUntilDue = transaction.dueDate ? 
                    Math.ceil((new Date(transaction.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                    null;
                  
                  return (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.status === 'approved' ? 'bg-green-100' : 
                            transaction.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            {transaction.status === 'approved' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : transaction.status === 'pending' ? (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {subscription?.name || 'Unknown Subscription'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {transaction.provider?.toUpperCase()} Buffer
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          transaction.status === 'approved' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Amount Covered</span>
                          <span className="font-semibold">€{parseFloat(transaction.amount).toFixed(2)}</span>
                        </div>
                        
                        {transaction.dueDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Repayment Due</span>
                            <span className={`font-medium ${
                              daysUntilDue && daysUntilDue <= 3 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {format(new Date(transaction.dueDate), 'MMM d, yyyy')}
                              {daysUntilDue && (
                                <span className="ml-1 text-xs">
                                  ({daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'})
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {transaction.status === 'approved' && !transaction.repaidAt && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => repayBufferMutation.mutate(transaction.id)}
                              disabled={repayBufferMutation.isPending}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              {repayBufferMutation.isPending ? "Processing..." : "Repay Now"}
                            </Button>
                          </div>
                        )}

                        {transaction.repaidAt && (
                          <div className="p-2 bg-green-50 rounded text-center">
                            <span className="text-xs text-green-700">
                              ✓ Repaid on {format(new Date(transaction.repaidAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="compact-card">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-gray-100 rounded-full mx-auto w-fit mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">No active buffers</h3>
              <p className="text-sm text-gray-500 mb-6">
                Smart Buffer will automatically activate when your account balance 
                is insufficient for subscription payments.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automatic activation when needed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30-day repayment period</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No interest or fees</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BNPL Providers */}
        <Card className="compact-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              BNPL Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableProviders?.map((provider: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{provider.name}</h4>
                      <p className="text-xs text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  <Badge variant={provider.available ? 'default' : 'secondary'}>
                    {provider.available ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading providers...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart Buffer Settings */}
        <Card className="compact-card bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-blue-900">Smart Buffer Settings</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Smart Buffer automatically activates when your USW balance is insufficient. 
                  You can configure buffer thresholds and preferred BNPL providers in Settings.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-700 h-6 px-2 mt-2">
                  Configure Settings
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <BottomNavigation />
    </>
  );
}