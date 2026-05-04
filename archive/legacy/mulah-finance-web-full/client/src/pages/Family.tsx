import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Users, 
  Plus, 
  Copy, 
  UserPlus, 
  Trash2, 
  Share2, 
  ArrowLeft,
  Crown,
  Mail,
  Check,
  Settings,
  Shield,
  Sliders
} from "lucide-react";
import type { Family, FamilyMember, Subscription } from "@shared/schema";

interface EnrichedFamily extends Family {
  memberCount: number;
  isOwner: boolean;
  isDelegate?: boolean;
  canEditSplits?: boolean;
  members?: FamilyMember[];
  sharedSubscriptions?: any[];
}

export default function FamilyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);

  const { data: families = [], isLoading } = useQuery<EnrichedFamily[]>({
    queryKey: ["/api/families"],
  });

  const { data: familyDetails } = useQuery<EnrichedFamily>({
    queryKey: ["/api/families", selectedFamily],
    queryFn: async () => {
      const res = await fetch(`/api/families/${selectedFamily}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch family');
      return res.json();
    },
    enabled: !!selectedFamily,
  });

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const createFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/families", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      setShowCreateDialog(false);
      setNewFamilyName("");
      toast({ title: "Family created!", description: "Share your invite code with family members." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create family", variant: "destructive" });
    },
  });

  const joinFamilyMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/families/join", { inviteCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      setShowJoinDialog(false);
      setInviteCode("");
      toast({ title: "Joined family!", description: "You're now a member." });
    },
    onError: () => {
      toast({ title: "Error", description: "Invalid invite code", variant: "destructive" });
    },
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="mobile-header">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Family Sharing</h1>
          <div className="w-9" />
        </div>
        <div className="mobile-content flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (selectedFamily && familyDetails) {
    return (
      <FamilyDetailView
        family={familyDetails}
        subscriptions={subscriptions}
        onBack={() => setSelectedFamily(null)}
      />
    );
  }

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="p-2" data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Family Sharing</h1>
        <div className="w-9" />
      </div>

      <div className="mobile-content space-y-4">
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1" data-testid="button-create-family">
                <Plus className="h-4 w-4 mr-2" />
                Create Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Family</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Family name (e.g., Smith Family)"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  data-testid="input-family-name"
                />
                <Button
                  className="w-full"
                  onClick={() => createFamilyMutation.mutate(newFamilyName)}
                  disabled={!newFamilyName || createFamilyMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createFamilyMutation.isPending ? "Creating..." : "Create Family"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" data-testid="button-join-family">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Family</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="font-mono text-center text-lg tracking-widest"
                  data-testid="input-invite-code"
                />
                <Button
                  className="w-full"
                  onClick={() => joinFamilyMutation.mutate(inviteCode)}
                  disabled={!inviteCode || joinFamilyMutation.isPending}
                  data-testid="button-confirm-join"
                >
                  {joinFamilyMutation.isPending ? "Joining..." : "Join Family"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {families.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No families yet</h3>
              <p className="text-sm text-muted-foreground">
                Create a family to share subscriptions with loved ones and split the cost.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {families.map((family) => (
              <Card
                key={family.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedFamily(family.id)}
                data-testid={`card-family-${family.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{family.name}</span>
                          {family.isOwner && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {family.memberCount} member{family.memberCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteCode(family.inviteCode || '');
                      }}
                      data-testid={`button-copy-code-${family.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              How Family Sharing Works
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create a family and invite up to 6 members</li>
              <li>• Share subscriptions like Netflix, Spotify, etc.</li>
              <li>• Costs are automatically split equally</li>
              <li>• Track who owes what each month</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FamilyDetailView({ 
  family, 
  subscriptions,
  onBack 
}: { 
  family: EnrichedFamily; 
  subscriptions: Subscription[];
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [isManualAdd, setIsManualAdd] = useState(true); // Default to manual add
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  const { data: summary } = useQuery<{
    totalMonthly: string;
    yourShare: string;
    savings: string;
    memberCount: number;
    sharedSubscriptionCount: number;
  }>({
    queryKey: ["/api/families", family.id, "summary"],
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/families/${family.id}/invite`, {
        email: inviteEmail || null,
        displayName: inviteDisplayName,
        isManual: isManualAdd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families", family.id] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteDisplayName("");
      toast({ 
        title: isManualAdd ? "Member added!" : "Invite sent!", 
        description: isManualAdd ? "They can now be included in cost splits." : "Share the invite code with them." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return apiRequest("POST", `/api/families/${family.id}/subscriptions`, {
        subscriptionId,
        splitType: "equal",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families", family.id] });
      setShowShareDialog(false);
      toast({ title: "Subscription shared!", description: "Family members can now split the cost." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to share subscription", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("DELETE", `/api/families/${family.id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families", family.id] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    },
  });

  const setDelegateMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("PATCH", `/api/families/${family.id}/delegate`, { memberId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families", family.id] });
      toast({ title: "Delegate set!", description: "This member can now manage splits." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to set delegate", variant: "destructive" });
    },
  });

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.inviteCode || '');
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const unsharedSubscriptions = subscriptions.filter(sub => 
    !family.sharedSubscriptions?.some(shared => shared.subscriptionId === sub.id)
  );

  // Use API-provided canEditSplits (true only if current user is owner or delegate)
  const canEditSplits = family.canEditSplits || false;

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2" data-testid="button-back-to-families">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{family.name}</h1>
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <div className="mobile-content space-y-4">
        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold">€{summary.totalMonthly}</div>
                <div className="text-xs text-muted-foreground">Total/mo</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">€{summary.yourShare}</div>
                <div className="text-xs text-muted-foreground">Your Share</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-600">€{summary.savings}</div>
                <div className="text-xs text-muted-foreground">Savings</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Invite Code</CardTitle>
              <Button variant="ghost" size="sm" onClick={copyInviteCode} data-testid="button-copy-invite">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xl tracking-widest text-center p-2 bg-muted rounded-lg">
              {family.inviteCode}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Members ({family.members?.length || 0}/{family.maxMembers})</CardTitle>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-invite-member">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <button
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          isManualAdd ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                        }`}
                        onClick={() => setIsManualAdd(true)}
                        data-testid="tab-add-manual"
                      >
                        Add by Name
                      </button>
                      <button
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          !isManualAdd ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                        }`}
                        onClick={() => setIsManualAdd(false)}
                        data-testid="tab-add-email"
                      >
                        Invite by Email
                      </button>
                    </div>
                    
                    <Input
                      placeholder="Name (e.g. Mom, Dad, Sarah)"
                      value={inviteDisplayName}
                      onChange={(e) => setInviteDisplayName(e.target.value)}
                      data-testid="input-member-name"
                    />
                    
                    <Input
                      placeholder={isManualAdd ? "Email (optional)" : "Email address"}
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-member-email"
                    />
                    
                    {isManualAdd && (
                      <p className="text-xs text-muted-foreground">
                        Add family members by name for cost tracking. They don't need a Mulah account.
                      </p>
                    )}
                    
                    <Button
                      className="w-full"
                      onClick={() => inviteMutation.mutate()}
                      disabled={!inviteDisplayName.trim() || (!isManualAdd && !inviteEmail) || inviteMutation.isPending}
                      data-testid="button-add-member"
                    >
                      {inviteMutation.isPending ? "Adding..." : (isManualAdd ? "Add Member" : "Send Invite")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {family.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{member.displayName}</span>
                      {member.role === 'owner' && <span title="Owner"><Crown className="h-3 w-3 text-yellow-500" /></span>}
                      {member.role === 'delegate' && <span title="Delegate"><Shield className="h-3 w-3 text-blue-500" /></span>}
                      {member.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                    </div>
                    {member.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    )}
                    {!member.email && (
                      <div className="text-xs text-muted-foreground">Manual member</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {family.isOwner && member.role !== 'owner' && member.role !== 'delegate' && member.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDelegateMutation.mutate(member.id)}
                      disabled={setDelegateMutation.isPending}
                      title="Make Delegate"
                      data-testid={`button-make-delegate-${member.id}`}
                    >
                      <Shield className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  {member.role !== 'owner' && family.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      data-testid={`button-remove-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {family.isOwner && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-500" />
                <span>Tap the shield icon to make a member a delegate. Delegates can manage split configurations.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Shared Subscriptions</CardTitle>
              {family.isOwner && unsharedSubscriptions.length > 0 && (
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-share-subscription">
                      <Plus className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share a Subscription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 pt-4 max-h-64 overflow-y-auto">
                      {unsharedSubscriptions.map((sub) => (
                        <Button
                          key={sub.id}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => {
                            setSelectedSubId(sub.id);
                            shareMutation.mutate(sub.id);
                          }}
                          disabled={shareMutation.isPending && selectedSubId === sub.id}
                          data-testid={`button-share-sub-${sub.id}`}
                        >
                          <span>{sub.name}</span>
                          <span className="text-muted-foreground">€{sub.cost}/mo</span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {family.sharedSubscriptions && family.sharedSubscriptions.length > 0 ? (
              <div className="space-y-2">
                {family.sharedSubscriptions.map((shared: any) => {
                  const shareType = shared.shares?.[0]?.shareType || 'equal';
                  const shareTypeLabel = shareType === 'equal' ? 'Equal Split' : 
                    shareType === 'percentage' ? 'By %' : 'Fixed';
                  
                  return (
                    <div key={shared.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{shared.subscription?.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{shared.shares?.length || 1} member{(shared.shares?.length || 1) !== 1 ? 's' : ''}</span>
                            <Badge variant="outline" className="text-xs">{shareTypeLabel}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">€{shared.totalCost}</div>
                            <div className="text-xs text-muted-foreground">
                              €{(parseFloat(shared.totalCost) / (shared.shares?.length || 1)).toFixed(2)}/each
                            </div>
                          </div>
                          {canEditSplits && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Configure splits"
                              data-testid={`button-configure-splits-${shared.id}`}
                            >
                              <Sliders className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Show member shares breakdown */}
                      {shared.shares && shared.shares.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-muted space-y-1">
                          {shared.shares.map((share: any) => (
                            <div key={share.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {share.member?.displayName || 'Member'}
                              </span>
                              <span className="font-medium">
                                €{parseFloat(share.shareAmount).toFixed(2)}
                                {share.sharePercentage && (
                                  <span className="text-muted-foreground ml-1">
                                    ({parseFloat(share.sharePercentage).toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No shared subscriptions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
