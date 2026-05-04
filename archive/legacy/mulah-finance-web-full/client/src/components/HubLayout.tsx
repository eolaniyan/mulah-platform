import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Wallet, 
  List,
  Headphones,
  TrendingUp,
  Lightbulb,
  PieChart,
  ChevronLeft,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type HubType = 'subscriptions' | 'finance';

interface HubNavItem {
  path: string;
  label: string;
  icon: typeof CreditCard;
}

const subscriptionHubNav: HubNavItem[] = [
  { path: '/subscriptions', label: 'Subscriptions', icon: List },
  { path: '/usw', label: 'USW', icon: Wallet },
  { path: '/cards', label: 'Cards', icon: CreditCard },
  { path: '/family', label: 'Family', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/concierge', label: 'Concierge', icon: Headphones },
];

const financeHubNav: HubNavItem[] = [
  { path: '/cashflow', label: 'Cashflow', icon: TrendingUp },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/analytics', label: 'Analytics', icon: PieChart },
];

interface HubLayoutProps {
  hub: HubType;
  title: string;
  children: React.ReactNode;
}

export default function HubLayout({ hub, title, children }: HubLayoutProps) {
  const [location] = useLocation();
  const navItems = hub === 'subscriptions' ? subscriptionHubNav : financeHubNav;
  
  const hubColors = {
    subscriptions: 'from-teal-500 to-teal-600',
    finance: 'from-amber-500 to-amber-600'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hub Header */}
      <div className={cn(
        "bg-gradient-to-r text-white px-4 py-4 sticky top-0 z-40",
        hubColors[hub]
      )}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              data-testid="button-hub-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-white/70 capitalize">{hub} Hub</p>
          </div>
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              data-testid="button-hub-home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Hub Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[60px] z-30 overflow-x-auto">
        <nav className="flex px-2 py-1 gap-1 min-w-max">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? hub === 'subscriptions'
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  )}
                  data-testid={`nav-hub-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export function SubscriptionHub({ children }: { children: React.ReactNode }) {
  return (
    <HubLayout hub="subscriptions" title="Subscription Hub">
      {children}
    </HubLayout>
  );
}

export function FinanceHub({ children }: { children: React.ReactNode }) {
  return (
    <HubLayout hub="finance" title="Finance Hub">
      {children}
    </HubLayout>
  );
}
