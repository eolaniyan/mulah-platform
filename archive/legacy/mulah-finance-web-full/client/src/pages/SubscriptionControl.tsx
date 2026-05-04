import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield,
  Zap,
  Users,
  Pause,
  XCircle,
  Play,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  MessageCircle,
  Mail,
  Building2,
  ChevronRight,
  Sparkles,
  Link,
  RefreshCw
} from "lucide-react";

interface Subscription {
  id: number;
  name: string;
  cost: string;
  currency: string;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  isActive: boolean;
  status: string;
}

interface ServiceInfo {
  id: number;
  name: string;
  slug: string;
  category: string;
  controlMethod: 'mulah_merchant' | 'api' | 'self_service' | 'concierge';
  apiProvider?: string;
  cancellationUrl?: string;
  cancellationInstructions?: string;
  pauseSupported: boolean;
  pauseInstructions?: string;
  estimatedCancellationTime?: string;
  requiredInfo?: string[];
  websiteUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface ConciergeRequest {
  id: number;
  subscriptionId: number;
  serviceId?: number;
  requestType: 'cancel' | 'pause' | 'resume';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  userEmail: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface ControlResult {
  method: string;
  status: string;
  message: string;
  requestId?: number;
}

const CONTROL_METHOD_INFO = {
  mulah_merchant: {
    icon: Shield,
    label: "Instant Control",
    description: "This service uses Mulah as their billing platform. Changes happen instantly.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  api: {
    icon: Zap,
    label: "API Connected",
    description: "Connected via payment API. Changes typically complete within minutes.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  self_service: {
    icon: ExternalLink,
    label: "Self-Service",
    description: "Manage directly on the service's website. We'll guide you through the steps.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  concierge: {
    icon: Users,
    label: "Concierge Service",
    description: "Our team will handle this for you. Typically completed within 24-48 hours.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  }
};

function ControlMethodBadge({ method }: { method: keyof typeof CONTROL_METHOD_INFO }) {
  const info = CONTROL_METHOD_INFO[method] || CONTROL_METHOD_INFO.concierge;
  const Icon = info.icon;
  
  return (
    <Badge className={`${info.bgColor} ${info.color} ${info.borderColor} border`}>
      <Icon className="h-3 w-3 mr-1" />
      {info.label}
    </Badge>
  );
}

function ConciergeRequestCard({ request }: { request: ConciergeRequest }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700"
  };
  
  const statusLabels = {
    pending: "Queued",
    in_progress: "In Progress",
    completed: "Completed",
    failed: "Failed"
  };
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">
              {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} Request
            </p>
            <p className="text-xs text-gray-500">
              Submitted {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={statusColors[request.status]}>
            {statusLabels[request.status]}
          </Badge>
        </div>
        {request.notes && (
          <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
            {request.notes}
          </p>
        )}
        <div className="mt-3">
          <Progress 
            value={
              request.status === 'pending' ? 25 :
              request.status === 'in_progress' ? 50 :
              request.status === 'completed' ? 100 : 0
            } 
            className="h-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MulahMerchantPanel({ 
  subscription, 
  serviceInfo,
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  serviceInfo: ServiceInfo | null;
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  const canPause = serviceInfo?.pauseSupported === true;
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-green-700">Mulah Merchant - Instant Control</p>
            <p className="text-xs text-green-600 mt-1">
              This service uses Mulah as their billing platform. Changes happen instantly with one tap.
            </p>
          </div>
        </div>
      </div>
      
      <Alert className="bg-green-50 border-green-200">
        <Zap className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 text-sm">
          <strong>Instant processing:</strong> Your request will be processed immediately. No waiting, no emails.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        {isActive && (
          <>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => onAction('cancel', { method: 'instant' })}
              disabled={isLoading}
              data-testid="button-cancel-subscription"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Cancel Instantly
            </Button>
            {canPause && (
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => onAction('pause', { method: 'instant' })}
                disabled={isLoading}
                data-testid="button-pause-subscription"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                Pause Instantly
              </Button>
            )}
          </>
        )}
        {isPaused && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onAction('resume', { method: 'instant' })}
            disabled={isLoading}
            data-testid="button-resume-subscription"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Resume Instantly
          </Button>
        )}
      </div>
    </div>
  );
}

function APIControlPanel({ 
  subscription, 
  serviceInfo,
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  serviceInfo: ServiceInfo | null;
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  const canPause = serviceInfo?.pauseSupported === true;
  
  // Fetch connection status
  const { data: connection, refetch: refetchConnection } = useQuery<any>({
    queryKey: ['/api/connections', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/connections/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const isConnected = connection?.status === 'connected';
  
  const handleConnect = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your account email", variant: "destructive" });
      return;
    }
    
    setIsConnecting(true);
    try {
      const res = await fetch('/api/connections/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: subscription.id,
          serviceSlug: serviceInfo?.slug || subscription.name.toLowerCase().replace(/\s+/g, '-'),
          email,
          password
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: "Connected!", description: data.message });
        refetchConnection();
      } else {
        toast({ title: "Connection failed", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect account", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleReset = async () => {
    try {
      await fetch('/api/connections/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: subscription.id })
      });
      toast({ title: "Demo Reset", description: "You can now connect again" });
      refetchConnection();
      setEmail('');
      setPassword('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset", variant: "destructive" });
    }
  };
  
  // Not connected - show connection form
  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Link className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-blue-700">Connect Your Account</p>
              <p className="text-xs text-blue-600 mt-1">
                Link your {serviceInfo?.name || subscription.name} account to enable instant control from Mulah.
              </p>
            </div>
          </div>
        </div>
        
        <Alert className="bg-purple-50 border-purple-200">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-700 text-sm">
            <strong>Secure connection:</strong> Your credentials are encrypted and only used to establish the API link.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 bg-white rounded-lg p-4 border">
          <div>
            <Label className="text-sm font-medium text-gray-700">Account Email *</Label>
            <Input
              type="email"
              placeholder={`your-email@${serviceInfo?.slug || 'service'}.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              data-testid="input-connect-email"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Password (demo)</Label>
            <Input
              type="password"
              placeholder="Enter any password for demo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              data-testid="input-connect-password"
            />
            <p className="text-xs text-gray-500 mt-1">For demo purposes - any value works</p>
          </div>
        </div>
        
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleConnect}
          disabled={isConnecting || !email}
          data-testid="button-connect-account"
        >
          {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
          Connect {serviceInfo?.name || subscription.name} Account
        </Button>
      </div>
    );
  }
  
  // Connected - show control options
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-green-700">Account Connected</p>
            <p className="text-xs text-green-600 mt-1">
              Linked as {connection.connectedEmail}. You now have instant control.
            </p>
          </div>
        </div>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          <strong>Instant control:</strong> Changes are processed immediately through the API. No waiting required!
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        {isActive && (
          <>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => onAction('cancel', { method: 'api' })}
              disabled={isLoading}
              data-testid="button-cancel-subscription"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Cancel Instantly
            </Button>
            {canPause && (
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => onAction('pause', { method: 'api' })}
                disabled={isLoading}
                data-testid="button-pause-subscription"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                Pause Instantly
              </Button>
            )}
          </>
        )}
        {isPaused && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onAction('resume', { method: 'api' })}
            disabled={isLoading}
            data-testid="button-resume-subscription"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Resume Instantly
          </Button>
        )}
      </div>
      
      <div className="pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-500 hover:text-gray-700"
          onClick={handleReset}
          data-testid="button-reset-connection"
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Reset Demo Connection
        </Button>
      </div>
    </div>
  );
}

function SelfServicePanel({ 
  subscription, 
  serviceInfo,
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  serviceInfo: ServiceInfo | null;
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  
  const instructions = serviceInfo?.cancellationInstructions?.split('\n') || [];
  const pauseInstructions = serviceInfo?.pauseInstructions?.split('\n') || [];
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <ExternalLink className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-purple-700">Self-Service - Follow Steps</p>
            <p className="text-xs text-purple-600 mt-1">
              Manage directly on {serviceInfo?.name || 'the service'}'s website. We'll guide you through the steps.
            </p>
          </div>
        </div>
      </div>
      
      {instructions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            How to Cancel:
          </p>
          <ol className="space-y-2 text-sm text-gray-700">
            {instructions.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      
      {serviceInfo?.cancellationUrl && (
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={() => window.open(serviceInfo.cancellationUrl, '_blank')}
          data-testid="button-open-service"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open {serviceInfo.name} to Cancel
        </Button>
      )}
      
      {serviceInfo?.estimatedCancellationTime && (
        <p className="text-xs text-gray-500 text-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Estimated time: {serviceInfo.estimatedCancellationTime}
        </p>
      )}
      
      <div className="border-t pt-4 mt-4">
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={() => onAction('mark_cancelled', { method: 'self_service' })}
          disabled={isLoading}
          data-testid="button-mark-cancelled"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          I've Cancelled This - Update My Records
        </Button>
      </div>
    </div>
  );
}

// ========== SPECIALIZED CONTROL PANELS ==========

function TrialBoxPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const trialEndDate = new Date('2025-01-03');
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Fetch persisted state
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const cancelled = scenarioState?.cancelled || false;
  
  const handleCancelBeforeCharge = async () => {
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'trialbox',
          state: { cancelled: true, cancelledAt: new Date().toISOString() }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Trial Cancelled!", description: "You won't be charged. Enjoy your remaining trial days!" });
      onAction('cancel', { method: 'api', note: 'Trial cancelled before billing' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel trial", variant: "destructive" });
    }
  };
  
  const handleReactivate = async () => {
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'trialbox',
          state: { cancelled: false, reactivatedAt: new Date().toISOString() }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Trial Reactivated!", description: "Your trial is back on. You'll be billed on Jan 3rd." });
      onAction('resume', { method: 'api', note: 'Trial reactivated' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reactivate trial", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-700">Trial Status</span>
          </div>
          <Badge className={daysLeft <= 3 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}>
            {daysLeft} days left
          </Badge>
        </div>
        
        <div className="relative pt-2">
          <Progress value={Math.max(5, (14 - daysLeft) / 14 * 100)} className="h-3 bg-purple-100" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Trial started</span>
            <span>Billing: Jan 3</span>
          </div>
        </div>
      </div>
      
      {!cancelled ? (
        <>
          <Alert className={daysLeft <= 3 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
            <AlertTriangle className={`h-4 w-4 ${daysLeft <= 3 ? 'text-red-600' : 'text-amber-600'}`} />
            <AlertDescription className={`text-sm ${daysLeft <= 3 ? 'text-red-700' : 'text-amber-700'}`}>
              {daysLeft <= 3 
                ? <><strong>Billing soon!</strong> You'll be charged €39.99 in {daysLeft} days unless you cancel.</>
                : <><strong>Reminder:</strong> Your trial converts to €39.99/month on Jan 3rd.</>
              }
            </AlertDescription>
          </Alert>
          
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleCancelBeforeCharge}
            disabled={isLoading}
            data-testid="button-cancel-trial"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Before I'm Charged
          </Button>
          
          <p className="text-xs text-center text-gray-600">
            You can still use the service for the remaining {daysLeft} days after cancelling
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700">Trial Cancelled Successfully!</p>
            <p className="text-sm text-green-600 mt-1">You won't be charged. Enjoy your remaining {daysLeft} trial days!</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700 mb-3">
              <strong>Changed your mind?</strong> You can reactivate your trial and continue to the paid subscription.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleReactivate}
              disabled={isLoading}
              data-testid="button-reactivate-trial"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reactivate Trial & Subscribe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkyShieldPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [showRefund, setShowRefund] = useState(false);
  const { toast } = useToast();
  
  const monthlyPremium = 29.99;
  const coverageSince = new Date('2024-06-15');
  const daysInMonth = 30;
  const daysUsed = 12;
  const daysRemaining = daysInMonth - daysUsed;
  const proratedRefund = ((daysRemaining / daysInMonth) * monthlyPremium).toFixed(2);
  const adminFee = 5.00;
  const netRefund = (parseFloat(proratedRefund) - adminFee).toFixed(2);
  
  // Fetch persisted state
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const submitted = scenarioState?.refundRequested || false;
  
  const handleRequestRefund = async () => {
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'skyshield',
          state: { refundRequested: true, refundAmount: netRefund, requestedAt: new Date().toISOString() }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Refund Requested!", description: `€${netRefund} will be credited within 5-7 business days.` });
      onAction('cancel', { method: 'concierge', refundAmount: netRefund });
    } catch (error) {
      toast({ title: "Error", description: "Failed to request refund", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-700">Insurance Policy Management</p>
            <p className="text-xs text-blue-600 mt-1">
              SkyShield Premium • Policy #SKY-2024-78432
            </p>
          </div>
        </div>
      </div>
      
      {!showRefund && !submitted && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">Monthly Premium</p>
              <p className="font-bold text-lg text-gray-900">€{monthlyPremium}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">Coverage Since</p>
              <p className="font-bold text-lg text-gray-900">{coverageSince.toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              <strong>60-day notice required.</strong> Early termination fee may apply based on remaining contract.
            </AlertDescription>
          </Alert>
          
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowRefund(true)}
            data-testid="button-calculate-refund"
          >
            <Shield className="h-4 w-4 mr-2" />
            Calculate My Refund
          </Button>
        </>
      )}
      
      {showRefund && !submitted && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-700 mb-3">Prorated Refund Calculator</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Days remaining in period:</span>
                <span className="font-medium text-gray-900">{daysRemaining} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Prorated amount:</span>
                <span className="font-medium text-gray-900">€{proratedRefund}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Admin fee:</span>
                <span>-€{adminFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-green-700 font-bold">
                <span>Your refund:</span>
                <span>€{netRefund}</span>
              </div>
            </div>
          </div>
          
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleRequestRefund}
            disabled={isLoading}
            data-testid="button-request-refund"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Request €{netRefund} Refund & Cancel
          </Button>
          
          <Button
            variant="ghost"
            className="w-full text-gray-700"
            onClick={() => setShowRefund(false)}
          >
            Back
          </Button>
        </div>
      )}
      
      {submitted && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">Refund Request Submitted!</p>
          <p className="text-sm text-green-600 mt-1">€{netRefund} will be credited to your account within 5-7 business days.</p>
        </div>
      )}
    </div>
  );
}

function UnityHubPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const { toast } = useToast();
  
  const defaultMembers = [
    { id: 1, name: 'You', email: 'you@email.com', share: 12.50, canRemove: false, isOwner: true },
    { id: 2, name: 'Sarah', email: 'sarah@email.com', share: 6.25, canRemove: true, isOwner: false },
    { id: 3, name: 'Mike', email: 'mike@email.com', share: 6.25, canRemove: true, isOwner: false },
  ];
  
  // Fetch persisted state
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const members = scenarioState?.members || defaultMembers;
  const owner = members.find((m: any) => m.isOwner) || members[0];
  const isPaused = scenarioState?.paused || false;
  
  const handleRemoveMember = async (id: number) => {
    const newMembers = members.filter((m: any) => m.id !== id);
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'unityhub',
          state: { members: newMembers, paused: isPaused }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Member Removed", description: "Their access has been revoked." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    }
  };
  
  const handleAddMember = async () => {
    if (!newMemberName || !newMemberEmail) return;
    const newId = Math.max(...members.map((m: any) => m.id)) + 1;
    const memberName = newMemberName; // Save before clearing
    const newMembers = [...members, { id: newId, name: newMemberName, email: newMemberEmail, share: 6.25, canRemove: true, isOwner: false }];
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'unityhub',
          state: { members: newMembers, paused: isPaused }
        })
      });
      setShowAddMember(false);
      setNewMemberName('');
      setNewMemberEmail('');
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Member Added", description: `${memberName} has been invited to join.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    }
  };
  
  const handleTransferOwnership = async (newOwnerId: number) => {
    const newOwner = members.find((m: any) => m.id === newOwnerId);
    const newMembers = members.map((m: any) => ({
      ...m,
      isOwner: m.id === newOwnerId,
      canRemove: m.id !== newOwnerId
    }));
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'unityhub',
          state: { members: newMembers, paused: isPaused }
        })
      });
      setShowTransfer(false);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Ownership Transferred", description: `${newOwner?.name} is now the plan owner.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to transfer ownership", variant: "destructive" });
    }
  };
  
  const handlePause = async () => {
    const wasPaused = isPaused;
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'unityhub',
          state: { members, paused: !isPaused }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ 
        title: wasPaused ? "Plan Resumed" : "Plan Paused", 
        description: wasPaused ? "All members now have access again." : "All member access has been paused." 
      });
      onAction(wasPaused ? 'resume' : 'pause', { method: 'concierge' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update plan status", variant: "destructive" });
    }
  };
  
  // Pricing: €12.50 base for owner + €6.25 per additional member
  const basePrice = 12.50;
  const perMemberPrice = 6.25;
  const additionalMembers = Math.max(0, members.length - 1);
  const totalCost = (basePrice + (perMemberPrice * additionalMembers)).toFixed(2);
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-indigo-700">Family Plan Manager</p>
              <p className="text-xs text-indigo-600 mt-1">{members.length} member{members.length > 1 ? 's' : ''} • €{totalCost}/month total</p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700">+€{perMemberPrice.toFixed(2)}/member</Badge>
        </div>
      </div>
      
      {isPaused && (
        <Alert className="bg-orange-50 border-orange-200">
          <Pause className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 text-sm">
            <strong>Plan is paused.</strong> All member access is currently suspended.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        {members.map((member: any) => (
          <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg ${member.isOwner ? 'bg-indigo-100 border border-indigo-300' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${member.isOwner ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  {member.isOwner && <Badge className="bg-indigo-600 text-white text-xs">Owner</Badge>}
                </div>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">€{member.isOwner ? basePrice.toFixed(2) : perMemberPrice.toFixed(2)}</span>
              {member.canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                  onClick={() => handleRemoveMember(member.id)}
                  data-testid={`button-remove-member-${member.id}`}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showAddMember && (
        <div className="p-4 bg-indigo-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-indigo-700">Add New Member</p>
          <Input 
            placeholder="Name" 
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="bg-white text-gray-900 placeholder:text-gray-500 border-gray-300"
            data-testid="input-new-member-name"
          />
          <Input 
            placeholder="Email" 
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="bg-white text-gray-900 placeholder:text-gray-500 border-gray-300"
            data-testid="input-new-member-email"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddMember(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddMember} className="flex-1 bg-indigo-600 hover:bg-indigo-700" data-testid="button-confirm-add-member">Add</Button>
          </div>
        </div>
      )}
      
      {!showAddMember && (
        <Button
          variant="outline"
          className="w-full border-indigo-300 text-indigo-600"
          onClick={() => setShowAddMember(true)}
          data-testid="button-add-member"
        >
          <Users className="h-4 w-4 mr-2" />
          Add Family Member
        </Button>
      )}
      
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          <strong>Want to cancel?</strong> You must first remove all family members or transfer ownership.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className={isPaused ? "border-green-300 text-green-600" : "border-orange-300 text-orange-600"}
          onClick={handlePause}
          disabled={isLoading}
          data-testid="button-pause-family"
        >
          {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="outline"
          className="border-indigo-300 text-indigo-600"
          onClick={() => setShowTransfer(true)}
          disabled={members.filter((m: any) => m.canRemove).length === 0}
          data-testid="button-transfer-ownership"
        >
          Transfer
        </Button>
        <Button
          variant="outline"
          className="border-red-300 text-red-600"
          onClick={() => onAction('cancel', { method: 'concierge', note: 'Family plan cancellation' })}
          disabled={members.length > 1 || isLoading}
          data-testid="button-cancel-family"
        >
          Cancel
        </Button>
      </div>
      
      {showTransfer && (
        <div className="p-3 bg-indigo-50 rounded-lg text-center">
          <p className="text-sm text-indigo-700 mb-2">Select new owner:</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {members.filter((m: any) => m.canRemove).map((m: any) => (
              <Button
                key={m.id}
                size="sm"
                variant="outline"
                onClick={() => handleTransferOwnership(m.id)}
                data-testid={`button-transfer-to-${m.id}`}
              >
                {m.name}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2 text-gray-600" onClick={() => setShowTransfer(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

function PilatesLoftPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [memberNumber, setMemberNumber] = useState('');
  const [currentSlot, setCurrentSlot] = useState('');
  const { toast } = useToast();
  
  const availableSlots = [
    { id: '1', date: 'Mon, Dec 23', time: '10:00 AM', available: true },
    { id: '2', date: 'Mon, Dec 23', time: '2:00 PM', available: true },
    { id: '3', date: 'Tue, Dec 24', time: '11:00 AM', available: false },
    { id: '4', date: 'Thu, Dec 26', time: '9:00 AM', available: true },
    { id: '5', date: 'Fri, Dec 27', time: '3:00 PM', available: true },
  ];
  
  const currentSlotOptions = [
    'Monday 7:00 AM',
    'Monday 6:00 PM',
    'Tuesday 9:00 AM',
    'Wednesday 7:00 AM',
    'Thursday 6:00 PM',
    'Friday 9:00 AM',
    'Saturday 10:00 AM',
  ];
  
  // Fetch persisted state
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const booked = scenarioState?.booked || false;
  const bookedSlot = scenarioState?.bookedSlot;
  const savedMemberNumber = scenarioState?.memberNumber;
  const savedCurrentSlot = scenarioState?.currentSlot;
  
  const handleBookCall = async () => {
    if (!memberNumber) {
      toast({ title: "Required", description: "Please enter your member number", variant: "destructive" });
      return;
    }
    const slot = availableSlots.find(s => s.id === selectedSlot);
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'pilates',
          state: { 
            booked: true, 
            bookedSlot: slot, 
            bookedAt: new Date().toISOString(),
            memberNumber,
            currentSlot 
          }
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Call Scheduled!", description: `Your cancellation call is booked for ${slot?.date} at ${slot?.time}` });
      onAction('pause', { method: 'concierge', scheduledCall: slot, memberNumber });
    } catch (error) {
      toast({ title: "Error", description: "Failed to book call", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-pink-50 border border-pink-200">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-pink-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-pink-700">Schedule Cancellation Call</p>
            <p className="text-xs text-pink-600 mt-1">
              Member: €89/month • Pilates Loft Elite requires a phone call to cancel.
            </p>
          </div>
        </div>
      </div>
      
      {!booked ? (
        <>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              <strong>24-hour notice required.</strong> Cancellation requests must be made at least 24 hours before your scheduled class.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-700">Member Number *</Label>
              <Input 
                placeholder="e.g. PLM-12345"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className="mt-1"
                data-testid="input-member-number"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-700">Current Class Slot (to cancel)</Label>
              <select 
                className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white"
                value={currentSlot}
                onChange={(e) => setCurrentSlot(e.target.value)}
                data-testid="select-current-slot"
              >
                <option value="">Select your current slot...</option>
                {currentSlotOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Select Call Time (when we'll call Pilates Loft):</p>
            {availableSlots.map(slot => (
              <div
                key={slot.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  !slot.available 
                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    : selectedSlot === slot.id 
                      ? 'bg-pink-100 border-pink-400' 
                      : 'bg-white border-gray-200 hover:border-pink-300'
                }`}
                onClick={() => slot.available && setSelectedSlot(slot.id)}
                data-testid={`slot-${slot.id}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{slot.date}</p>
                    <p className="text-xs text-gray-600">{slot.time}</p>
                  </div>
                  {!slot.available && <Badge variant="secondary">Unavailable</Badge>}
                  {selectedSlot === slot.id && <CheckCircle2 className="h-5 w-5 text-pink-600" />}
                </div>
              </div>
            ))}
          </div>
          
          <Button
            className="w-full bg-pink-600 hover:bg-pink-700"
            onClick={handleBookCall}
            disabled={!selectedSlot || !memberNumber || isLoading}
            data-testid="button-book-call"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Book Cancellation Call
          </Button>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">Call Scheduled!</p>
          <p className="text-sm text-green-600 mt-1">
            Our concierge will call Pilates Loft on {bookedSlot?.date} at {bookedSlot?.time}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Member #{savedMemberNumber} {savedCurrentSlot ? `• Cancelling: ${savedCurrentSlot}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">You'll receive a confirmation email shortly.</p>
        </div>
      )}
    </div>
  );
}

function FusionStreamPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const { toast } = useToast();
  
  const defaultServices = [
    { id: 1, name: 'StreamFlix', cost: 15.99, selected: true },
    { id: 2, name: 'MusicFlow', cost: 9.99, selected: true },
    { id: 3, name: 'CloudGames', cost: 14.99, selected: true },
    { id: 4, name: 'NewsPlus', cost: 9.99, selected: true },
  ];
  
  // Fetch persisted state
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const services = scenarioState?.services || defaultServices;
  const isDone = scenarioState?.unbundled || false;
  
  const bundlePrice = 49.99;
  const totalIfSeparate = services.reduce((sum: number, s: any) => sum + s.cost, 0);
  const bundleSavings = (totalIfSeparate - bundlePrice).toFixed(2);
  const selectedServices = services.filter((s: any) => s.selected);
  const newTotal = selectedServices.reduce((sum: number, s: any) => sum + s.cost, 0).toFixed(2);
  
  const toggleService = async (id: number) => {
    const newServices = services.map((s: any) => s.id === id ? { ...s, selected: !s.selected } : s);
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'fusionstream',
          state: { services: newServices, unbundled: false }
        })
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update services');
    }
  };
  
  const handleUnbundle = async () => {
    try {
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'fusionstream',
          state: { services, unbundled: true, unbundledAt: new Date().toISOString() }
        })
      });
      setStep('done');
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({ title: "Bundle Updated!", description: `Your new subscription total is €${newTotal}/month` });
      onAction('downgrade', { method: 'concierge', unbundledServices: selectedServices });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update bundle", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-violet-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-violet-700">Bundle Manager</p>
            <p className="text-xs text-violet-600 mt-1">
              FusionStream Bundle • 4 services • Saving €{bundleSavings}/mo
            </p>
          </div>
        </div>
      </div>
      
      {step === 'select' && (
        <>
          <Alert className="bg-violet-50 border-violet-200">
            <Zap className="h-4 w-4 text-violet-600" />
            <AlertDescription className="text-violet-700 text-sm">
              <strong>Unbundle services:</strong> Keep only what you use. Deselect services to remove them.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            {services.map((service: any) => (
              <div
                key={service.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  service.selected 
                    ? 'bg-violet-50 border-violet-300' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
                onClick={() => toggleService(service.id)}
                data-testid={`service-${service.id}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      service.selected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                    }`}>
                      {service.selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{service.name}</span>
                  </div>
                  <span className="text-sm text-gray-700">€{service.cost}/mo</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Current bundle:</span>
              <span className="line-through text-gray-400">€{bundlePrice}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-violet-700">
              <span>New total ({selectedServices.length} services):</span>
              <span>€{newTotal}/mo</span>
            </div>
          </div>
          
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={() => setStep('confirm')}
            disabled={selectedServices.length === 0}
            data-testid="button-review-changes"
          >
            Review Changes
          </Button>
        </>
      )}
      
      {step === 'confirm' && (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="font-medium text-amber-700 mb-2">Confirm Changes:</p>
            <ul className="text-sm text-amber-600 space-y-1">
              <li>• Keeping: {selectedServices.map((s: any) => s.name).join(', ')}</li>
              {services.filter((s: any) => !s.selected).length > 0 && (
                <li>• Removing: {services.filter((s: any) => !s.selected).map((s: any) => s.name).join(', ')}</li>
              )}
              <li className="font-medium">• New monthly cost: €{newTotal}</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleUnbundle}
              disabled={isLoading}
            >
              Confirm Changes
            </Button>
          </div>
        </div>
      )}
      
      {step === 'done' && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">Bundle Updated!</p>
          <p className="text-sm text-green-600 mt-1">
            Your new subscription is €{newTotal}/month with {selectedServices.length} services.
          </p>
        </div>
      )}
    </div>
  );
}

function StreamFlixPanel({ 
  subscription, 
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'plan' | 'members' | 'profiles' | 'devices'>('plan');
  const [showPlanConfirm, setShowPlanConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingProfile, setEditingProfile] = useState<number | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const { toast } = useToast();
  
  const PLANS = {
    basic: { id: 'basic', name: 'Basic', price: 7.99, streams: 1, quality: 'HD', extraMemberAllowance: 0, profiles: 1 },
    standard: { id: 'standard', name: 'Standard', price: 13.99, streams: 2, quality: 'Full HD', extraMemberAllowance: 1, profiles: 2 },
    premium: { id: 'premium', name: 'Premium', price: 17.99, streams: 4, quality: '4K Ultra HD', extraMemberAllowance: 2, profiles: 4 }
  };
  const EXTRA_MEMBER_FEE = 5.99;
  
  const defaultState = {
    currentPlan: 'standard',
    extraMembers: [
      { id: 1, email: 'friend@email.com', name: 'Alex', addedAt: '2024-12-01' }
    ],
    profiles: [
      { id: 1, name: 'You', isOwner: true, maturityRating: 'adult', avatarColor: '#E50914' },
      { id: 2, name: 'Kids', isOwner: false, maturityRating: 'kids', avatarColor: '#46D369' }
    ],
    devices: [
      { id: 1, name: 'Living Room TV', type: 'smart_tv', lastActive: 'Now playing', isCurrentDevice: false },
      { id: 2, name: 'iPhone 15', type: 'mobile', lastActive: '2 hours ago', isCurrentDevice: true },
      { id: 3, name: 'MacBook Pro', type: 'laptop', lastActive: 'Yesterday', isCurrentDevice: false }
    ],
    paused: false
  };
  
  const { data: scenarioState, refetch } = useQuery<any>({
    queryKey: ['/api/scenarios', subscription.id],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${subscription.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  const state = { ...defaultState, ...scenarioState };
  const currentPlan = PLANS[state.currentPlan as keyof typeof PLANS] || PLANS.standard;
  const extraMembersCount = state.extraMembers?.length || 0;
  const totalCost = currentPlan.price + (extraMembersCount * EXTRA_MEMBER_FEE);
  const isPaused = state.paused || subscription.status === 'paused';
  
  const getCompleteState = () => ({
    currentPlan: scenarioState?.currentPlan ?? defaultState.currentPlan,
    extraMembers: scenarioState?.extraMembers ?? defaultState.extraMembers,
    profiles: scenarioState?.profiles ?? defaultState.profiles,
    devices: scenarioState?.devices ?? defaultState.devices,
    paused: scenarioState?.paused ?? defaultState.paused
  });
  
  const saveState = async (newState: any) => {
    try {
      const completeState = { ...getCompleteState(), ...newState };
      await fetch(`/api/scenarios/${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioType: 'streamflix',
          state: completeState
        })
      });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  };
  
  const handlePlanChange = (planId: string) => {
    if (planId === state.currentPlan) return;
    setPendingPlan(planId);
    setShowPlanConfirm(true);
  };
  
  const confirmPlanChange = async () => {
    if (!pendingPlan) return;
    const newPlan = PLANS[pendingPlan as keyof typeof PLANS];
    const oldPlan = currentPlan;
    
    let validExtraMembers = state.extraMembers || [];
    if (validExtraMembers.length > newPlan.extraMemberAllowance) {
      validExtraMembers = validExtraMembers.slice(0, newPlan.extraMemberAllowance);
    }
    
    await saveState({ currentPlan: pendingPlan, extraMembers: validExtraMembers });
    
    const isUpgrade = newPlan.price > oldPlan.price;
    toast({ 
      title: isUpgrade ? "Plan Upgraded!" : "Plan Changed", 
      description: `You're now on ${newPlan.name} (€${newPlan.price}/mo). ${isUpgrade ? 'Prorated charges applied.' : 'Changes take effect next billing cycle.'}`
    });
    setShowPlanConfirm(false);
    setPendingPlan(null);
  };
  
  const handleAddExtraMember = async () => {
    if (!newMemberEmail) {
      toast({ title: "Email required", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    if (extraMembersCount >= currentPlan.extraMemberAllowance) {
      toast({ title: "Limit reached", description: `Your ${currentPlan.name} plan allows ${currentPlan.extraMemberAllowance} extra member(s)`, variant: "destructive" });
      return;
    }
    
    const newMember = {
      id: Date.now(),
      email: newMemberEmail,
      name: newMemberEmail.split('@')[0],
      addedAt: new Date().toISOString().split('T')[0]
    };
    
    await saveState({ extraMembers: [...(state.extraMembers || []), newMember] });
    toast({ title: "Member Added!", description: `${newMemberEmail} can now access your account. +€${EXTRA_MEMBER_FEE}/mo added.` });
    setNewMemberEmail('');
    setShowAddMember(false);
  };
  
  const handleRemoveExtraMember = async (memberId: number) => {
    const updatedMembers = (state.extraMembers || []).filter((m: any) => m.id !== memberId);
    await saveState({ extraMembers: updatedMembers });
    toast({ title: "Member Removed", description: `Extra member removed. You'll save €${EXTRA_MEMBER_FEE}/mo starting next cycle.` });
  };
  
  const handleUpdateProfile = async (profileId: number) => {
    if (!editProfileName.trim()) return;
    const updatedProfiles = (state.profiles || []).map((p: any) => 
      p.id === profileId ? { ...p, name: editProfileName } : p
    );
    await saveState({ profiles: updatedProfiles });
    toast({ title: "Profile Updated", description: "Profile name changed successfully." });
    setEditingProfile(null);
    setEditProfileName('');
  };
  
  const handleLogoutDevice = async (deviceId: number) => {
    const updatedDevices = (state.devices || []).filter((d: any) => d.id !== deviceId);
    await saveState({ devices: updatedDevices });
    toast({ title: "Device Logged Out", description: "Device has been signed out of your account." });
  };
  
  const handlePauseResume = async () => {
    const newPausedState = !isPaused;
    await saveState({ paused: newPausedState });
    toast({ 
      title: newPausedState ? "Subscription Paused" : "Subscription Resumed",
      description: newPausedState 
        ? "Your account is paused. You won't be charged until you resume."
        : "Welcome back! Your subscription is now active."
    });
    onAction(newPausedState ? 'pause' : 'resume', { method: 'api' });
  };
  
  const pendingPlanData = pendingPlan ? PLANS[pendingPlan as keyof typeof PLANS] : null;
  const priceDiff = pendingPlanData ? pendingPlanData.price - currentPlan.price : 0;
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-red-700">StreamFlix • API Connected</p>
              <p className="text-xs text-red-600 mt-1">
                {currentPlan.name} Plan • {extraMembersCount} extra member{extraMembersCount !== 1 ? 's' : ''} • €{totalCost.toFixed(2)}/mo
              </p>
            </div>
          </div>
          <Badge className="bg-red-100 text-red-700">{currentPlan.quality}</Badge>
        </div>
      </div>
      
      {isPaused && (
        <Alert className="bg-orange-50 border-orange-200">
          <Pause className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 text-sm">
            <strong>Subscription paused.</strong> Resume anytime to continue watching.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {(['plan', 'members', 'profiles', 'devices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === tab 
                ? 'bg-white text-red-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid={`tab-${tab}`}
          >
            {tab === 'plan' ? 'Plan' : tab === 'members' ? 'Members' : tab === 'profiles' ? 'Profiles' : 'Devices'}
          </button>
        ))}
      </div>
      
      {activeTab === 'plan' && (
        <div className="space-y-3">
          {Object.values(PLANS).map(plan => (
            <div
              key={plan.id}
              onClick={() => handlePlanChange(plan.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                state.currentPlan === plan.id 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-white border-gray-200 hover:border-red-300'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    {state.currentPlan === plan.id && (
                      <Badge className="bg-red-600 text-white text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {plan.streams} stream{plan.streams > 1 ? 's' : ''} • {plan.quality} • {plan.profiles} profile{plan.profiles > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{plan.extraMemberAllowance} extra member{plan.extraMemberAllowance !== 1 ? 's' : ''} included
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">€{plan.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">/month</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'members' && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Extra member slots</span>
              <span className="text-sm font-medium text-gray-900">{extraMembersCount} / {currentPlan.extraMemberAllowance}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">€{EXTRA_MEMBER_FEE}/month per extra member</p>
          </div>
          
          {(state.extraMembers || []).map((member: any) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium text-sm">
                  {member.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">+€{EXTRA_MEMBER_FEE}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                  onClick={() => handleRemoveExtraMember(member.id)}
                  data-testid={`button-remove-member-${member.id}`}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {showAddMember ? (
            <div className="p-3 bg-red-50 rounded-lg space-y-3">
              <Input
                placeholder="Email address"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="bg-white"
                data-testid="input-new-member-email"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddMember(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddExtraMember} className="flex-1 bg-red-600 hover:bg-red-700" data-testid="button-confirm-add-member">
                  Add (+€{EXTRA_MEMBER_FEE}/mo)
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600"
              onClick={() => setShowAddMember(true)}
              disabled={extraMembersCount >= currentPlan.extraMemberAllowance}
              data-testid="button-add-extra-member"
            >
              <Users className="h-4 w-4 mr-2" />
              {extraMembersCount >= currentPlan.extraMemberAllowance 
                ? `Upgrade plan for more members`
                : `Add Extra Member (+€${EXTRA_MEMBER_FEE}/mo)`}
            </Button>
          )}
        </div>
      )}
      
      {activeTab === 'profiles' && (
        <div className="space-y-3">
          {(state.profiles || []).map((profile: any) => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: profile.avatarColor }}
                >
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  {editingProfile === profile.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        className="h-7 w-32 text-sm"
                        data-testid={`input-edit-profile-${profile.id}`}
                      />
                      <Button size="sm" className="h-7 bg-red-600" onClick={() => handleUpdateProfile(profile.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingProfile(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                        {profile.isOwner && <Badge className="bg-red-600 text-white text-xs">Owner</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {profile.maturityRating === 'kids' ? '👶 Kids' : '🔞 All maturity levels'}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {editingProfile !== profile.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditingProfile(profile.id); setEditProfileName(profile.name); }}
                  data-testid={`button-edit-profile-${profile.id}`}
                >
                  Edit
                </Button>
              )}
            </div>
          ))}
          
          {(state.profiles || []).length < currentPlan.profiles && (
            <p className="text-xs text-center text-gray-500">
              You can add {currentPlan.profiles - (state.profiles?.length || 0)} more profile(s)
            </p>
          )}
        </div>
      )}
      
      {activeTab === 'devices' && (
        <div className="space-y-3">
          {(state.devices || []).map((device: any) => (
            <div key={device.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {device.type === 'smart_tv' && '📺'}
                  {device.type === 'mobile' && '📱'}
                  {device.type === 'laptop' && '💻'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                    {device.isCurrentDevice && <Badge className="bg-green-100 text-green-700 text-xs">This device</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{device.lastActive}</p>
                </div>
              </div>
              {!device.isCurrentDevice && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleLogoutDevice(device.id)}
                  data-testid={`button-logout-device-${device.id}`}
                >
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-3 border-t grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className={isPaused ? "border-green-300 text-green-600" : "border-orange-300 text-orange-600"}
          onClick={handlePauseResume}
          disabled={isLoading}
          data-testid="button-pause-resume"
        >
          {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="outline"
          className="border-red-300 text-red-600"
          onClick={() => onAction('cancel', { method: 'api' })}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
      
      {showPlanConfirm && pendingPlanData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg text-gray-900">
              {priceDiff > 0 ? 'Upgrade to' : 'Switch to'} {pendingPlanData.name}?
            </h3>
            
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current plan:</span>
                <span className="text-gray-900">{currentPlan.name} - €{currentPlan.price}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">New plan:</span>
                <span className="text-gray-900">{pendingPlanData.name} - €{pendingPlanData.price}/mo</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className={priceDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                    {priceDiff > 0 ? 'Price increase:' : 'You save:'}
                  </span>
                  <span className={priceDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                    {priceDiff > 0 ? '+' : '-'}€{Math.abs(priceDiff).toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>
            
            <Alert className={priceDiff > 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}>
              <Clock className={`h-4 w-4 ${priceDiff > 0 ? 'text-blue-600' : 'text-amber-600'}`} />
              <AlertDescription className={`text-sm ${priceDiff > 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {priceDiff > 0 
                  ? 'Upgrade takes effect immediately. A prorated charge will be applied.'
                  : 'Downgrade takes effect at the start of your next billing cycle.'}
              </AlertDescription>
            </Alert>
            
            {pendingPlanData.extraMemberAllowance < extraMembersCount && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">
                  You have {extraMembersCount} extra members but {pendingPlanData.name} only allows {pendingPlanData.extraMemberAllowance}. 
                  {extraMembersCount - pendingPlanData.extraMemberAllowance} member(s) will be removed.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { setShowPlanConfirm(false); setPendingPlan(null); }}>
                Cancel
              </Button>
              <Button 
                className={priceDiff > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                onClick={confirmPlanChange}
              >
                {priceDiff > 0 ? 'Upgrade Now' : 'Confirm Change'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== END SPECIALIZED PANELS ==========

function ConciergePanel({ 
  subscription, 
  serviceInfo,
  onAction, 
  isLoading 
}: { 
  subscription: Subscription; 
  serviceInfo: ServiceInfo | null;
  onAction: (action: string, data?: any) => void; 
  isLoading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  const canPause = serviceInfo?.pauseSupported === true;
  
  const handleConciergeAction = (action: string) => {
    if (!email) {
      return;
    }
    onAction(action, { method: 'concierge', userEmail: email, accountInfo });
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-orange-700">Concierge Service - We Handle It</p>
            <p className="text-xs text-orange-600 mt-1">
              Our team will contact {serviceInfo?.name || 'the service'} on your behalf. Typically completed within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
      
      <Alert className="bg-orange-50 border-orange-200">
        <MessageCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          <strong>Human-assisted:</strong> We'll send emails and make calls to get this done for you. Just provide your account details below.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="email" className="text-xs font-medium">Your account email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            data-testid="input-concierge-email"
          />
        </div>
        <div>
          <Label htmlFor="accountInfo" className="text-xs">Additional account info (optional)</Label>
          <Textarea
            id="accountInfo"
            placeholder="Username, account number, or any helpful details..."
            value={accountInfo}
            onChange={(e) => setAccountInfo(e.target.value)}
            className="mt-1 h-20"
            data-testid="input-account-info"
          />
        </div>
      </div>
      
      {serviceInfo?.requiredInfo && serviceInfo.requiredInfo.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Required info:</strong> {serviceInfo.requiredInfo.join(', ')}
        </div>
      )}
      
      <div className="space-y-2">
        {isActive && (
          <>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => handleConciergeAction('cancel')}
              disabled={isLoading || !email}
              data-testid="button-cancel-subscription"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Request Cancellation
            </Button>
            {canPause && (
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => handleConciergeAction('pause')}
                disabled={isLoading || !email}
                data-testid="button-pause-subscription"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                Request Pause
              </Button>
            )}
          </>
        )}
        {isPaused && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleConciergeAction('resume')}
            disabled={isLoading || !email}
            data-testid="button-resume-subscription"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Request Resume
          </Button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        <Clock className="h-3 w-3 inline mr-1" />
        Typically completed within {serviceInfo?.estimatedCancellationTime || '24-48 hours'}
      </p>
    </div>
  );
}

function ControlPanel({ 
  subscription,
  serviceInfo,
  onAction,
  isLoading,
  result,
  onClearResult
}: {
  subscription: Subscription;
  serviceInfo: ServiceInfo | null;
  onAction: (action: string, data?: any) => void;
  isLoading: boolean;
  result: ControlResult | null;
  onClearResult: () => void;
}) {
  const controlMethod = serviceInfo?.controlMethod || 'concierge';
  const isCancelled = subscription.status === 'cancelled';
  
  if (result) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${
          result.status === 'completed' ? 'bg-green-50 border border-green-200' :
          result.status === 'instructions' ? 'bg-purple-50 border border-purple-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : result.status === 'instructions' ? (
              <ExternalLink className="h-5 w-5 text-purple-600 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <p className={`font-medium text-sm ${
                result.status === 'completed' ? 'text-green-800' :
                result.status === 'instructions' ? 'text-purple-800' :
                'text-blue-800'
              }`}>
                {result.status === 'completed' ? 'Action Completed!' :
                 result.status === 'instructions' ? 'Follow These Steps' :
                 'Request Submitted'}
              </p>
              <p className={`text-sm mt-1 ${
                result.status === 'completed' ? 'text-green-700' :
                result.status === 'instructions' ? 'text-purple-700' :
                'text-blue-700'
              }`}>{result.message}</p>
              {result.requestId && (
                <p className="text-xs text-gray-500 mt-2">
                  Reference: #{result.requestId}
                </p>
              )}
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onClearResult}
          data-testid="button-back-to-controls"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Controls
        </Button>
      </div>
    );
  }
  
  if (isCancelled) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-gray-700">Subscription Cancelled</p>
              <p className="text-xs text-gray-500 mt-1">
                This subscription has been cancelled and is no longer active.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check for specialized panels based on service slug
  const serviceSlug = serviceInfo?.slug;
  
  if (serviceSlug === 'trialbox-creator') {
    return <TrialBoxPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  if (serviceSlug === 'skyshield-premium') {
    return <SkyShieldPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  if (serviceSlug === 'unityhub-family') {
    return <UnityHubPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  if (serviceSlug === 'pilates-loft-elite') {
    return <PilatesLoftPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  if (serviceSlug === 'fusionstream-bundle') {
    return <FusionStreamPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  if (serviceSlug === 'streamflix') {
    return <StreamFlixPanel subscription={subscription} onAction={onAction} isLoading={isLoading} />;
  }
  
  // Fall back to default control method panels
  switch (controlMethod) {
    case 'mulah_merchant':
      return <MulahMerchantPanel subscription={subscription} serviceInfo={serviceInfo} onAction={onAction} isLoading={isLoading} />;
    case 'api':
      return <APIControlPanel subscription={subscription} serviceInfo={serviceInfo} onAction={onAction} isLoading={isLoading} />;
    case 'self_service':
      return <SelfServicePanel subscription={subscription} serviceInfo={serviceInfo} onAction={onAction} isLoading={isLoading} />;
    case 'concierge':
    default:
      return <ConciergePanel subscription={subscription} serviceInfo={serviceInfo} onAction={onAction} isLoading={isLoading} />;
  }
}

export default function SubscriptionControl() {
  const [, navigate] = useLocation();
  const params = useParams();
  const subscriptionId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  
  const [result, setResult] = useState<ControlResult | null>(null);
  const [lastLoadedId, setLastLoadedId] = useState<number | null>(null);
  
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions']
  });
  
  const subscription = subscriptions?.find(s => s.id === subscriptionId);
  
  // Track when the correct subscription data is loaded
  useEffect(() => {
    if (subscription && subscription.id === subscriptionId) {
      setLastLoadedId(subscriptionId);
      setResult(null); // Reset result when switching subscriptions
    }
  }, [subscription, subscriptionId]);
  
  // Show loading when we haven't loaded data for the current subscription ID yet
  const isWaitingForData = subscriptionId !== lastLoadedId;
  
  const { data: serviceInfo = null } = useQuery<ServiceInfo | null>({
    queryKey: ['/api/services/match', subscription?.name],
    queryFn: async () => {
      if (!subscription?.name) return null;
      const res = await fetch(`/api/services/match/${encodeURIComponent(subscription.name)}`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!subscription?.name
  });
  
  const { data: conciergeRequests } = useQuery<ConciergeRequest[]>({
    queryKey: ['/api/concierge/requests']
  });
  
  // Fetch scenario state for dynamic pricing (UnityHub, FusionStream, etc.)
  const { data: scenarioData } = useQuery<any>({
    queryKey: ['/api/scenarios', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return null;
      const res = await fetch(`/api/scenarios/${subscriptionId}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!subscriptionId
  });
  
  // Calculate dynamic price for UnityHub based on member count
  const getDisplayPrice = () => {
    if (!subscription) return 0;
    const serviceSlug = subscription.name.toLowerCase().replace(/\s+/g, '-');
    
    if (serviceSlug === 'unityhub-family') {
      const basePrice = 12.50;
      const perMemberPrice = 6.25;
      const defaultMembers = [
        { id: 1, name: 'You', email: 'you@email.com', share: 12.50, canRemove: false, isOwner: true },
        { id: 2, name: 'Sarah', email: 'sarah@email.com', share: 6.25, canRemove: true, isOwner: false },
        { id: 3, name: 'Mike', email: 'mike@email.com', share: 6.25, canRemove: true, isOwner: false },
      ];
      const members = scenarioData?.members || defaultMembers;
      const additionalMembers = Math.max(0, members.length - 1);
      return basePrice + (perMemberPrice * additionalMembers);
    }
    
    if (serviceSlug === 'fusionstream-bundle') {
      const defaultServices = [
        { id: 1, name: 'StreamMax', cost: 14.99, selected: true },
        { id: 2, name: 'MusicFlow', cost: 12.99, selected: true },
        { id: 3, name: 'CloudGames', cost: 11.99, selected: true },
        { id: 4, name: 'NewsPlus', cost: 9.99, selected: true },
      ];
      const services = scenarioData?.services || defaultServices;
      const selectedServices = services.filter((s: any) => s.selected);
      return selectedServices.reduce((sum: number, s: any) => sum + s.cost, 0);
    }
    
    if (serviceSlug === 'streamflix') {
      const PLANS: Record<string, { price: number }> = {
        basic: { price: 7.99 },
        standard: { price: 13.99 },
        premium: { price: 17.99 }
      };
      const EXTRA_MEMBER_FEE = 5.99;
      const currentPlan = scenarioData?.currentPlan || 'standard';
      const extraMembersCount = scenarioData?.extraMembers?.length || 0;
      const planPrice = PLANS[currentPlan]?.price || 13.99;
      return planPrice + (extraMembersCount * EXTRA_MEMBER_FEE);
    }
    
    const cost = parseFloat(subscription.cost);
    return subscription.billingCycle === 'yearly' ? cost / 12 : cost;
  };
  
  const controlMutation = useMutation({
    mutationFn: async ({ action, data }: { action: string; data?: any }) => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/control`, {
        action,
        ...data
      });
      return response.json();
    },
    onSuccess: (data: ControlResult) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/concierge/requests'] });
      
      if (data.status === 'completed') {
        toast({
          title: "Success!",
          description: data.message
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAction = (action: string, data?: any) => {
    controlMutation.mutate({ action, data });
  };
  
  const subscriptionRequests = conciergeRequests?.filter(
    r => r.subscriptionId === subscriptionId
  ) || [];
  
  // Show loading skeleton when loading or waiting for data for the requested subscription
  if (subscriptionsLoading || isWaitingForData) {
    return (
      <div className="mobile-container">
        <div className="mobile-header">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
        <div className="mobile-content pb-24 space-y-4">
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  if (!subscriptionId || !subscription) {
    return (
      <div className="mobile-container">
        <div className="mobile-header">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="mobile-content flex items-center justify-center py-20">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Subscription not found</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go to Subscriptions
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  const displayPrice = getDisplayPrice();
  
  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{subscription.name}</h1>
            <p className="text-xs text-gray-500">Subscription Control</p>
          </div>
        </div>
      </div>
      
      <div className="mobile-content pb-24 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold">{subscription.name}</h2>
                  <Badge 
                    className={
                      subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                      subscription.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{subscription.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">€{displayPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500">/month</p>
              </div>
            </div>
            
            {serviceInfo && (
              <div className="mt-3 pt-3 border-t">
                <ControlMethodBadge method={serviceInfo.controlMethod} />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              Control Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ControlPanel
              subscription={subscription}
              serviceInfo={serviceInfo}
              onAction={handleAction}
              isLoading={controlMutation.isPending}
              result={result}
              onClearResult={() => {
                setResult(null);
                queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
              }}
            />
          </CardContent>
        </Card>
        
        {subscriptionRequests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-orange-600" />
                Your Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {subscriptionRequests.map(request => (
                <ConciergeRequestCard key={request.id} request={request} />
              ))}
            </CardContent>
          </Card>
        )}
        
        <Card 
          className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/concierge')}
          data-testid="card-concierge-link"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-700">Mulah Concierge</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {serviceInfo?.controlMethod === 'concierge' 
                      ? "This service requires concierge assistance. We'll handle it for you."
                      : "Need help managing any subscription? Our team handles the hassle for you."}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
