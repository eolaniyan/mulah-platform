import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  title?: string;
  variant?: "info" | "help";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const METRIC_EXPLANATIONS = {
  healthScore: {
    title: "Financial Health Score",
    content: "A 0-100 score measuring your overall financial wellness. 80+ is excellent, 60-79 is good, 40-59 needs attention, below 40 requires action. Based on savings rate, subscription burden, and spending patterns."
  },
  riskLevel: {
    title: "Risk Level",
    content: "LOW: Your finances are stable. MODERATE: Some areas need attention. HIGH: Multiple warning signs detected. CRITICAL: Immediate action recommended."
  },
  savingsRate: {
    title: "Savings Rate",
    content: "The percentage of your income you're saving after expenses. 20%+ is excellent, 10-20% is good, under 10% suggests you may need to reduce spending."
  },
  subscriptionBurden: {
    title: "Subscription Burden",
    content: "What percentage of your income goes to recurring subscriptions. Under 15% is healthy, 15-25% is manageable, over 25% may be too high."
  },
  emergencyFund: {
    title: "Emergency Fund",
    content: "How many months of expenses you could cover with savings. 6+ months is ideal, 3-6 months is good, under 3 months needs building up."
  },
  incomeStability: {
    title: "Income Stability",
    content: "How consistent your income is month-to-month. Higher is better - irregular income makes budgeting harder and increases financial risk."
  },
  expenseFlexibility: {
    title: "Expense Flexibility",
    content: "How much of your spending is flexible vs fixed. Higher flexibility means you can cut costs easier if needed. Subscriptions reduce flexibility."
  },
  netCashflow: {
    title: "Net Cashflow",
    content: "Your income minus expenses. Positive means you're saving money, negative means spending more than you earn."
  },
  categoryBreakdown: {
    title: "Spending by Category",
    content: "Shows all your expenses broken down by type. This includes subscriptions and any other tracked spending."
  },
  subscriptionVsTotal: {
    title: "Subscriptions vs Total Spending",
    content: "Note: Subscription burden shows only recurring payments (Netflix, Spotify, etc.), while category breakdown shows ALL spending including groceries, transport, etc. That's why they may show different 'top' categories."
  },
  detectedPatterns: {
    title: "Detected Patterns",
    content: "Spending patterns identified from your transaction history. Green arrows show increasing trends, red arrows show decreasing trends. These help you understand your financial habits."
  }
};

export default function InfoTooltip({ 
  content, 
  title,
  variant = "info", 
  side = "top",
  className = "" 
}: InfoTooltipProps) {
  const Icon = variant === "info" ? Info : HelpCircle;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={`inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 rounded-full p-0.5 hover:bg-gray-100 active:bg-gray-200 transition-colors ${className}`}
          aria-label={title || "More information"}
        >
          <Icon className="h-4 w-4 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        className="max-w-xs bg-gray-900 text-white border-gray-800 shadow-lg z-50"
      >
        {title && <p className="font-semibold text-xs mb-1 text-teal-400">{title}</p>}
        <p className="text-xs leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );
}

export function MetricTooltip({ 
  metricKey, 
  side = "top",
  className = "" 
}: { 
  metricKey: keyof typeof METRIC_EXPLANATIONS;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  const metric = METRIC_EXPLANATIONS[metricKey];
  return (
    <InfoTooltip 
      title={metric.title}
      content={metric.content}
      side={side}
      className={className}
    />
  );
}
