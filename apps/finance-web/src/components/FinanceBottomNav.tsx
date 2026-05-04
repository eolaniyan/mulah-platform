import { Link, useLocation } from "wouter";
import { 
  TrendingUp, 
  Lightbulb, 
  PieChart
} from "lucide-react";

const navItems = [
  { path: "/cashflow", icon: TrendingUp, label: "Cashflow" },
  { path: "/insights", icon: Lightbulb, label: "Insights" },
  { path: "/analytics", icon: PieChart, label: "Analytics" },
];

export function FinanceBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom" data-testid="nav-finance-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          
          return (
            <Link key={path} href={path}>
              <button
                className={`flex flex-col items-center justify-center w-20 h-14 rounded-xl transition-all ${
                  isActive
                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-amber-500"
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] mt-1 font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
