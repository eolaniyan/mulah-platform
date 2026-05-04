import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";
import { Plus, TrendingUp, Euro, Zap, LogOut, Trash2, X, Moon, Sun, Settings2, ChevronRight, AlertTriangle, ExternalLink } from "lucide-react";
import type { ServiceDirectory } from "@shared/schema";

interface SwipeableSubscriptionCardProps {
  subscription: Subscription;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  onManage: (id: number) => void;
  resetTrigger: number;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status || status === 'active') return null;
  
  const styles = {
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };
  
  const labels = {
    paused: 'Paused',
    cancelled: 'Cancelled'
  };
  
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${styles[status as keyof typeof styles] || ''}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function SwipeableSubscriptionCard({ subscription, onDelete, isDeleting, onManage, resetTrigger }: SwipeableSubscriptionCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80;
  
  // Reset swipe state when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setIsRevealed(false);
      setCurrentX(0);
    }
  }, [resetTrigger]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startX - e.touches[0].clientX;
    if (diff > 0) {
      setCurrentX(Math.min(diff, 100));
    } else if (isRevealed) {
      setCurrentX(Math.max(100 + diff, 0));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentX > SWIPE_THRESHOLD) {
      setIsRevealed(true);
      setCurrentX(100);
    } else {
      setIsRevealed(false);
      setCurrentX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = startX - e.clientX;
    if (diff > 0) {
      setCurrentX(Math.min(diff, 100));
    } else if (isRevealed) {
      setCurrentX(Math.max(100 + diff, 0));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (currentX > SWIPE_THRESHOLD) {
      setIsRevealed(true);
      setCurrentX(100);
    } else {
      setIsRevealed(false);
      setCurrentX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const closeReveal = () => {
    setIsRevealed(false);
    setCurrentX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete button behind the card */}
      <div 
        className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center"
        style={{ opacity: currentX / 100 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-full w-full text-white hover:bg-red-600 flex flex-col items-center justify-center gap-1"
          onClick={() => onDelete(subscription.id)}
          disabled={isDeleting}
          data-testid={`button-delete-${subscription.id}`}
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-xs">Delete</span>
        </Button>
      </div>

      {/* The actual card */}
      <Card 
        ref={cardRef}
        className="compact-card relative bg-white cursor-grab active:cursor-grabbing select-none"
        style={{ 
          transform: `translateX(-${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ backgroundColor: subscription.iconColor || '#6366f1' }}
            >
              <i className={subscription.iconName || 'fas fa-star'}></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-sm truncate">{subscription.name}</h3>
                <StatusBadge status={subscription.status} />
              </div>
              <p className="text-xs text-gray-500">
                {subscription.billingCycle === 'monthly' ? 'Monthly' : 
                 subscription.billingCycle === 'yearly' ? 'Yearly' : 'Weekly'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-sm">€{parseFloat(subscription.cost).toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {new Date(subscription.nextBillingDate).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </p>
            </div>
            {isRevealed ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-400 hover:text-gray-600"
                onClick={closeReveal}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-400 hover:text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onManage(subscription.id);
                }}
                data-testid={`button-control-${subscription.id}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    open: boolean; 
    id: number | null; 
    name: string;
    controlMethod: string;
  }>({
    open: false,
    id: null,
    name: '',
    controlMethod: 'self_service'
  });
  
  // Track swipe reset trigger - increment to reset a specific card's swipe state
  const [swipeResetTrigger, setSwipeResetTrigger] = useState(0);
  
  const handleManageSubscription = (id: number) => {
    navigate(`/subscriptions/control/${id}`);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
  });

  const { data: monthlyAnalytics } = useQuery({
    queryKey: ["/api/analytics/monthly"],
    enabled: isAuthenticated,
  });

  const { data: annualAnalytics } = useQuery({
    queryKey: ["/api/analytics/annual"],
    enabled: isAuthenticated,
  });

  const { data: monthlyDueData } = useQuery({
    queryKey: ["/api/analytics/monthly-due"],
    enabled: isAuthenticated,
  });

  const demoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/demo/populate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/annual"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-due"] });
      toast({
        title: "Demo data added!",
        description: "Sample subscriptions have been added to your account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: serviceDirectory } = useQuery<ServiceDirectory[]>({
    queryKey: ["/api/service-directory"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/subscriptions/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json() as Promise<{ 
        action: 'cancelled_and_deleted' | 'archived_only'; 
        controlMethod: string; 
        cancellationUrl?: string;
        serviceName: string;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/annual"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfa/summary"] });
      setDeleteConfirm({ open: false, id: null, name: '', controlMethod: 'self_service' });
      
      if (data.action === 'cancelled_and_deleted') {
        toast({
          title: "Subscription cancelled and removed",
          description: `${data.serviceName} has been cancelled and removed from your list.`,
        });
      } else {
        toast({
          title: "Subscription removed from list",
          description: data.cancellationUrl 
            ? `${data.serviceName} was removed but is still active with the provider. Visit their site to cancel.`
            : `${data.serviceName} was removed but is still active with the provider.`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRequest = (id: number) => {
    const sub = subscriptions?.find(s => s.id === id);
    // Use partial matching - subscription name may include plan (e.g., "StreamFlix Premium")
    const service = serviceDirectory?.find(s => 
      sub?.name.toLowerCase().startsWith(s.name.toLowerCase())
    );
    const controlMethod = service?.controlMethod || 'self_service';
    setDeleteConfirm({ open: true, id, name: sub?.name || 'this subscription', controlMethod });
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset swipe state when dialog closes without deleting
      setSwipeResetTrigger(prev => prev + 1);
    }
    setDeleteConfirm(prev => ({ ...prev, open }));
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  if (authLoading) {
    return <div className="mobile-container flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalMonthly = (monthlyAnalytics as { total?: number })?.total || 0;
  const subscriptionCount = subscriptions?.length || 0;
  const monthlyDueCount = (monthlyDueData as { count?: number })?.count || 0;

  return (
    <>
      <div className="mobile-container pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div>
            <h1 className="text-lg font-bold dark:text-white">Mulah</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Financial Control</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="ghost"
              className="h-9 w-9 p-0 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              data-testid="button-toggle-theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-9 w-9 p-0 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              onClick={() => window.location.href = '/api/logout'}
              title="Sign Out"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Link href="/add" className="inline-block">
              <Button size="sm" className="h-10 w-10 p-0 bg-green-600 hover:bg-green-700 shadow-md shadow-green-200 dark:shadow-green-900/30" data-testid="button-add-subscription">
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="mobile-content space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="compact-card">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Euro className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">This Month</p>
                    <p className="text-lg font-bold">€{totalMonthly.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="compact-card">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due This Month</p>
                    <p className="text-lg font-bold">{monthlyDueCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* USW Highlight Card */}
          <Link href="/usw" className="block" data-testid="link-usw">
            <Card className="compact-card cursor-pointer hover:shadow-md active:scale-95 transition-transform bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-100 rounded-xl">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Unified Subscription Wallet</p>
                      <p className="text-xs text-purple-600">One payment for all your subscriptions</p>
                    </div>
                  </div>
                  <div className="text-purple-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Subscription List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Your Subscriptions</h2>
                <p className="text-xs text-gray-500">{subscriptionCount} total • Tap to manage</p>
              </div>
              <div className="flex items-center gap-2">
                {subscriptionCount === 0 && (
                  <Button 
                    onClick={() => demoMutation.mutate()}
                    variant="outline" 
                    size="sm"
                    disabled={demoMutation.isPending}
                  >
                    {demoMutation.isPending ? "Adding..." : "Add Demo"}
                  </Button>
                )}
                {subscriptionCount > 0 && (
                  <Link href="/analytics">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      data-testid="button-manage-all"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      View Analytics
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {subscriptionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="compact-card">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : subscriptions && subscriptions.length > 0 ? (
              <div className="space-y-2">
                {[...subscriptions]
                  .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
                  .map((subscription) => (
                    <SwipeableSubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      onDelete={handleDeleteRequest}
                      isDeleting={deleteMutation.isPending}
                      onManage={handleManageSubscription}
                      resetTrigger={swipeResetTrigger}
                    />
                  ))}
              </div>
            ) : (
              <Card className="compact-card">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-gray-100 rounded-full mx-auto w-fit mb-3">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium mb-2">No subscriptions yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Start by adding your first subscription
                  </p>
                  <Link href="/add">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Add Subscription
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog - Control Method Aware */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm.controlMethod === 'mulah_merchant' 
                ? 'Cancel & Remove Subscription' 
                : 'Remove from List'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {deleteConfirm.controlMethod === 'mulah_merchant' ? (
                <div className="space-y-2">
                  <p>This will <strong>cancel your subscription</strong> with <strong>{deleteConfirm.name}</strong> and remove it from your list.</p>
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="p-1 bg-green-100 rounded-full mt-0.5">
                      <Zap className="h-3 w-3 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700">
                      <strong>Mulah Merchant</strong> - We have full control. Your subscription will be cancelled immediately.
                    </p>
                  </div>
                </div>
              ) : deleteConfirm.controlMethod === 'api' ? (
                <div className="space-y-2">
                  <p>This will <strong>remove {deleteConfirm.name} from your list only</strong>.</p>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Your subscription remains active with the provider. Visit the <strong>Manage</strong> page to cancel via API.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>This will <strong>remove {deleteConfirm.name} from your list only</strong>.</p>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      <strong>Important:</strong> Your subscription will still be active! You'll need to cancel directly with {deleteConfirm.name} to stop being charged.
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="sm:flex-1">Keep Subscription</AlertDialogCancel>
            {deleteConfirm.controlMethod !== 'mulah_merchant' && (
              <Button
                variant="outline"
                className="sm:flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setDeleteConfirm(prev => ({ ...prev, open: false }));
                  if (deleteConfirm.id) navigate(`/subscriptions/control/${deleteConfirm.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Go to Cancel
              </Button>
            )}
            <AlertDialogAction 
              onClick={confirmDelete}
              className={deleteConfirm.controlMethod === 'mulah_merchant' 
                ? "sm:flex-1 bg-red-600 hover:bg-red-700" 
                : "sm:flex-1 bg-gray-600 hover:bg-gray-700"}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Processing..." : 
               deleteConfirm.controlMethod === 'mulah_merchant' ? "Cancel & Remove" : "Remove from List"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

          </>
  );
}
