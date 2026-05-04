import { useState, useEffect, createElement } from 'react';
import { useProactiveHelp } from '@/hooks/useProactiveHelp';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { 
  AlertTriangle, 
  X, 
  HelpCircle, 
  MessageSquare, 
  Lightbulb,
  Zap,
  Clock,
  Target,
  Navigation,
  Send,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface IRISResponse {
  type: 'info' | 'navigation' | 'guidance' | 'error';
  message: string;
  action?: { type: string; target: string };
  steps?: string[];
  suggestions?: string[];
}

interface ProactiveAlert {
  id: string;
  type: 'confusion' | 'error_pattern' | 'abandoned_flow' | 'repeated_action' | 'stuck';
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number;
  page: string;
  context: Record<string, any>;
}

const alertIcons = {
  confusion: Navigation,
  error_pattern: AlertTriangle,
  abandoned_flow: Target,
  repeated_action: Clock,
  stuck: HelpCircle
};

const alertColors = {
  confusion: 'border-blue-200 bg-blue-50',
  error_pattern: 'border-red-200 bg-red-50',
  abandoned_flow: 'border-orange-200 bg-orange-50',
  repeated_action: 'border-yellow-200 bg-yellow-50',
  stuck: 'border-purple-200 bg-purple-50'
};

const alertIconColors = {
  confusion: 'text-blue-600',
  error_pattern: 'text-red-600',
  abandoned_flow: 'text-orange-600',
  repeated_action: 'text-yellow-600',
  stuck: 'text-purple-600'
};

export default function ProactiveHelpProvider() {
  const { alerts, dismissAlert, isMonitoring } = useProactiveHelp();
  const [location, setLocation] = useLocation();
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<ProactiveAlert | null>(null);
  
  // IRIS Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<IRISResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleAskIRIS = async () => {
    if (!chatInput.trim() || isAsking) return;
    
    setIsAsking(true);
    try {
      const response = await fetch('/api/iris/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: chatInput,
          currentPath: location,
          scrollPosition: window.scrollY
        }),
        credentials: 'include'
      });
      const data = await response.json() as IRISResponse;
      setChatResponse(data);
      setChatInput('');
    } catch (error) {
      setChatResponse({
        type: 'error',
        message: 'Sorry, I could not process your question. Please try again.',
        suggestions: ['Refresh the page', 'Contact support']
      });
    } finally {
      setIsAsking(false);
    }
  };

  const handleNavigationAction = (target: string) => {
    setLocation(target);
    setIsChatOpen(false);
    setChatResponse(null);
  };

  // Auto-show new alerts
  useEffect(() => {
    Array.from(alerts).forEach(alert => {
      if (!shownAlerts.has(alert.id)) {
        setShownAlerts(prev => new Set([...prev, alert.id]));
        
        // Auto-show high confidence alerts
        if (alert.confidence >= 0.8) {
          setTimeout(() => {
            setSelectedAlert(alert);
          }, 1000); // Show after 1 second delay
        }
      }
    });
  }, [alerts, shownAlerts]);

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setShownAlerts(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertId);
      return newSet;
    });
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  const handleAlertAction = (alert: ProactiveAlert) => {
    switch (alert.type) {
      case 'confusion':
        // Show navigation help or contextual guide
        window.location.hash = '#contextual-help';
        break;
      case 'error_pattern':
        // Open support case creation
        window.location.href = '/support';
        break;
      case 'abandoned_flow':
        // Provide form assistance
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'repeated_action':
        // Show help for current page
        window.location.hash = '#contextual-help';
        break;
      case 'stuck':
        // Offer guided tour
        window.location.href = '/support';
        break;
    }
    
    handleDismissAlert(alert.id);
  };

  return (
    <>
      {/* Floating IRIS Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all md:bottom-6"
        data-testid="button-iris-chat"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {/* IRIS Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              Ask IRIS
            </DialogTitle>
            <DialogDescription>
              I can help you navigate, answer questions, and guide you through Mulah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="How can I help you?"
                onKeyDown={(e) => e.key === 'Enter' && handleAskIRIS()}
                disabled={isAsking}
                data-testid="input-iris-question"
              />
              <Button 
                onClick={handleAskIRIS} 
                disabled={isAsking || !chatInput.trim()}
                size="icon"
                data-testid="button-iris-send"
              >
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Chat Response */}
            {chatResponse && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-teal-50 to-gray-50 rounded-lg p-4 border border-teal-100">
                  <p className="text-sm text-gray-700">{chatResponse.message}</p>
                  
                  {/* Steps for guidance responses */}
                  {chatResponse.steps && chatResponse.steps.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {chatResponse.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-gray-600">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Navigation action */}
                  {chatResponse.action?.type === 'navigate' && (
                    <Button
                      onClick={() => handleNavigationAction(chatResponse.action!.target)}
                      className="mt-3 w-full"
                      size="sm"
                      data-testid="button-iris-navigate"
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Go there
                    </Button>
                  )}
                </div>

                {/* Suggestions */}
                {chatResponse.suggestions && chatResponse.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Tips:</p>
                    {chatResponse.suggestions.map((suggestion, i) => (
                      <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick suggestions when no response */}
            {!chatResponse && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Try asking:</p>
                {['How do I add a subscription?', 'Take me to Family', 'What is USW?'].map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left text-sm"
                    onClick={() => {
                      setChatInput(q);
                      setTimeout(handleAskIRIS, 100);
                    }}
                    data-testid={`button-iris-suggestion-${q.slice(0, 10)}`}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                    {q}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Alert Indicators */}
      {isMonitoring && alerts.length > 0 && (
        <div className="fixed bottom-24 left-4 z-50 space-y-2 md:bottom-4">
          {alerts.slice(0, 2).map((alert) => {
            const Icon = alertIcons[alert.type];
            return (
              <Card 
                key={alert.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 max-w-xs ${alertColors[alert.type]} border-2 shadow-lg`}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alertIconColors[alert.type]}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(alert.confidence * 100)}% confident
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-white/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissAlert(alert.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed Alert Dialog */}
      <Dialog 
        open={!!selectedAlert} 
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      >
        <DialogContent className="max-w-md mx-auto">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {createElement(alertIcons[selectedAlert.type], {
                    className: `h-5 w-5 ${alertIconColors[selectedAlert.type]}`
                  })}
                  {selectedAlert.title}
                </DialogTitle>
                <DialogDescription>
                  IRIS detected a potential issue and wants to help
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert className={alertColors[selectedAlert.type]}>
                  <Lightbulb className={`h-4 w-4 ${alertIconColors[selectedAlert.type]}`} />
                  <AlertDescription>
                    {selectedAlert.description}
                  </AlertDescription>
                </Alert>

                {/* Context Information */}
                {selectedAlert.context && Object.keys(selectedAlert.context).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      What I noticed:
                    </h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      {Object.entries(selectedAlert.context).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence and Page Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Page: {selectedAlert.page}</span>
                  <span>Confidence: {Math.round(selectedAlert.confidence * 100)}%</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAlertAction(selectedAlert)}
                    className="flex-1"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {selectedAlert.suggestedAction}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDismissAlert(selectedAlert.id)}
                    size="sm"
                  >
                    Not now
                  </Button>
                </div>

                {/* IRIS Branding */}
                <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3" />
                  Powered by IRIS Intelligence
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}