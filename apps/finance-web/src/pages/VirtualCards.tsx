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
  CreditCard, 
  Plus, 
  Settings, 
  Shield, 
  DollarSign, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Pause,
  Play,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import type { VirtualCard, Subscription } from "@shared/schema";

export default function VirtualCards() {
  const [showCardDetails, setShowCardDetails] = useState<Record<number, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    spendingLimit: '',
    assignedSubscription: '',
    merchantRestrictions: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries with proper typing
  const { data: virtualCards, isLoading } = useQuery<VirtualCard[]>({
    queryKey: ['/api/virtual-cards'],
    retry: false
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
    retry: false
  });

  // Mutations
  const createCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/virtual-cards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-cards'] });
      setIsCreateDialogOpen(false);
      setNewCardData({ spendingLimit: '', assignedSubscription: '', merchantRestrictions: '' });
      toast({
        title: "Virtual Card Created",
        description: "Your new virtual card is ready to use",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create virtual card",
        variant: "destructive",
      });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/virtual-cards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-cards'] });
      toast({
        title: "Card Updated",
        description: "Virtual card settings have been updated",
      });
    }
  });

  const toggleCardVisibility = (cardId: number) => {
    setShowCardDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleCreateCard = () => {
    createCardMutation.mutate({
      spendingLimit: parseFloat(newCardData.spendingLimit),
      assignedToSubscription: newCardData.assignedSubscription ? parseInt(newCardData.assignedSubscription) : null,
      merchantRestrictions: newCardData.merchantRestrictions ? 
        newCardData.merchantRestrictions.split(',').map(s => s.trim()) : []
    });
  };

  const toggleCardStatus = (card: any) => {
    const newStatus = card.status === 'active' ? 'inactive' : 'active';
    updateCardMutation.mutate({
      id: card.id,
      data: { status: newStatus }
    });
  };

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: (cardId: number) => apiRequest('DELETE', `/api/virtual-cards/${cardId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-cards'] });
      toast({
        title: "Card Deleted",
        description: "Virtual card has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete virtual card",
        variant: "destructive",
      });
    }
  });

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<number | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    spendingLimit: '',
    assignedSubscription: '',
    merchantRestrictions: ''
  });

  const handleOpenSettings = (card: any) => {
    setSettingsForm({
      spendingLimit: card.spendingLimit || '',
      assignedSubscription: card.assignedToSubscription?.toString() || '',
      merchantRestrictions: card.merchantRestrictions?.join(', ') || ''
    });
    setSettingsDialogOpen(card.id);
  };

  const handleSaveSettings = () => {
    if (settingsDialogOpen) {
      updateCardMutation.mutate({
        id: settingsDialogOpen,
        data: {
          spendingLimit: settingsForm.spendingLimit ? settingsForm.spendingLimit : null,
          assignedToSubscription: settingsForm.assignedSubscription ? parseInt(settingsForm.assignedSubscription) : null,
          merchantRestrictions: settingsForm.merchantRestrictions ? 
            settingsForm.merchantRestrictions.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
        }
      });
      setSettingsDialogOpen(null);
    }
  };

  const handleDeleteCard = (cardId: number) => {
    if (confirm('Are you sure you want to delete this virtual card?')) {
      deleteCardMutation.mutate(cardId);
    }
  };

  return (
    <>
    <div className="mobile-container">
      <div className="mobile-header">
        <h1 className="text-2xl font-bold">Virtual Cards</h1>
        <p className="text-sm text-gray-600">
          Manage subscription payments with secure virtual cards
        </p>
      </div>

      <div className="mobile-content space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create Virtual Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="spendingLimit">Spending Limit (€)</Label>
                  <Input
                    id="spendingLimit"
                    type="number"
                    placeholder="100.00"
                    value={newCardData.spendingLimit}
                    onChange={(e) => setNewCardData(prev => ({ ...prev, spendingLimit: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="assignedSubscription">Assign to Subscription (Optional)</Label>
                  <Select
                    value={newCardData.assignedSubscription}
                    onValueChange={(value) => setNewCardData(prev => ({ ...prev, assignedSubscription: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptions?.map((sub: any) => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="merchantRestrictions">Merchant Restrictions (Optional)</Label>
                  <Input
                    id="merchantRestrictions"
                    placeholder="Netflix, Spotify, Amazon"
                    value={newCardData.merchantRestrictions}
                    onChange={(e) => setNewCardData(prev => ({ ...prev, merchantRestrictions: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of allowed merchants</p>
                </div>

                <Button 
                  onClick={handleCreateCard} 
                  className="w-full"
                  disabled={createCardMutation.isPending || !newCardData.spendingLimit}
                >
                  {createCardMutation.isPending ? "Creating..." : "Create Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen !== null} onOpenChange={(open) => !open && setSettingsDialogOpen(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Card Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editSpendingLimit">Spending Limit (€)</Label>
                <Input
                  id="editSpendingLimit"
                  type="number"
                  placeholder="100.00"
                  value={settingsForm.spendingLimit}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, spendingLimit: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="editAssignedSubscription">Assign to Subscription</Label>
                <Select
                  value={settingsForm.assignedSubscription}
                  onValueChange={(value) => setSettingsForm(prev => ({ ...prev, assignedSubscription: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subscriptions?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editMerchantRestrictions">Merchant Restrictions</Label>
                <Input
                  id="editMerchantRestrictions"
                  placeholder="Netflix, Spotify, Amazon"
                  value={settingsForm.merchantRestrictions}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, merchantRestrictions: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveSettings} 
                  className="flex-1"
                  disabled={updateCardMutation.isPending}
                >
                  {updateCardMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSettingsDialogOpen(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Virtual Cards List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
        ) : virtualCards && virtualCards.length > 0 ? (
          <div className="space-y-4">
            {virtualCards.map((card: any, index: number) => (
              <Card key={card.id} className="compact-card">
                <CardContent className="p-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        card.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <CreditCard className={`h-5 w-5 ${
                          card.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          Virtual Card {index + 1}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {card.brand?.toUpperCase()} •••• {card.last4}
                        </p>
                      </div>
                    </div>
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                      {card.status}
                    </Badge>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Spending Limit</span>
                      <span className="font-semibold">€{card.spendingLimit || 'Unlimited'}</span>
                    </div>

                    {card.assignedToSubscription && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">Assigned To</span>
                        <span className="font-medium text-blue-700">
                          {subscriptions?.find((s: any) => s.id === card.assignedToSubscription)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {card.merchantRestrictions && card.merchantRestrictions.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Merchant Restrictions</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {card.merchantRestrictions.slice(0, 3).map((merchant: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {merchant}
                            </Badge>
                          ))}
                          {card.merchantRestrictions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{card.merchantRestrictions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card Number Display */}
                    <div className="p-3 bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs opacity-75">Card Number</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white h-6 w-6 p-0"
                          onClick={() => toggleCardVisibility(card.id)}
                        >
                          {showCardDetails[card.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="font-mono text-sm">
                        {showCardDetails[card.id] ? (
                          <span>{card.stripeCardId || "1234 5678 9012 " + card.last4}</span>
                        ) : (
                          <span>•••• •••• •••• {card.last4}</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleCardStatus(card)}
                        disabled={updateCardMutation.isPending}
                      >
                        {card.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenSettings(card)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={deleteCardMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
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
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">No virtual cards yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Create virtual cards to securely manage your subscription payments with spending limits and merchant restrictions.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Card
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Statistics */}
        {virtualCards && virtualCards.length > 0 && (
          <Card className="compact-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-lg text-blue-600">
                    {virtualCards.filter((c: any) => c.status === 'active').length}
                  </h4>
                  <p className="text-xs text-gray-600">Active Cards</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-lg text-green-600">
                    €{virtualCards.reduce((sum: number, card: any) => 
                      sum + (parseFloat(card.spendingLimit) || 0), 0).toFixed(2)}
                  </h4>
                  <p className="text-xs text-gray-600">Total Limits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="compact-card bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-blue-900">Secure & Protected</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Your virtual cards are powered by Stripe Issuing with bank-level security. 
                  Card numbers are encrypted and never stored in plain text.
                </p>
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