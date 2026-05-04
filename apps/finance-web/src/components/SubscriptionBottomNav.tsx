import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  CreditCard, 
  Wallet, 
  Calendar, 
  LayoutGrid,
  MoreHorizontal,
  Users,
  Headphones,
  X
} from "lucide-react";

const mainNavItems = [
  { path: "/subscriptions", icon: LayoutGrid, label: "Subs" },
  { path: "/cards", icon: CreditCard, label: "Cards" },
  { path: "/usw", icon: Wallet, label: "USW", isCenter: true },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
];

const moreItems = [
  { path: "/family", icon: Users, label: "Family Sharing" },
  { path: "/concierge", icon: Headphones, label: "Concierge" },
];

export function SubscriptionBottomNav() {
  const [location] = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some(item => location === item.path);

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-48" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-white">More</span>
              <button onClick={() => setShowMore(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            {moreItems.map(({ path, icon: Icon, label }) => {
              const isActive = location === path;
              return (
                <Link key={path} href={path}>
                  <button
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 w-full px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    data-testid={`nav-more-${label.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom" data-testid="nav-subscription-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          {mainNavItems.map(({ path, icon: Icon, label, isCenter }) => {
            const isActive = location === path || 
              (path === "/subscriptions" && location.startsWith("/subscriptions/"));
            
            if (isCenter) {
              return (
                <Link key={path} href={path}>
                  <button
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30"
                        : "bg-gradient-to-r from-teal-500/80 to-teal-600/80 text-white/90 hover:from-teal-500 hover:to-teal-600"
                    }`}
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5 stroke-[2.5]" />
                    <span className="text-[10px] mt-1 font-semibold">{label}</span>
                  </button>
                </Link>
              );
            }
            
            return (
              <Link key={path} href={path}>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                    isActive
                      ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30"
                      : "text-gray-500 dark:text-gray-400 hover:text-teal-500"
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] mt-1 font-medium">{label}</span>
                </button>
              </Link>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
              isMoreActive || showMore
                ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30"
                : "text-gray-500 dark:text-gray-400 hover:text-teal-500"
            }`}
            data-testid="nav-more"
          >
            <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
