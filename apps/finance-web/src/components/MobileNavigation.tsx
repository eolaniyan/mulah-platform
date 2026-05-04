import { Link, useLocation } from "wouter";
import { 
  Home, 
  BarChart3, 
  CreditCard, 
  Building2,
  Shield,
  Wallet,
  User,
  Users,
  Plus,
  Eye,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/family", icon: Users, label: "Family" },
    { path: "/cards", icon: CreditCard, label: "Cards" },
    { path: "/usw", icon: Wallet, label: "USW" },
    { path: "/support", icon: HelpCircle, label: "Support" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  // Add IRIS only for admin users
  const adminNavItems = isAdmin ? [
    ...navItems.slice(0, 4), // First 4 items (Home, Analytics, Family, Cards)
    { path: "/iris", icon: Eye, label: "IRIS" }, // Insert IRIS after Cards
    ...navItems.slice(4) // Rest of the items (USW, Support, Profile)
  ] : navItems;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center py-2">
            {adminNavItems.slice(0, 5).map(({ path, icon: Icon, label }) => (
              <Link key={path} href={path}>
                <button
                  className={`flex flex-col items-center justify-center p-2 min-w-[60px] rounded-lg transition-colors ${
                    location === path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Add Subscription */}
      <Link href="/add">
        <button className="fixed bottom-20 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 md:hidden">
          <Plus className="h-6 w-6" />
        </button>
      </Link>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Mulah</h1>
          <p className="text-sm text-gray-500 mt-1">Financial Middleware Platform</p>
        </div>
        
        <nav className="px-4 space-y-2">
          {adminNavItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} href={path}>
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  location === path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </button>
            </Link>
          ))}
          
          <Link href="/add">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add Subscription</span>
            </button>
          </Link>
        </nav>
      </div>

      {/* Content padding for desktop */}
      <div className="hidden md:block w-64"></div>
    </>
  );
}