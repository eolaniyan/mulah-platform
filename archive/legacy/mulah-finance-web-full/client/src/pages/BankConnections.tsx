import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  Settings, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  DollarSign,
  TrendingUp,
  Eye,
  ArrowUpRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

export default function BankConnections() {
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [newConnectionData, setNewConnectionData] = useState({
    bankName: '',
    accountType: '',
    openBankingProvider: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: bankConnections, isLoading } = useQuery({
    queryKey: ['/api/bank-connections'],
    retry: false
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['/api/bank-transactions', 'recent'],
    retry: false
  });

  const { data: syncStats } = useQuery({
    queryKey: ['/api/bank-connections/stats'],
    retry: false
  });

  // Mutations
  const connectBankMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/bank-connections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bank-connections'] });
      setIsConnectDialogOpen(false);
      setNewConnectionData({ bankName: '', accountType: '', openBankingProvider: '' });
      toast({
        title: "Bank Connected",
        description: "Your bank account has been successfully connected",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect your bank account",
        variant: "destructive",
      });
    }
  });

  const syncTransactionsMutation = useMutation({
    mutationFn: (connectionId: number) => 
      apiRequest('POST', `/api/bank-connections/${connectionId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-connections'] });
      toast({
        title: "Sync Complete",
        description: "Latest transactions have been imported",
      });
    }
  });

  const disconnectBankMutation = useMutation({
    mutationFn: (connectionId: number) => 
      apiRequest('DELETE', `/api/bank-connections/${connectionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bank-connections'] });
      toast({
        title: "Bank Disconnected",
        description: "Bank account has been safely disconnected",
      });
    }
  });

  const handleConnectBank = () => {
    connectBankMutation.mutate(newConnectionData);
  };

  const supportedBanks = [
    { name: "Chase Bank", provider: "chase" },
    { name: "Bank of America", provider: "bofa" },
    { name: "Wells Fargo", provider: "wells_fargo" },
    { name: "Citibank", provider: "citibank" },
    { name: "Capital One", provider: "capital_one" },
    { name: "Deutsche Bank", provider: "deutsche" },
    { name: "ING Bank", provider: "ing" },
    { name: "Other Bank", provider: "other" }
  ];

  return (
    <>
    <div className="mobile-container">
      <div className="mobile-header">
        <h1 className="text-2xl font-bold">Bank Connections</h1>
        <p className="text-sm text-gray-600">
          Connect your bank accounts for automatic transaction sync
        </p>
      </div>

      <div className="mobile-content space-y-6">
        {/* Quick Stats */}
        {syncStats && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="compact-card bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-lg text-blue-600">
                  {syncStats.connectedAccounts || 0}
                </h3>
                <p className="text-xs text-blue-700">Connected Accounts</p>
              </CardContent>
            </Card>
            <Card className="compact-card bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-lg text-green-600">
                  {syncStats.transactionsThisMonth || 0}
                </h3>
                <p className="text-xs text-green-700">Transactions Synced</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connect New Account */}
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Connect Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Connect Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Select Your Bank</Label>
                <Select
                  value={newConnectionData.bankName}
                  onValueChange={(value) => {
                    const bank = supportedBanks.find(b => b.name === value);
                    setNewConnectionData(prev => ({ 
                      ...prev, 
                      bankName: value,
                      openBankingProvider: bank?.provider || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedBanks.map((bank) => (
                      <SelectItem key={bank.provider} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={newConnectionData.accountType}
                  onValueChange={(value) => setNewConnectionData(prev => ({ ...prev, accountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking Account</SelectItem>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Secure Connection</span>
                </div>
                <p className="text-xs text-blue-700">
                  We use bank-level security with Open Banking standards. 
                  Your login credentials are never stored.
                </p>
              </div>

              <Button 
                onClick={handleConnectBank} 
                className="w-full"
                disabled={connectBankMutation.isPending || !newConnectionData.bankName || !newConnectionData.accountType}
              >
                {connectBankMutation.isPending ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Connected Accounts */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="compact-card">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bankConnections && bankConnections.length > 0 ? (
          <div className="space-y-4">
            {bankConnections.map((connection: any) => (
              <Card key={connection.id} className="compact-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        connection.isActive ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`h-5 w-5 ${
                          connection.isActive ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{connection.bankName}</h3>
                        <p className="text-xs text-gray-500">
                          {connection.accountType} •••• {connection.last4}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                        {connection.isActive ? (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Last Sync */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Last Sync</span>
                      <span className="text-sm font-medium">
                        {connection.lastSyncAt ? 
                          format(new Date(connection.lastSyncAt), 'MMM d, HH:mm') : 
                          'Never'
                        }
                      </span>
                    </div>

                    {/* Sync Status */}
                    {connection.tokenExpiresAt && (
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm text-yellow-700">Token Expires</span>
                        <span className="text-sm font-medium text-yellow-800">
                          {format(new Date(connection.tokenExpiresAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => syncTransactionsMutation.mutate(connection.id)}
                        disabled={syncTransactionsMutation.isPending}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${
                          syncTransactionsMutation.isPending ? 'animate-spin' : ''
                        }`} />
                        Sync Now
                      </Button>
                      
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => disconnectBankMutation.mutate(connection.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="compact-card">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-gray-100 rounded-full mx-auto w-fit mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">No bank accounts connected</h3>
              <p className="text-sm text-gray-500 mb-6">
                Connect your bank accounts to automatically track transactions 
                and get AI-powered insights about your spending patterns.
              </p>
              <Button onClick={() => setIsConnectDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Bank
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        {recentTransactions && recentTransactions.length > 0 && (
          <Card className="compact-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" className="ml-auto text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.isSubscriptionPayment ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {transaction.isSubscriptionPayment ? (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{transaction.merchantName || transaction.description}</h4>
                        <p className="text-xs text-gray-600">
                          {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">€{Math.abs(parseFloat(transaction.amount)).toFixed(2)}</p>
                      {transaction.category && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                          {transaction.confidence && (
                            <span className="ml-1 text-green-600">
                              {Math.round(parseFloat(transaction.confidence) * 100)}%
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open Banking Info */}
        <Card className="compact-card bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-green-900">Open Banking Powered</h4>
                <p className="text-xs text-green-700 mt-1">
                  We use Open Banking APIs with read-only access to your transaction data. 
                  Your login credentials are handled directly by your bank.
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700">Bank-level security</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <BottomNavigation />
    </>
  );
}