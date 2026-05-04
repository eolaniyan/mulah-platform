import { Link } from "wouter";
import { FinanceBottomNav } from "./FinanceBottomNav";
import { Home } from "lucide-react";

interface FinanceHubLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackToHome?: boolean;
}

export function FinanceHubLayout({ 
  children, 
  title = "Finance",
  showBackToHome = true 
}: FinanceHubLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {showBackToHome && (
        <div className="bg-amber-600 dark:bg-amber-800 px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors" data-testid="button-back-home">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </button>
          </Link>
          <span className="text-white/50">|</span>
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
      )}
      {children}
      <FinanceBottomNav />
    </div>
  );
}
