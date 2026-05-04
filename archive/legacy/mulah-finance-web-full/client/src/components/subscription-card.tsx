import { Subscription } from "@shared/schema";
import { format } from "date-fns";

interface SubscriptionCardProps {
  subscription: Subscription;
  onClick?: () => void;
}

const categoryIcons: Record<string, string> = {
  Entertainment: "fas fa-play",
  Music: "fas fa-music",
  Productivity: "fas fa-briefcase",
  Storage: "fas fa-cloud",
  Design: "fas fa-palette",
  Gaming: "fas fa-gamepad",
  Fitness: "fas fa-dumbbell",
  News: "fas fa-newspaper",
  Education: "fas fa-graduation-cap",
  Other: "fas fa-star"
};

const categoryColors: Record<string, string> = {
  Entertainment: "#ef4444",
  Music: "#22c55e",
  Productivity: "#3b82f6",
  Storage: "#8b5cf6",
  Design: "#f59e0b",
  Gaming: "#ec4899",
  Fitness: "#10b981",
  News: "#6366f1",
  Education: "#f97316",
  Other: "#64748b"
};

export function SubscriptionCard({ subscription, onClick }: SubscriptionCardProps) {
  const iconClass = categoryIcons[subscription.category] || categoryIcons.Other;
  const iconColor = categoryColors[subscription.category] || categoryColors.Other;
  
  const nextBillingDate = new Date(subscription.nextBillingDate);
  const isUpcoming = nextBillingDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  
  const formatNextBilling = () => {
    const days = Math.ceil((nextBillingDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `Due in ${days} days`;
    return `Next: ${format(nextBillingDate, 'MMM dd')}`;
  };

  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-hover modern-shadow cursor-pointer transition-all duration-300 border border-white/30"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float shadow-lg"
          style={{ backgroundColor: iconColor }}
        >
          <i className={`${iconClass} text-white text-xl`}></i>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-800 text-lg">{subscription.name}</h4>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {subscription.currency === 'EUR' ? '€' : '$'}{subscription.cost}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {subscription.category}
              </span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {subscription.billingCycle}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${
                isUpcoming ? 'text-orange-600' : 'text-gray-500'
              }`}>
                {formatNextBilling()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
