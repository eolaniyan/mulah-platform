import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Target,
  AlertTriangle,
  Zap,
  TrendingUpIcon,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";

export default function Analytics() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [virtualCardsOpen, setVirtualCardsOpen] = useState(true);
  const [transactionsOpen, setTransactionsOpen] = useState(true);
  const [showSavingsGuide, setShowSavingsGuide] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  const { data: insights = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/insights'],
    retry: false
  });

  const { data: spendingTrends = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/spending-trends'],
    retry: false
  });

  const { data: categoryBreakdown = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/category-breakdown'],
    retry: false
  });

  const { data: predictions } = useQuery<any>({
    queryKey: ['/api/analytics/predictions'],
    retry: false
  });

  const { data: budgets = [] } = useQuery<any[]>({
    queryKey: ['/api/budgets'],
    retry: false
  });

  const { data: virtualCards = [] } = useQuery<any[]>({
    queryKey: ['/api/virtual-cards'],
    retry: false
  });

  const { data: bankTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/bank-transactions'],
    retry: false
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
    retry: false
  });

  // Get monthly subscriptions that could be switched to yearly - only calculate when data is loaded
  const monthlySubs = subscriptions?.filter(s => s.billingCycle === 'monthly' && s.isActive) || [];
  const potentialYearlySavings = monthlySubs.reduce((acc, sub) => {
    const cost = parseFloat(sub.cost) || 0;
    return acc + (cost * 12 * 0.16); // Estimated ~16% typical savings for yearly
  }, 0);

  const handleTakeAction = (insight: any) => {
    if (insight.type === 'duplicate_subscription') {
      toast({
        title: "Duplicate Detected",
        description: `Review your ${insight.serviceName} subscriptions and consider canceling duplicates to save money.`,
      });
    } else if (insight.type === 'unused_subscription') {
      toast({
        title: "Unused Subscription Alert",
        description: `You haven't used ${insight.serviceName} recently. Consider pausing or canceling to save €${insight.potentialSavings}/month.`,
      });
    } else if (insight.type === 'price_increase') {
      toast({
        title: "Price Increase Detected",
        description: `${insight.serviceName} increased their price. Consider alternatives or negotiate with the provider.`,
      });
    } else if (insight.type === 'budget_warning') {
      toast({
        title: "Budget Alert",
        description: `You're approaching your ${insight.category} budget limit. Review upcoming charges.`,
      });
    } else {
      toast({
        title: "Insight Action",
        description: insight.actionDescription || "We'll help you optimize this subscription.",
      });
    }
  };

  const handleRecommendationAction = (recType: string) => {
    setSelectedRecommendation(recType);
    setShowSavingsGuide(true);
  };

  return (
    <>
    <div className="mobile-container">
      <div className="mobile-header">
        <h1 className="text-2xl font-bold">Analytics & Insights</h1>
        <p className="text-sm text-gray-600">
          AI-powered financial insights and spending analysis
        </p>
      </div>

      <div className="mobile-content space-y-4 pb-32">
        {/* AI Insights Summary - Collapsible */}
        <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
          <Card className="compact-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Smart Insights
                  <Badge variant="secondary" className="ml-2">
                    {insights?.length || 0}
                  </Badge>
                  <span className="ml-auto">
                    {insightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                {insights?.slice(0, 3).map((insight: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg" data-testid={`insight-card-${index}`}>
                    <div className={`p-1 rounded-full ${
                      insight.priority === 'high' ? 'bg-red-100' : 
                      insight.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        insight.priority === 'high' ? 'text-red-600' : 
                        insight.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.actionable && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-6 px-2 mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleTakeAction(insight)}
                          data-testid={`insight-action-${index}`}
                        >
                          Take Action →
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!insights || insights.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No insights yet. Add more subscriptions to get personalized recommendations.
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Enhanced Analytics Tabs */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">Forecast</TabsTrigger>
            <TabsTrigger value="budgets" className="text-xs">Budgets</TabsTrigger>
          </TabsList>

          {/* 1. Spending Trends */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="compact-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  6-Month Spending Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {spendingTrends?.map((month: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{month.month}</h4>
                        <p className="text-xs text-gray-500">{month.subscriptions} subscriptions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{month.total}</p>
                        <div className="flex items-center gap-1">
                          {month.change > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-red-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-green-500" />
                          )}
                          <span className={`text-xs ${month.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {Math.abs(month.change)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Category Analysis */}
          <TabsContent value="categories" className="space-y-4">
            <Card className="compact-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryBreakdown?.map((category: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold">€{category.amount}</span>
                          <span className="text-xs text-gray-500 ml-2">{category.percentage}%</span>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      <div className="flex gap-1 flex-wrap">
                        {category.services?.slice(0, 3).map((service: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {category.services?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. AI Predictions */}
          <TabsContent value="predictions" className="space-y-4">
            <Card className="compact-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                  12-Month Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                      <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-lg text-blue-600">
                        €{predictions?.yearTotal || Math.round((subscriptions || []).reduce((acc, s) => {
                          const cost = parseFloat(s.cost) || 0;
                          return acc + (s.billingCycle === 'yearly' ? cost : s.billingCycle === 'weekly' ? cost * 52 : cost * 12);
                        }, 0))}
                      </h4>
                      <p className="text-xs text-gray-600">Predicted Annual</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-lg text-green-600">
                        ~€{Math.round(potentialYearlySavings)}
                      </h4>
                      <p className="text-xs text-gray-600">Est. Potential Savings</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Smart Recommendations
                    </h5>
                    
                    {/* Switch to Yearly Recommendation */}
                    {monthlySubs.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Calendar className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h6 className="font-semibold text-sm text-green-800">Switch to Yearly Plans</h6>
                            <p className="text-xs text-green-700 mt-1">
                              {monthlySubs.length} subscription{monthlySubs.length !== 1 ? 's' : ''} could save you ~16% by switching to annual billing
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-green-600 text-white text-xs">
                                Save €{Math.round(potentialYearlySavings)}/year
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50"
                                onClick={() => handleRecommendationAction('yearly')}
                              >
                                See How <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review unused subscriptions */}
                    {subscriptions.length > 5 && (
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Target className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h6 className="font-semibold text-sm text-orange-800">Review Subscriptions</h6>
                            <p className="text-xs text-orange-700 mt-1">
                              You have {subscriptions.length} subscriptions. Consider reviewing for unused services.
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-xs mt-2 border-orange-600 text-orange-700 hover:bg-orange-50"
                              onClick={() => navigate('/dashboard')}
                            >
                              Review Now <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* USW Recommendation */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h6 className="font-semibold text-sm text-purple-800">Use USW for Better Control</h6>
                          <p className="text-xs text-purple-700 mt-1">
                            Consolidate all subscription payments into one monthly payment
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs mt-2 border-purple-600 text-purple-700 hover:bg-purple-50"
                            onClick={() => navigate('/usw')}
                          >
                            Learn More <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Budget Management */}
          <TabsContent value="budgets" className="space-y-4">
            <Card className="compact-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-orange-600" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgets?.map((budget: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-sm">{budget.name}</h4>
                        <span className="text-sm font-semibold">
                          €{budget.currentSpend} / €{budget.monthlyLimit}
                        </span>
                      </div>
                      <Progress 
                        value={(budget.currentSpend / budget.monthlyLimit) * 100} 
                        className="h-2 mb-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{budget.category}</span>
                        <span>
                          {((budget.currentSpend / budget.monthlyLimit) * 100).toFixed(1)}% used
                        </span>
                      </div>
                      {budget.currentSpend / budget.monthlyLimit > budget.alertThreshold && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                          ⚠️ Approaching budget limit
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!budgets || budgets.length === 0) && (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gray-100 rounded-full mx-auto w-fit mb-3">
                        <Target className="h-6 w-6 text-gray-400" />
                      </div>
                      <h4 className="font-medium mb-2">No budgets set</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Create budgets to track spending by category
                      </p>
                      <p className="text-xs text-gray-400">Budgeting feature coming soon</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Virtual Cards Overview - Collapsible */}
        <Collapsible open={virtualCardsOpen} onOpenChange={setVirtualCardsOpen}>
          <Card className="compact-card">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Virtual Cards
                  <Badge variant="secondary" className="ml-2">
                    {virtualCards?.length || 0} active
                  </Badge>
                  <span className="ml-auto">
                    {virtualCardsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {virtualCards && virtualCards.length > 0 ? (
                  <div className="space-y-3">
                    {virtualCards.slice(0, 3).map((card: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">•••• {card.last4}</h4>
                            <p className="text-xs text-gray-600">{card.assignedService || 'Unassigned'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">€{card.spendingLimit}</p>
                          <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {card.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-center text-gray-400 mt-2">Virtual card management coming soon</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gray-100 rounded-full mx-auto w-fit mb-3">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <h4 className="font-medium mb-2">No virtual cards</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Create virtual cards to manage subscription payments
                    </p>
                    <p className="text-xs text-gray-400">Virtual cards coming soon</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Recent Bank Transactions - Collapsible */}
        <Collapsible open={transactionsOpen} onOpenChange={setTransactionsOpen}>
          <Card className="compact-card">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Recent Transactions
                  <Badge variant="secondary" className="ml-2">
                    {bankTransactions?.length || 0}
                  </Badge>
                  <span className="ml-auto">
                    {transactionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {bankTransactions && bankTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {bankTransactions.slice(0, 5).map((transaction: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.isSubscriptionPayment ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <DollarSign className={`h-4 w-4 ${
                              transaction.isSubscriptionPayment ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{transaction.merchantName}</h4>
                            <p className="text-xs text-gray-600">
                              {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">€{transaction.amount}</p>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-center text-gray-400 mt-2">Bank sync coming soon</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gray-100 rounded-full mx-auto w-fit mb-3">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <h4 className="font-medium mb-2">No transactions yet</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Connect your bank account to see transaction insights
                    </p>
                    <Link href="/bank-connections">
                      <Button size="sm">Connect Bank Account</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>

    {/* Savings Guide Dialog */}
    <Dialog open={showSavingsGuide} onOpenChange={setShowSavingsGuide}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            {selectedRecommendation === 'yearly' ? 'Switch to Yearly Plans' : 'Savings Guide'}
          </DialogTitle>
          <DialogDescription>
            Follow these steps to save money on your subscriptions
          </DialogDescription>
        </DialogHeader>

        {selectedRecommendation === 'yearly' && (
          <div className="space-y-4 mt-4">
            {/* Eligible Subscriptions */}
            <div>
              <h4 className="font-semibold text-sm mb-2">
                Subscriptions eligible for yearly savings ({monthlySubs.length})
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Estimated savings based on typical 16% yearly discount. Actual discounts vary by service.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {monthlySubs.map((sub) => {
                  const monthlyCost = parseFloat(sub.cost) || 0;
                  const yearlyCost = monthlyCost * 12 * 0.84; // 16% discount
                  const savings = monthlyCost * 12 - yearlyCost;
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: sub.iconColor || '#6366f1' }}
                        >
                          <i className={sub.iconName || 'fas fa-star'}></i>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sub.name}</p>
                          <p className="text-xs text-gray-500">€{monthlyCost.toFixed(2)}/mo</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-medium">~€{savings.toFixed(0)}/yr est.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step by step guide */}
            <div>
              <h4 className="font-semibold text-sm mb-3">How to switch:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-sm">Open the subscription's website or app</p>
                    <p className="text-xs text-gray-600 mt-1">Log into your account on the service</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-sm">Go to Settings → Subscription/Billing</p>
                    <p className="text-xs text-gray-600 mt-1">Find the subscription or billing section</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-sm">Look for "Change Plan" or "Switch to Annual"</p>
                    <p className="text-xs text-gray-600 mt-1">Most services offer this option prominently</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Confirm and update your Mulah</p>
                    <p className="text-xs text-gray-600 mt-1">After switching, update the billing cycle in your subscription list</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Tip:</strong> Some services offer even bigger discounts (20-30%) if you contact their support directly and ask for a loyalty discount.
              </p>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowSavingsGuide(false);
                setTimeout(() => navigate('/dashboard'), 100);
              }}
            >
              Go to My Subscriptions
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
