import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { MetricTooltip } from "@/components/InfoTooltip";

interface InsightDetails {
  headline: string;
  whyItMatters: string;
  services?: Array<{ name: string; monthlyCost: number }>;
  eligibleSubscriptions?: Array<{ name: string; currentMonthly: number; annualEquivalent: number; yearlySavings: number }>;
  comparison?: { yours: number; recommended: number; difference: number };
  potentialSavings?: { monthly?: number; yearly: number; tangible: string };
  recommendation: string;
  steps?: string[];
}

interface Insight {
  type: string;
  severity: string;
  title: string;
  description: string;
  action?: string;
  details?: InsightDetails;
}

interface CFASummary {
  riskScore: number;
  riskLevel: string;
  healthScore: number;
  monthlyNetIncome: number;
  savingsRate: number;
  subscriptionBurden: number;
  insights: Insight[];
  patterns: Array<{
    name: string;
    description: string;
    trend: string;
  }>;
  resilience: {
    emergencyFundMonths: number;
    incomeStability: number;
    expenseFlexibility: number;
  };
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  moderate: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  high: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  critical: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" }
};

const SEVERITY_ICONS: Record<string, typeof Lightbulb> = {
  info: Lightbulb,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle
};

// Expandable Insight Card Component
function InsightCard({ insight, index, onAction }: { 
  insight: Insight; 
  index: number; 
  onAction: (action: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = SEVERITY_ICONS[insight.severity] || Lightbulb;
  const details = insight.details;
  
  const severityColors = {
    warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' }
  };
  const colors = severityColors[insight.severity as keyof typeof severityColors] || severityColors.info;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
        data-testid={`insight-${index}`}
      >
        {/* Summary View - Always Visible */}
        <CollapsibleTrigger className="w-full p-4 text-left">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${colors.bg} border ${colors.border}`}>
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{insight.title}</p>
                {details?.potentialSavings && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 shrink-0">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    Save €{details.potentialSavings.yearly}/yr
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-teal-600">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    <span>Hide details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    <span>Tap for more info & next steps</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Detail View */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200/50 pt-4">
            {details ? (
              <>
                {/* Why It Matters */}
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Why This Matters</p>
                  <p className="text-sm text-gray-700">{details.whyItMatters}</p>
                </div>

              {/* Services List (for overlap detection) */}
              {details.services && details.services.length > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Your Services</p>
                  <div className="space-y-2">
                    {details.services.map((service, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-sm text-gray-600">€{service.monthlyCost}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligible Subscriptions (for annual billing) */}
              {details.eligibleSubscriptions && details.eligibleSubscriptions.length > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Opportunities</p>
                  <div className="space-y-2">
                    {details.eligibleSubscriptions.map((sub, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="text-sm font-medium">{sub.name}</span>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>€{sub.currentMonthly}/mo</span>
                            <ArrowRight className="h-3 w-3 mx-1" />
                            <span className="text-green-600">€{sub.annualEquivalent}/mo</span>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Save €{sub.yearlySavings}/yr
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Chart (for burden) */}
              {details.comparison && (
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Comparison</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Your spending</span>
                        <span className="font-medium">{details.comparison.yours}%</span>
                      </div>
                      <Progress value={details.comparison.yours} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Recommended</span>
                        <span className="font-medium text-green-600">{details.comparison.recommended}%</span>
                      </div>
                      <Progress value={details.comparison.recommended} className="h-2 [&>div]:bg-green-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Savings Highlight */}
              {details.potentialSavings && (
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">€{details.potentialSavings.yearly}</p>
                  <p className="text-xs text-green-600">potential yearly savings</p>
                  <p className="text-sm text-green-700 mt-1 font-medium">{details.potentialSavings.tangible}</p>
                </div>
              )}

              {/* Steps (for actionable insights) */}
              {details.steps && details.steps.length > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">How To Do It</p>
                  <ol className="space-y-1.5">
                    {details.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">Our Recommendation</p>
                <p className="text-sm text-teal-800">{details.recommendation}</p>
              </div>

              {/* Action Button */}
              {insight.action && (
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => onAction(insight.action!)}
                  data-testid={`button-insight-action-${index}`}
                >
                  {insight.action}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              </>
            ) : (
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-sm text-gray-600">No additional details available for this insight.</p>
                {insight.action && (
                  <Button 
                    className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => onAction(insight.action!)}
                    data-testid={`button-insight-action-${index}`}
                  >
                    {insight.action}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function CFAInsights() {
  const [, navigate] = useLocation();
  const { data: cfaSummary, isLoading } = useQuery<CFASummary>({
    queryKey: ['/api/cfa/summary'],
    retry: false
  });

  const handleInsightAction = (action: string) => {
    switch (action) {
      case 'Review Subscriptions':
        navigate('/subscriptions/manage?focus=overload');
        break;
      case 'Manage Subscriptions':
        navigate('/subscriptions/manage?focus=ratio');
        break;
      case 'View by Category':
      case 'Find Duplicates':
        navigate('/subscriptions/manage');
        break;
      case 'See Savings':
        navigate('/subscriptions/manage?focus=optimization');
        break;
      case 'View Cashflow':
      case 'View Details':
        navigate('/cashflow');
        break;
      case 'Go to Calendar':
        navigate('/calendar');
        break;
      default:
        navigate('/subscriptions/manage');
    }
  };

  const riskLevel = cfaSummary?.riskLevel || 'low';
  const riskColors = RISK_COLORS[riskLevel] || RISK_COLORS.low;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Attention";
    return "Action Required";
  };

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-header">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            CFA Insights
          </h1>
          <p className="text-sm text-gray-600">
            Complex Finance Analyzer - Deep financial intelligence
          </p>
        </div>

        <div className="mobile-content space-y-4 pb-32">
          {isLoading ? (
            <div className="space-y-4">
              <Card className="animate-pulse h-40 bg-gray-100" />
              <Card className="animate-pulse h-32 bg-gray-100" />
              <Card className="animate-pulse h-48 bg-gray-100" />
            </div>
          ) : cfaSummary ? (
            <>
              {/* Financial Health Score */}
              <Card className="compact-card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Financial Health Score</p>
                        <MetricTooltip metricKey="healthScore" />
                      </div>
                      <p className={`text-4xl font-bold ${getScoreColor(cfaSummary.healthScore || 0)}`} data-testid="text-health-score">
                        {cfaSummary.healthScore || 0}
                      </p>
                      <p className={`text-xs ${getScoreColor(cfaSummary.healthScore || 0)}`}>
                        {getScoreLabel(cfaSummary.healthScore || 0)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${riskColors.bg} ${riskColors.border} border`}>
                      <Shield className={`h-8 w-8 ${riskColors.text}`} />
                    </div>
                  </div>
                  <Progress value={cfaSummary.healthScore || 0} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Risk Level</span>
                      <MetricTooltip metricKey="riskLevel" />
                    </div>
                    <Badge className={`${riskColors.bg} ${riskColors.text} border ${riskColors.border}`} data-testid="badge-risk-level">
                      {riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="compact-card">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-5 w-5 text-teal-500" />
                      <MetricTooltip metricKey="savingsRate" />
                    </div>
                    <p className="text-lg font-bold" data-testid="text-savings-rate">{cfaSummary.savingsRate || 0}%</p>
                    <p className="text-xs text-gray-500">Savings Rate</p>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      <MetricTooltip metricKey="subscriptionBurden" />
                    </div>
                    <p className="text-lg font-bold" data-testid="text-sub-burden">{cfaSummary.subscriptionBurden || 0}%</p>
                    <p className="text-xs text-gray-500">Sub Burden</p>
                  </CardContent>
                </Card>
              </div>

              {/* Resilience Metrics */}
              {cfaSummary.resilience && (
                <Card className="compact-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-blue-500" />
                      Financial Resilience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-1">
                          <span>Emergency Fund</span>
                          <MetricTooltip metricKey="emergencyFund" />
                        </div>
                        <span className="font-medium">{cfaSummary.resilience.emergencyFundMonths || 0} months</span>
                      </div>
                      <Progress value={Math.min((cfaSummary.resilience.emergencyFundMonths || 0) * 16.67, 100)} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">Goal: 6 months of expenses</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-1">
                          <span>Income Stability</span>
                          <MetricTooltip metricKey="incomeStability" />
                        </div>
                        <span className="font-medium">{cfaSummary.resilience.incomeStability || 0}%</span>
                      </div>
                      <Progress value={cfaSummary.resilience.incomeStability || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-1">
                          <span>Expense Flexibility</span>
                          <MetricTooltip metricKey="expenseFlexibility" />
                        </div>
                        <span className="font-medium">{cfaSummary.resilience.expenseFlexibility || 0}%</span>
                      </div>
                      <Progress value={cfaSummary.resilience.expenseFlexibility || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Insights - Expandable Cards with Rich Data */}
              {cfaSummary.insights && cfaSummary.insights.length > 0 && (
                <Card className="compact-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Smart Insights
                      <Badge variant="secondary" className="ml-2">{cfaSummary.insights.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {cfaSummary.insights.slice(0, 5).map((insight, index) => (
                      <InsightCard 
                        key={index} 
                        insight={insight} 
                        index={index}
                        onAction={handleInsightAction}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Spending Patterns */}
              {cfaSummary.patterns && cfaSummary.patterns.length > 0 && (
                <Card className="compact-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-indigo-500" />
                      Detected Patterns
                      <MetricTooltip metricKey="detectedPatterns" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {cfaSummary.patterns.map((pattern, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50"
                        data-testid={`pattern-${index}`}
                      >
                        {pattern.trend === 'up' ? (
                          <div className="p-1.5 rounded-full bg-green-100">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        ) : pattern.trend === 'down' ? (
                          <div className="p-1.5 rounded-full bg-red-100">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-gray-100">
                            <Target className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pattern.name}</p>
                          <p className="text-xs text-gray-500">{pattern.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="compact-card">
              <CardContent className="p-8 text-center">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Financial Data Yet</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add your subscriptions to get personalized financial insights and analysis
                </p>
                <Button 
                  variant="outline" 
                  className="text-teal-600 border-teal-600"
                  onClick={() => navigate('/add')}
                >
                  Add Subscriptions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
