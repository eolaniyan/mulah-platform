import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Mail,
  Plus,
  Pause,
  Play
} from "lucide-react";

interface ConciergeRequest {
  id: number;
  subscriptionId: number;
  serviceId?: number;
  requestType: 'cancel' | 'pause' | 'resume';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  userEmail: string;
  userAccountInfo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedAgent?: string;
}

interface Subscription {
  id: number;
  name: string;
  cost: string;
  category: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Queued",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
    progress: 25
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Loader2,
    progress: 50
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
    progress: 100
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    progress: 0
  }
};

function RequestCard({ 
  request, 
  subscription 
}: { 
  request: ConciergeRequest; 
  subscription?: Subscription;
}) {
  const [, navigate] = useLocation();
  const config = STATUS_CONFIG[request.status];
  const StatusIcon = config.icon;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IE', { 
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/subscriptions/control/${request.subscriptionId}`)}
      data-testid={`concierge-request-${request.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">
                {subscription?.name || `Subscription #${request.subscriptionId}`}
              </h3>
              <Badge className={`${config.color} border text-xs`}>
                <StatusIcon className={`h-3 w-3 mr-1 ${request.status === 'in_progress' ? 'animate-spin' : ''}`} />
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} request
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
        
        <Progress value={config.progress} className="h-1.5 mb-3" />
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(request.createdAt)}
          </div>
          {request.assignedAgent && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {request.assignedAgent}
            </div>
          )}
        </div>
        
        {request.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <MessageCircle className="h-3 w-3 inline mr-1" />
            {request.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: 'all' | 'active' | 'completed' }) {
  const messages = {
    all: {
      title: "No Concierge Requests",
      description: "When you request help cancelling or pausing a subscription, it will appear here."
    },
    active: {
      title: "No Active Requests",
      description: "You don't have any ongoing concierge requests at the moment."
    },
    completed: {
      title: "No Completed Requests",
      description: "Completed requests will show up here for your records."
    }
  };
  
  return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="font-medium text-gray-700">{messages[type].title}</p>
      <p className="text-sm text-gray-500 mt-1">{messages[type].description}</p>
    </div>
  );
}

export default function ConciergeRequests() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [requestType, setRequestType] = useState<string>("cancel");
  const [accountInfo, setAccountInfo] = useState("");
  const [notes, setNotes] = useState("");
  
  const { data: requests, isLoading: requestsLoading, refetch } = useQuery<ConciergeRequest[]>({
    queryKey: ['/api/concierge/requests']
  });
  
  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions']
  });
  
  const createRequestMutation = useMutation({
    mutationFn: async (data: { subscriptionId: number; requestType: string; userEmail?: string; userAccountInfo?: object; internalNotes?: string }) => {
      const response = await apiRequest("POST", "/api/concierge/requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Created",
        description: "Our concierge team will handle this for you.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/concierge/requests'] });
      setShowNewRequest(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Could not create request",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setSelectedSubscriptionId("");
    setRequestType("cancel");
    setAccountInfo("");
    setNotes("");
  };
  
  const userEmail = (user as any)?.email as string | undefined;
  const emailToUse = userEmail || accountInfo || "";
  const canSubmit = !!selectedSubscriptionId && !!emailToUse.trim();
  
  const handleSubmit = () => {
    if (!selectedSubscriptionId) {
      toast({ title: "Please select a subscription", variant: "destructive" });
      return;
    }
    if (!emailToUse.trim()) {
      toast({ title: "Please provide your account email", variant: "destructive" });
      return;
    }
    createRequestMutation.mutate({
      subscriptionId: parseInt(selectedSubscriptionId),
      requestType,
      userEmail: emailToUse.trim(),
      userAccountInfo: accountInfo ? { accountEmail: accountInfo } : undefined,
      internalNotes: notes || undefined,
    });
  };
  
  const getSubscription = (id: number) => subscriptions?.find(s => s.id === id);
  
  const activeRequests = requests?.filter(r => 
    r.status === 'pending' || r.status === 'in_progress'
  ) || [];
  
  const completedRequests = requests?.filter(r => 
    r.status === 'completed' || r.status === 'failed'
  ) || [];
  
  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
  const inProgressCount = requests?.filter(r => r.status === 'in_progress').length || 0;
  const completedCount = requests?.filter(r => r.status === 'completed').length || 0;
  
  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Concierge
              </h1>
              <p className="text-xs text-gray-500">Your cancellation requests</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button 
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowNewRequest(true)}
              data-testid="button-new-request"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mobile-content pb-24 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-600">Queued</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
        </div>
        
        {requestsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="active" className="text-sm">
                Active ({activeRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-sm">
                Completed ({completedRequests.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4 space-y-3">
              {activeRequests.length === 0 ? (
                <EmptyState type="active" />
              ) : (
                activeRequests.map(request => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    subscription={getSubscription(request.subscriptionId)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedRequests.length === 0 ? (
                <EmptyState type="completed" />
              ) : (
                completedRequests.map(request => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    subscription={getSubscription(request.subscriptionId)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-orange-800">How Concierge Works</h3>
                <ul className="text-xs text-orange-700 mt-2 space-y-1">
                  <li>1. We contact the service on your behalf</li>
                  <li>2. We handle all the back-and-forth</li>
                  <li>3. You get confirmation when done</li>
                </ul>
                <p className="text-xs text-orange-600 mt-2">
                  Most requests complete within 24-48 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          className="w-full"
          variant="outline"
          onClick={() => navigate('/subscriptions/manage')}
          data-testid="button-manage-subscriptions"
        >
          Manage Subscriptions
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <Sheet open={showNewRequest} onOpenChange={setShowNewRequest}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              New Concierge Request
            </SheetTitle>
            <SheetDescription>
              We'll handle the cancellation or pause for you
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 overflow-y-auto pb-6">
            <div className="space-y-2">
              <Label htmlFor="subscription">Select Subscription</Label>
              <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                <SelectTrigger data-testid="select-subscription">
                  <SelectValue placeholder="Choose a subscription..." />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions?.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>
                      {sub.name} - €{parseFloat(sub.cost).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>What would you like to do?</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={requestType === 'cancel' ? 'default' : 'outline'}
                  className={requestType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setRequestType('cancel')}
                  data-testid="button-request-cancel"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={requestType === 'pause' ? 'default' : 'outline'}
                  className={requestType === 'pause' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  onClick={() => setRequestType('pause')}
                  data-testid="button-request-pause"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  type="button"
                  variant={requestType === 'resume' ? 'default' : 'outline'}
                  className={requestType === 'resume' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setRequestType('resume')}
                  data-testid="button-request-resume"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountInfo">
                Service Account Email {userEmail ? <span className="text-gray-400">(Optional - we have your email)</span> : <span className="text-red-400">*</span>}
              </Label>
              {userEmail && (
                <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  We'll use your account email: {userEmail}
                </p>
              )}
              <Input
                id="accountInfo"
                placeholder={userEmail ? "Different email for this service (optional)" : "Email used with this service *"}
                value={accountInfo}
                onChange={(e) => setAccountInfo(e.target.value)}
                data-testid="input-account-info"
              />
              <p className="text-xs text-gray-500">
                {userEmail ? "Only fill this if you use a different email for this service" : "We need your email to contact the service on your behalf"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">
                Additional Notes <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="notes"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3 text-sm text-orange-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="text-xs space-y-1 text-orange-700">
                  <li>• Our team contacts the service on your behalf</li>
                  <li>• We handle all verification and paperwork</li>
                  <li>• You'll get a confirmation when complete</li>
                  <li>• Usually done within 24-48 hours</li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNewRequest(false);
                  resetForm();
                }}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSubmit}
                disabled={createRequestMutation.isPending || !canSubmit}
                data-testid="button-submit-request"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
