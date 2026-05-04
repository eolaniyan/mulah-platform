import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, Send, X, AlertTriangle, CreditCard, Settings, User, Shield, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface ContextualHelpProps {
  pageContext?: string;
  pageTitle?: string;
  suggestedCategory?: 'subscription' | 'payment' | 'account' | 'technical' | 'other';
  suggestedIssues?: string[];
  className?: string;
  variant?: 'floating' | 'button' | 'minimal';
}

const categoryIcons = {
  subscription: CreditCard,
  payment: Shield,
  account: User,
  technical: Settings,
  other: HelpCircle
};

const quickIssues = {
  dashboard: [
    "Dashboard not loading properly",
    "Missing subscriptions not showing",
    "Analytics seem incorrect",
    "Unable to add new subscription"
  ],
  analytics: [
    "Analytics data looks wrong",
    "Charts not displaying correctly",
    "Monthly totals don't match my records",
    "Category breakdown is incorrect"
  ],
  subscriptions: [
    "Can't add new subscription",
    "Unable to edit subscription details",
    "Subscription not showing in list",
    "Wrong billing cycle or amount"
  ],
  usw: [
    "USW calculation seems wrong",
    "Can't understand the fee structure",
    "Payment collection not working",
    "Want to cancel USW service"
  ],
  cards: [
    "Virtual card not working",
    "Can't create new card",
    "Card spending limits not working",
    "Transaction declined unexpectedly"
  ],
  banking: [
    "Can't connect my bank account",
    "Bank sync not working",
    "Missing transactions",
    "Account connection keeps failing"
  ],
  buffer: [
    "BNPL option not available",
    "Klarna payment failed",
    "Buffer transaction declined",
    "Can't understand payment terms"
  ],
  profile: [
    "Can't update profile information",
    "Email not being updated",
    "Account settings not saving",
    "Want to delete my account"
  ]
};

export default function ContextualHelp({ 
  pageContext, 
  pageTitle, 
  suggestedCategory = 'technical',
  suggestedIssues = [],
  className = '',
  variant = 'floating'
}: ContextualHelpProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [quickReport, setQuickReport] = useState('');
  const [fullReport, setFullReport] = useState({
    title: '',
    description: '',
    category: suggestedCategory,
    priority: 'medium'
  });
  const [reportMode, setReportMode] = useState<'quick' | 'full'>('quick');

  // Create support case mutation
  const createCaseMutation = useMutation({
    mutationFn: (caseData: any) => apiRequest('POST', '/api/support/cases', caseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/cases'] });
      setIsOpen(false);
      setQuickReport('');
      setFullReport({ title: '', description: '', category: suggestedCategory, priority: 'medium' });
      toast({
        title: "Support case created",
        description: "We'll analyze your issue and get back to you soon.",
      });
    },
    onError: () => {
      toast({
        title: "Error creating case",
        description: "Please try again or contact support directly.",
        variant: "destructive",
      });
    }
  });

  const handleQuickReport = (issue: string) => {
    const caseData = {
      title: `${pageTitle ? `${pageTitle}: ` : ''}${issue}`,
      description: `Quick report from ${pageContext || window.location.pathname}:\n\n${issue}\n\nPage: ${pageTitle || 'Unknown'}\nURL: ${window.location.href}`,
      category: suggestedCategory,
      priority: 'medium',
      pageContext: window.location.href
    };
    
    createCaseMutation.mutate(caseData);
  };

  const handleFullReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullReport.title || !fullReport.description) return;

    const caseData = {
      ...fullReport,
      description: `${fullReport.description}\n\n--- Context ---\nPage: ${pageTitle || 'Unknown'}\nURL: ${window.location.href}\nReported from: ${pageContext || 'Contextual help'}`,
      pageContext: window.location.href
    };

    createCaseMutation.mutate(caseData);
  };

  const handleCustomReport = () => {
    if (!quickReport.trim()) return;

    const caseData = {
      title: `${pageTitle ? `${pageTitle}: ` : ''}${quickReport}`,
      description: `${quickReport}\n\n--- Context ---\nPage: ${pageTitle || 'Unknown'}\nURL: ${window.location.href}`,
      category: suggestedCategory,
      priority: 'medium',
      pageContext: window.location.href
    };

    createCaseMutation.mutate(caseData);
  };

  if (!isAuthenticated) return null;

  const renderTrigger = () => {
    switch (variant) {
      case 'floating':
        return (
          <Button
            size="sm"
            className={`fixed bottom-20 right-4 z-40 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 md:bottom-4 ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        );
      case 'minimal':
        return (
          <Button
            variant="ghost" 
            size="sm"
            className={`text-gray-500 hover:text-gray-700 ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        );
      case 'button':
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={() => setIsOpen(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Need Help?
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Need Help?
            </DialogTitle>
            <DialogDescription>
              Report an issue or get help with {pageTitle || 'this page'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant={reportMode === 'quick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportMode('quick')}
              >
                Quick Report
              </Button>
              <Button
                variant={reportMode === 'full' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportMode('full')}
              >
                Detailed Report
              </Button>
              <Link href="/support">
                <Button variant="ghost" size="sm">
                  View All Cases
                </Button>
              </Link>
            </div>

            {reportMode === 'quick' ? (
              <div className="space-y-4">
                {/* Common Issues for this page */}
                {(suggestedIssues.length > 0 || quickIssues[pageContext as keyof typeof quickIssues]) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Common Issues:</h4>
                    <div className="space-y-2">
                      {(suggestedIssues.length > 0 ? suggestedIssues : quickIssues[pageContext as keyof typeof quickIssues] || []).map((issue, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                          onClick={() => handleQuickReport(issue)}
                          disabled={createCaseMutation.isPending}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                          {issue}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Quick Report */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Describe your issue:</h4>
                  <div className="flex gap-2">
                    <Textarea
                      value={quickReport}
                      onChange={(e) => setQuickReport(e.target.value)}
                      placeholder="What's the problem you're experiencing?"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCustomReport}
                      disabled={!quickReport.trim() || createCaseMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFullReport} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={fullReport.category}
                    onValueChange={(value) => setFullReport(prev => ({ ...prev, category: value as 'subscription' | 'payment' | 'account' | 'technical' | 'other' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryIcons).map(([category, Icon]) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Issue Title</label>
                  <input
                    type="text"
                    value={fullReport.title}
                    onChange={(e) => setFullReport(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    placeholder="Brief summary of the issue"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={fullReport.description}
                    onChange={(e) => setFullReport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please provide details about what happened, what you expected, and any error messages..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={fullReport.priority}
                    onValueChange={(value) => setFullReport(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Minor issue</SelectItem>
                      <SelectItem value="high">High - Significant problem</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createCaseMutation.isPending || !fullReport.title || !fullReport.description}
                >
                  {createCaseMutation.isPending ? 'Creating Case...' : 'Create Support Case'}
                </Button>
              </form>
            )}

            {/* Context Info */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                We'll automatically include your current page context and account details to help resolve your issue faster.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}