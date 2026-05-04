import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, CalendarDays, Zap, Brain, MoreHorizontal, Wallet, X, BarChart3, HelpCircle, User, Settings2, Users } from "lucide-react";

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => location === path;

  const NavItem = ({ href, icon: Icon, label, highlighted }: { href: string; icon: any; label: string; highlighted?: boolean }) => (
    <Link href={href}>
      <button 
        className={cn(
          "flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-xl transition-all duration-200",
          isActive(href) 
            ? highlighted 
              ? "bg-purple-100 text-purple-600" 
              : "bg-emerald-50 text-emerald-600" 
            : highlighted
              ? "text-purple-500 hover:text-purple-600 hover:bg-purple-50"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        )}
        data-testid={`nav-${label.toLowerCase()}`}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 transition-all",
          isActive(href) 
            ? highlighted
              ? "bg-purple-200 text-purple-600"
              : "bg-emerald-100 text-emerald-600" 
            : highlighted
              ? "text-purple-500"
              : "text-gray-400",
          highlighted && !isActive(href) && "ring-2 ring-purple-200 ring-offset-1"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn(
          "text-[10px] font-medium transition-colors",
          isActive(href) 
            ? highlighted ? "text-purple-600" : "text-emerald-600" 
            : highlighted ? "text-purple-500" : "text-gray-400"
        )}>{label}</span>
      </button>
    </Link>
  );

  const MoreMenuItem = ({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) => (
    <button
      onClick={() => {
        setShowMore(false);
        setLocation(href);
      }}
      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 active:scale-98 transition-all w-full"
      data-testid={`more-menu-${label.toLowerCase()}`}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </button>
  );

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}
      
      {/* More Menu Drawer */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 transition-transform duration-300 ease-out shadow-2xl",
        showMore ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">More</h3>
            <button 
              onClick={() => setShowMore(false)}
              className="p-2 rounded-full hover:bg-gray-100"
              data-testid="close-more-menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <MoreMenuItem href="/subscriptions/manage" icon={Settings2} label="Subscription Hub" color="bg-emerald-100 text-emerald-600" />
            <MoreMenuItem href="/family" icon={Users} label="Family" color="bg-blue-100 text-blue-600" />
            <MoreMenuItem href="/concierge" icon={HelpCircle} label="Concierge" color="bg-orange-100 text-orange-600" />
            <MoreMenuItem href="/cashflow" icon={Wallet} label="Cashflow" color="bg-teal-100 text-teal-600" />
            <MoreMenuItem href="/analytics" icon={BarChart3} label="Analytics" color="bg-purple-100 text-purple-600" />
            <MoreMenuItem href="/support" icon={HelpCircle} label="Support" color="bg-gray-100 text-gray-600" />
            <MoreMenuItem href="/profile" icon={User} label="Profile" color="bg-rose-100 text-rose-600" />
          </div>
        </div>
        
        {/* Safe area padding */}
        <div className="h-6 bg-white" />
      </div>

      {/* Bottom Navigation Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-gray-200 px-3 py-2 mobile-safe shadow-lg z-30",
        className
      )}>
        <div className="flex items-center justify-between">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/calendar" icon={CalendarDays} label="Calendar" />
          <NavItem href="/usw" icon={Zap} label="USW" highlighted />
          <NavItem href="/insights" icon={Brain} label="Insights" />
          
          {/* More Button */}
          <button 
            onClick={() => setShowMore(true)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-xl transition-all duration-200",
              showMore 
                ? "bg-gray-100 text-gray-600" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            data-testid="nav-more"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 transition-all",
              showMore ? "bg-gray-200 text-gray-600" : "text-gray-400"
            )}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              showMore ? "text-gray-600" : "text-gray-400"
            )}>More</span>
          </button>
        </div>
      </div>
    </>
  );
}
