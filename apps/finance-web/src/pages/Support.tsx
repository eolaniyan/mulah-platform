import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { 
  HelpCircle, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Brain,
  FileText,
  Send,
  Plus,
  Shield,
  CreditCard,
  Settings,
  Smartphone,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportCase {
  id: number;
  caseNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  autoResolved: boolean;
  irisAnalysis?: any;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

interface SupportMessage {
  id: number;
  authorId: string;
  authorType: 'user' | 'admin' | 'iris';
  message: string;
  createdAt: string;
}

const categoryIcons = {
  subscription: CreditCard,
  payment: Shield,
  account: User,
  technical: Settings,
  other: HelpCircle
};

const categoryDescriptions = {
  subscription: "Issues with managing your subscriptions",
  payment: "Payment problems or billing questions", 
  account: "Account access or profile issues",
  technical: "App bugs or technical problems",
  other: "General questions or other concerns"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const statusColors = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800"
};

export default function Support() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [newMessage, setNewMessage] = useState('');

  // Fetch user's support cases
  const { data: supportCases, isLoading: casesLoading } = useQuery<SupportCase[]>({
    queryKey: ['/api/support/cases'],
    enabled: isAuthenticated,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch user context for better support
  const { data: userContext } = useQuery<{
    accountAge: string;
    subscriptionCount: number;
    recentActivity: string[];
  }>({
    queryKey: ['/api/support/context'],
    enabled: isAuthenticated
  });

  // Create new support case
  const createCaseMutation = useMutation({
    mutationFn: (caseData: any) => apiRequest('POST', '/api/support/cases', caseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/cases'] });
      setShowNewCase(false);
      setNewCaseForm({ title: '', description: '', category: '', priority: 'medium' });
    }
  });

  // Add message to case
  const addMessageMutation = useMutation({
    mutationFn: ({ caseId, message }: { caseId: number, message: string }) => 
      apiRequest('POST', `/api/support/cases/${caseId}/messages`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/cases'] });
      setNewMessage('');
      // Refresh selected case
      if (selectedCase) {
        queryClient.invalidateQueries({ queryKey: [`/api/support/cases/${selectedCase.id}`] });
      }
    }
  });

  // Fetch specific case details when selected
  const { data: caseDetails } = useQuery<SupportCase>({
    queryKey: [`/api/support/cases/${selectedCase?.id}`],
    enabled: !!selectedCase,
    refetchInterval: 15000
  });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.title || !newCaseForm.description || !newCaseForm.category) return;

    createCaseMutation.mutate({
      ...newCaseForm,
      source: 'support_center',
      pageContext: window.location.href
    });
  };

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCase) return;

    addMessageMutation.mutate({
      caseId: selectedCase.id,
      message: newMessage.trim()
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <MessageSquare className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <Shield className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mobile-container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Support Center</CardTitle>
            <CardDescription>Please log in to access support</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="mobile-container mx-auto p-4 pb-24">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            <p className="text-sm text-gray-500">Get help with your Mulah account</p>
          </div>
        </div>

        {/* Quick Stats */}
        {supportCases && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-blue-600">{supportCases.length}</div>
                <div className="text-xs text-gray-500">Total Cases</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-orange-600">
                  {supportCases.filter((c: SupportCase) => c.status === 'open' || c.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-500">Active</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-green-600">
                  {supportCases.filter((c: SupportCase) => c.autoResolved).length}
                </div>
                <div className="text-xs text-gray-500">Auto-Resolved</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="mobile-content">
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cases">My Cases</TabsTrigger>
            <TabsTrigger value="new">Get Help</TabsTrigger>
          </TabsList>

          {/* Existing Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            {casesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : supportCases && supportCases.length > 0 ? (
              <div className="space-y-4">
                {supportCases.map((supportCase: SupportCase) => {
                  const CategoryIcon = categoryIcons[supportCase.category as keyof typeof categoryIcons] || HelpCircle;
                  
                  return (
                    <Card 
                      key={supportCase.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCase?.id === supportCase.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCase(supportCase)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-sm">{supportCase.title}</div>
                              <div className="text-xs text-gray-500">#{supportCase.caseNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {supportCase.autoResolved && (
                              <span title="Auto-resolved by IRIS">
                                <Brain className="h-4 w-4 text-purple-500" />
                              </span>
                            )}
                            {getStatusIcon(supportCase.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge className={statusColors[supportCase.status as keyof typeof statusColors]}>
                              {supportCase.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={priorityColors[supportCase.priority as keyof typeof priorityColors]}>
                              {supportCase.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(supportCase.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No support cases yet</h3>
                  <p className="text-gray-500 mb-4">Create your first support case to get help</p>
                  <Button onClick={() => setShowNewCase(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Case Details Modal/Panel */}
            {selectedCase && caseDetails && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Case Details</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{caseDetails.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{caseDetails.description}</p>
                    
                    {caseDetails.irisAnalysis && (
                      <Alert className="mb-4">
                        <Brain className="h-4 w-4" />
                        <AlertDescription>
                          <strong>IRIS Analysis:</strong> {caseDetails.irisAnalysis.recommendation || 'Analysis completed'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Messages */}
                  <div>
                    <h5 className="font-medium mb-3">Messages</h5>
                    <ScrollArea className="h-48 border rounded p-3">
                      <div className="space-y-3">
                        {caseDetails.messages?.map((message: SupportMessage) => (
                          <div key={message.id} className={`flex gap-3 ${
                            message.authorType === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              message.authorType === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : message.authorType === 'iris'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100'
                            }`}>
                              <div className="text-sm">{message.message}</div>
                              <div className={`text-xs mt-1 ${
                                message.authorType === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {message.authorType === 'iris' ? 'IRIS' : 
                                 message.authorType === 'admin' ? 'Support Team' : 'You'} • {' '}
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Add Message Form */}
                    {(caseDetails.status === 'open' || caseDetails.status === 'in_progress') && (
                      <form onSubmit={handleAddMessage} className="mt-3 flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="sm" disabled={addMessageMutation.isPending}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* New Case Tab */}
          <TabsContent value="new" className="space-y-6">
            {/* Issue Categories */}
            <div>
              <h3 className="text-lg font-medium mb-4">What can we help you with?</h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(categoryIcons).map(([category, Icon]) => (
                  <Card 
                    key={category}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      newCaseForm.category === category ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setNewCaseForm(prev => ({ ...prev, category }))}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="font-medium capitalize">{category}</div>
                        <div className="text-sm text-gray-500">
                          {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* New Case Form */}
            {newCaseForm.category && (
              <Card>
                <CardHeader>
                  <CardTitle>Describe your issue</CardTitle>
                  <CardDescription>
                    Provide details so we can help you quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCase} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Issue Title</Label>
                      <Input
                        id="title"
                        value={newCaseForm.title}
                        onChange={(e) => setNewCaseForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Brief summary of your issue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCaseForm.description}
                        onChange={(e) => setNewCaseForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Please provide as much detail as possible..."
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newCaseForm.priority}
                        onValueChange={(value) => setNewCaseForm(prev => ({ ...prev, priority: value }))}
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

                    {userContext && (
                      <Alert>
                        <Globe className="h-4 w-4" />
                        <AlertDescription>
                          We'll automatically include your account details and recent activity to help resolve your issue faster.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={createCaseMutation.isPending}>
                        {createCaseMutation.isPending ? 'Creating...' : 'Create Support Case'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setNewCaseForm({ title: '', description: '', category: '', priority: 'medium' })}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    <BottomNavigation />
    </>
  );
}