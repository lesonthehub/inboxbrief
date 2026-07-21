import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Activity,
  Gift,
  ShieldCheck,
  ShieldOff,
  Crown,
  User,
  Search,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { PageFooter } from "@/components/PageFooter";
import { CopyId } from "@/components/CopyId";

type ActivityEntry = {
  id: number;
  actorId: number;
  actorEmail: string | null;
  actorRole: string;
  targetUserId: number | null;
  targetEmail: string | null;
  action: string;
  details: string | null;
  totpVerified: boolean;
  createdAt: Date;
};

type ServiceGrant = {
  id: number;
  userId: number;
  grantedByEmail: string | null;
  reason: string | null;
  plan: string;
  expiresAt: Date | null;
  isActive: boolean;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
};

type AdminUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  totpEnabled: boolean;
  totpEnabledAt: Date | null;
  createdAt: Date;
};

export default function OwnerDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });

  // Grant service state
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlan, setGrantPlan] = useState<"solo" | "pro" | "business" | "enterprise">("pro");
  const [grantReason, setGrantReason] = useState("");
  const [grantExpiry, setGrantExpiry] = useState("");
  const [resetTrialUserId, setResetTrialUserId] = useState("");

  // Revoke state
  const [revokeTarget, setRevokeTarget] = useState<ServiceGrant | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Set role state
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<"user" | "admin" | "owner">("admin");
  const [roleChangeTotpCode, setRoleChangeTotpCode] = useState("");
  // Grant owner role to new user (not yet in admins list)
  const [grantOwnerUserId, setGrantOwnerUserId] = useState("");
  const [grantOwnerTotpCode, setGrantOwnerTotpCode] = useState("");
  const [showGrantOwnerForm, setShowGrantOwnerForm] = useState(false);

  // Activity log search
  const [logSearch, setLogSearch] = useState("");

  // Enterprise Plan Builder state
  const [epCompanyName, setEpCompanyName] = useState("");
  const [epContactEmail, setEpContactEmail] = useState("");
  const [epEmailsPerBriefing, setEpEmailsPerBriefing] = useState(200);
  const [epManualsPerDay, setEpManualsPerDay] = useState(2);
  const [epScheduledPerDay, setEpScheduledPerDay] = useState(3);
  const [epTeamMembers, setEpTeamMembers] = useState(10);
  const [epPriceMonthly, setEpPriceMonthly] = useState("");
  const [epPriceAnnual, setEpPriceAnnual] = useState("");
  const [epDiscountPct, setEpDiscountPct] = useState(""); // percentage off, e.g. "20" for 20%
  const [epDiscountDuration, setEpDiscountDuration] = useState<"once" | "repeating" | "forever">("once");
  const [epDiscountMonths, setEpDiscountMonths] = useState("3"); // used when duration=repeating
  const [epNotes, setEpNotes] = useState("");
  const [epAssignUserId, setEpAssignUserId] = useState("");
  const [epShowForm, setEpShowForm] = useState(false);
  const [epAssignPlanId, setEpAssignPlanId] = useState<number | null>(null);
  const [epAssignTarget, setEpAssignTarget] = useState("");

  const { data: activityLog, refetch: refetchLog, isLoading: logLoading } =
    trpc.owner.getActivityLog.useQuery({ limit: 200, offset: 0 });

  const { data: serviceGrants, refetch: refetchGrants, isLoading: grantsLoading } =
    trpc.owner.listServiceGrants.useQuery({ activeOnly: false });

  const { data: admins, refetch: refetchAdmins, isLoading: adminsLoading } =
    trpc.owner.listAdmins.useQuery();

  const { data: enterprisePlansData, refetch: refetchEnterprisePlans } =
    trpc.enterprise.listCustomPlans.useQuery({ activeOnly: false });

  const { data: bansData, refetch: refetchBans, isLoading: bansLoading } =
    trpc.adminUsers.listBans.useQuery();
  const { data: breakdown } = trpc.adminTools.getOnboardingBreakdown.useQuery();

  const liftBanMut = trpc.adminUsers.liftBan.useMutation({
    onSuccess: () => { toast.success("Ban lifted — account can now re-register"); refetchBans(); refetchLog(); },
    onError: (e) => toast.error(e.message),
  });

  // Estimate query — driven by current form values
  const { data: priceEstimate } = trpc.enterprise.estimatePrice.useQuery({
    emailsPerBriefing: epEmailsPerBriefing,
    manualBriefingsPerDay: epManualsPerDay,
    scheduledBriefingsPerDay: epScheduledPerDay,
    maxTeamMembers: epTeamMembers,
  }, { enabled: epShowForm });

  const [epEditPlanId, setEpEditPlanId] = useState<number | null>(null);
  const [epEditCompany, setEpEditCompany] = useState("");
  const [epEditEmail, setEpEditEmail] = useState("");
  const [epEditSeats, setEpEditSeats] = useState(10);
  const [epEditPrice, setEpEditPrice] = useState(500);
  const [epEditActive, setEpEditActive] = useState(true);
  const [epEditNotes, setEpEditNotes] = useState("");
  const [epInvoicePlanId, setEpInvoicePlanId] = useState<number | null>(null);
  const [epInvoiceDays, setEpInvoiceDays] = useState(30);

  const updateEnterprisePlanMut = trpc.enterprise.updateCustomPlan.useMutation({
    onSuccess: () => { toast.success("Plan updated"); setEpEditPlanId(null); refetchEnterprisePlans(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEnterprisePlanMut = trpc.enterprise.deleteCustomPlan.useMutation({
    onSuccess: () => { toast.success("Plan deleted"); refetchEnterprisePlans(); },
    onError: (e) => toast.error(e.message),
  });
  const sendInvoiceMut = trpc.enterprise.sendInvoice.useMutation({
    onSuccess: (data) => { toast.success(`Invoice sent! ID: ${data.invoiceId}`); setEpInvoicePlanId(null); },
    onError: (e) => toast.error(e.message),
  });

  const createEnterprisePlanMut = trpc.enterprise.createCustomPlan.useMutation({
    onSuccess: () => {
      toast.success("Enterprise plan created");
      setEpShowForm(false);
      setEpCompanyName(""); setEpContactEmail(""); setEpPriceMonthly(""); setEpPriceAnnual(""); setEpDiscountPct(""); setEpDiscountDuration("once"); setEpDiscountMonths("3"); setEpNotes(""); setEpAssignUserId("");
      refetchEnterprisePlans();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const assignEnterprisePlanMut = trpc.enterprise.assignPlanToUser.useMutation({
    onSuccess: () => {
      toast.success("Plan assigned to user");
      setEpAssignPlanId(null);
      setEpAssignTarget("");
      refetchEnterprisePlans();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const grantServiceMut = trpc.owner.grantService.useMutation({
    onSuccess: () => {
      toast.success("Service access granted");
      setGrantUserId("");
      setGrantReason("");
      setGrantExpiry("");
      refetchGrants();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetTrialMut = trpc.owner.resetTrialFingerprint.useMutation({
    onSuccess: () => {
      toast.success("Trial reset — user can now start a fresh 7-day trial");
      setResetTrialUserId("");
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeServiceMut = trpc.owner.revokeService.useMutation({
    onSuccess: () => {
      toast.success("Service access revoked");
      setRevokeTarget(null);
      setRevokeReason("");
      refetchGrants();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const setAdminRoleMut = trpc.owner.setAdminRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      setRoleTarget(null);
      setRoleChangeTotpCode("");
      refetchAdmins();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  const grantOwnerRoleMut = trpc.owner.setAdminRole.useMutation({
    onSuccess: () => {
      toast.success("Owner role granted successfully");
      setShowGrantOwnerForm(false);
      setGrantOwnerUserId("");
      setGrantOwnerTotpCode("");
      refetchAdmins();
      refetchLog();
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) return null;
  if (!user || (user.role !== "owner")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Owner access required.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const filteredLog = (activityLog ?? []).filter((e) => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      (e.actorEmail ?? "").toLowerCase().includes(q) ||
      (e.targetEmail ?? "").toLowerCase().includes(q) ||
      (e.details ?? "").toLowerCase().includes(q)
    );
  });

  const actionColor = (action: string) => {
    if (action.includes("delete") || action.includes("revoke") || action.includes("suspend")) return "destructive";
    if (action.includes("grant") || action.includes("enable") || action.includes("unsuspend")) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="text-base font-bold text-foreground hover:text-primary transition-colors shrink-0"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              InboxBrief
            </button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="text-xs text-muted-foreground font-medium truncate">Owner</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Crown className="w-3.5 h-3.5 text-yellow-500 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:block max-w-[140px] truncate">{user.email}</span>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Owner Control Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Full authority over admin roles, service grants, and activity monitoring.
          </p>
        </div>

        <Tabs defaultValue="activity">
          <div className="overflow-x-auto -mx-4 px-4 mb-6">
            <TabsList className="w-max min-w-full">
              <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Activity</span>
                <span className="xs:hidden">Log</span>
              </TabsTrigger>
              <TabsTrigger value="grants" className="gap-1.5 text-xs sm:text-sm">
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Grants
              </TabsTrigger>
              <TabsTrigger value="admins" className="gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Admin Management</span>
                <span className="sm:hidden">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="enterprise" className="gap-1.5 text-xs sm:text-sm">
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="hidden sm:inline">Enterprise Plans</span>
                <span className="sm:hidden">Enterprise</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">User Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="bans" className="gap-1.5 text-xs sm:text-sm">
                <ShieldOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                <span className="hidden sm:inline">Banned Accounts</span>
                <span className="sm:hidden">Bans</span>
                {bansData && bansData.length > 0 && (
                  <span className="ml-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{bansData.length}</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── User Analytics ── */}
          <TabsContent value="analytics">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Onboarding Breakdown
              </h2>
              <p className="text-xs text-muted-foreground mb-5">Aggregated from {breakdown?.total ?? 0} users who completed onboarding.</p>
              {!breakdown || breakdown.total === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No onboarding data yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {([
                    { title: "Business Type", data: breakdown.businessType, colors: ["bg-blue-500","bg-indigo-500","bg-violet-500","bg-purple-500","bg-fuchsia-500"] },
                    { title: "User Role", data: breakdown.userRole, colors: ["bg-emerald-500","bg-teal-500","bg-cyan-500","bg-sky-500","bg-blue-500"] },
                    { title: "Team Size", data: breakdown.teamSize, colors: ["bg-amber-500","bg-orange-500","bg-red-500","bg-rose-500","bg-pink-500"] },
                    { title: "Inbox Challenge", data: breakdown.inboxChallenge, colors: ["bg-lime-500","bg-green-500","bg-emerald-500","bg-teal-500","bg-cyan-500"] },
                  ] as const).map(({ title, data, colors }) => (
                    <div key={title} className="border border-border/40 rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
                      <div className="space-y-2.5">
                        {data.map((item, i) => {
                          const pct = breakdown.total > 0 ? Math.round((item.count / breakdown.total) * 100) : 0;
                          return (
                            <div key={item.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-foreground truncate max-w-[70%]">{item.label}</span>
                                <span className="text-muted-foreground shrink-0">{item.count} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Activity Log ── */}
          <TabsContent value="activity">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="font-semibold text-foreground">Admin Activity Log</h2>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search actions, emails..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pl-8 w-full sm:w-48 h-8 text-sm"
                    />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => refetchLog()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {logLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : filteredLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left">
                        <th className="pb-2 pr-4 font-medium">When</th>
                        <th className="pb-2 pr-4 font-medium">Actor</th>
                        <th className="pb-2 pr-4 font-medium">Action</th>
                        <th className="pb-2 pr-4 font-medium">Target</th>
                        <th className="pb-2 pr-4 font-medium">TOTP</th>
                        <th className="pb-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLog.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4">
                            <div className="text-foreground">{entry.actorEmail ?? `#${entry.actorId}`}</div>
                            <div className="text-xs text-muted-foreground capitalize">{entry.actorRole}</div>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant={actionColor(entry.action)} className="text-xs font-mono">
                              {entry.action}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {entry.targetEmail ?? (entry.targetUserId ? `#${entry.targetUserId}` : "—")}
                          </td>
                          <td className="py-2 pr-4">
                            {entry.totpVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground text-xs max-w-xs truncate">
                            {entry.details ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Service Grants ── */}
          <TabsContent value="grants">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grant form */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" /> Grant Service Access
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Grant a user full service access without requiring a payment plan. Enter their numeric user ID.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
                    <Input
                      placeholder="e.g. 42"
                      value={grantUserId}
                      onChange={(e) => setGrantUserId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Plan Level</label>
                    <Select value={grantPlan} onValueChange={(v) => setGrantPlan(v as typeof grantPlan)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Reason (optional)</label>
                    <Textarea
                      placeholder="e.g. Beta tester, partnership, comp access..."
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Expiry date (optional, leave blank = never)</label>
                    <Input
                      type="datetime-local"
                      value={grantExpiry}
                      onChange={(e) => setGrantExpiry(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!grantUserId || grantServiceMut.isPending}
                    onClick={() => {
                      const uid = parseInt(grantUserId);
                      if (isNaN(uid)) { toast.error("Enter a valid numeric user ID"); return; }
                      grantServiceMut.mutate({
                        userId: uid,
                        plan: grantPlan,
                        reason: grantReason || undefined,
                        expiresAt: grantExpiry ? new Date(grantExpiry).toISOString() : undefined,
                      });
                    }}
                  >
                    {grantServiceMut.isPending ? "Granting..." : "Grant Access"}
                  </Button>
                </div>
              </div>



              {/* Active grants list */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground">All Service Grants</h2>
                  <Button size="sm" variant="ghost" onClick={() => refetchGrants()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {grantsLoading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : !serviceGrants || serviceGrants.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No service grants yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {serviceGrants.map((grant) => (
                      <div
                        key={grant.id}
                        className={`border rounded-lg p-3 text-sm ${grant.isActive ? "border-primary/30 bg-primary/5" : "border-border opacity-60"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">User</span>
                            <CopyId id={grant.userId} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={grant.isActive ? "default" : "secondary"} className="text-xs">
                              {grant.isActive ? "Active" : "Revoked"}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">{grant.plan}</Badge>
                          </div>
                        </div>
                        {grant.reason && <p className="text-muted-foreground text-xs mb-1">{grant.reason}</p>}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {grant.expiresAt ? `Expires ${new Date(grant.expiresAt).toLocaleDateString()}` : "Never expires"}
                          </div>
                          {grant.isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-destructive hover:text-destructive"
                              onClick={() => setRevokeTarget(grant)}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Revoke
                            </Button>
                          )}
                        </div>
                        {!grant.isActive && grant.revokedReason && (
                          <p className="text-xs text-muted-foreground mt-1">Revoked: {grant.revokedReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Admin Management ── */}
          <TabsContent value="admins">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Admin Accounts</h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => setShowGrantOwnerForm(true)}
                  >
                    <Crown className="w-3.5 h-3.5" /> Grant Owner
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => refetchAdmins()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                To promote a user to admin, find their account in the{" "}
                <button className="text-primary underline" onClick={() => navigate("/admin/customers")}>
                  Customer Manager
                </button>{" "}
                and change their role there. Use the controls below to demote or re-assign existing admins.
                To grant the <strong>Owner</strong> role to any user (including those not yet admins), use the <strong>Grant Owner</strong> button above — TOTP verification is always required.
              </p>
              {adminsLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : !admins || admins.length === 0 ? (
                <p className="text-muted-foreground text-sm">No admin accounts found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left">
                        <th className="pb-2 pr-4 font-medium">Admin</th>
                        <th className="pb-2 pr-4 font-medium">Role</th>
                        <th className="pb-2 pr-4 font-medium">TOTP</th>
                        <th className="pb-2 pr-4 font-medium">Joined</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <CopyId id={admin.id} />
                              <span className="text-foreground font-medium">{admin.name ?? "—"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{admin.email ?? "—"}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="secondary" className="capitalize text-xs">{admin.role}</Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {admin.totpEnabled ? (
                              <div className="flex items-center gap-1 text-green-500 text-xs">
                                <CheckCircle className="w-3.5 h-3.5" /> Enabled
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-500 text-xs">
                                <AlertTriangle className="w-3.5 h-3.5" /> Not set up
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground text-xs">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => { setRoleTarget(admin); setNewRole("user"); }}
                            >
                              Change Role
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Enterprise Plans ── */}
          <TabsContent value="enterprise">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground text-lg">Enterprise Plan Builder</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Create custom plans with tailored pricing, email limits, and team sizes.</p>
                </div>
                <Button size="sm" onClick={() => setEpShowForm(!epShowForm)} className="gap-2">
                  {epShowForm ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {epShowForm ? "Cancel" : "New Plan"}
                </Button>
              </div>

              {/* Create Plan Form */}
              {epShowForm && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">New Custom Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                      <Input value={epCompanyName} onChange={(e) => setEpCompanyName(e.target.value)} placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Contact Email *</label>
                      <Input value={epContactEmail} onChange={(e) => setEpContactEmail(e.target.value)} placeholder="cto@acme.com" type="email" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Emails per Briefing (max read)</label>
                      <Input type="number" min={1} max={10000} value={epEmailsPerBriefing} onChange={(e) => setEpEmailsPerBriefing(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Manual Briefings / Day</label>
                      <Input type="number" min={0} max={100} value={epManualsPerDay} onChange={(e) => setEpManualsPerDay(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Scheduled Briefings / Day</label>
                      <Input type="number" min={1} max={24} value={epScheduledPerDay} onChange={(e) => setEpScheduledPerDay(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Team Members</label>
                      <Input type="number" min={1} max={10000} value={epTeamMembers} onChange={(e) => setEpTeamMembers(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Price / Month ($)</label>
                      <Input type="number" min={0} value={epPriceMonthly} onChange={(e) => setEpPriceMonthly(e.target.value)} placeholder="499" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Price / Year ($) — optional</label>
                      <Input type="number" min={0} value={epPriceAnnual} onChange={(e) => setEpPriceAnnual(e.target.value)} placeholder="4990" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Assign to User ID — optional</label>
                      <Input type="number" min={1} value={epAssignUserId} onChange={(e) => setEpAssignUserId(e.target.value)} placeholder="User ID" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Internal Notes</label>
                      <Textarea value={epNotes} onChange={(e) => setEpNotes(e.target.value)} placeholder="Special requirements, SLA notes..." rows={2} />
                    </div>
                  </div>

                  {/* Discount Section */}
                  <div className="border border-border/40 rounded-lg p-4 bg-muted/10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Discount / Promo</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">% Off — optional</label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={epDiscountPct}
                            onChange={(e) => setEpDiscountPct(e.target.value)}
                            placeholder="e.g. 20"
                            className="pr-7"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                        <Select value={epDiscountDuration} onValueChange={(v) => setEpDiscountDuration(v as typeof epDiscountDuration)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once (first invoice)</SelectItem>
                            <SelectItem value="repeating">Repeating (N months)</SelectItem>
                            <SelectItem value="forever">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {epDiscountDuration === "repeating" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Months</label>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            value={epDiscountMonths}
                            onChange={(e) => setEpDiscountMonths(e.target.value)}
                            placeholder="3"
                          />
                        </div>
                      )}
                    </div>
                    {epDiscountPct && (
                      <p className="text-xs text-amber-400 mt-2">
                        {epDiscountPct}% off
                        {epDiscountDuration === "once" && " on the first invoice"}
                        {epDiscountDuration === "repeating" && ` for ${epDiscountMonths} month${Number(epDiscountMonths) !== 1 ? "s" : ""}`}
                        {epDiscountDuration === "forever" && " forever"}
                        {epPriceMonthly && ` → $${(Number(epPriceMonthly) * (1 - Number(epDiscountPct) / 100)).toFixed(0)}/mo effective`}
                      </p>
                    )}
                  </div>

                  {/* Estimate Calculator */}
                  {priceEstimate && (
                    <div className="bg-muted/30 border border-border/40 rounded-lg p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price Estimate</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Monthly</p>
                          <p className="font-bold text-foreground">${priceEstimate.estimatedMonthly.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Annual (15% off)</p>
                          <p className="font-bold text-foreground">${priceEstimate.estimatedAnnual.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Base / Seat</p>
                          <p className="font-bold text-foreground">${priceEstimate.breakdown.basePerSeat}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Multipliers</p>
                          <p className="font-bold text-foreground">{priceEstimate.breakdown.emailMultiplier}× email, {priceEstimate.breakdown.briefingMultiplier}× briefing</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEpShowForm(false)}>Cancel</Button>
                    <Button
                      disabled={createEnterprisePlanMut.isPending || !epCompanyName || !epContactEmail}
                      onClick={() => {
                        createEnterprisePlanMut.mutate({
                          companyName: epCompanyName,
                          contactEmail: epContactEmail,
                          emailsPerBriefing: epEmailsPerBriefing,
                          manualBriefingsPerDay: epManualsPerDay,
                          scheduledBriefingsPerDay: epScheduledPerDay,
                          maxTeamMembers: epTeamMembers,
                          pricePerMonth: Number(epPriceMonthly) || 0,
                          pricePerYear: epPriceAnnual ? Number(epPriceAnnual) : undefined,
                          notes: epNotes || undefined,
                          assignedUserId: epAssignUserId ? Number(epAssignUserId) : undefined,
                        });
                      }}
                    >
                      {createEnterprisePlanMut.isPending ? "Creating..." : "Create Plan"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Plans List */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Existing Enterprise Plans</h3>
                {!enterprisePlansData || enterprisePlansData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No enterprise plans created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="pb-2 text-muted-foreground font-medium">Company</th>
                          <th className="pb-2 text-muted-foreground font-medium">Contact</th>
                          <th className="pb-2 text-muted-foreground font-medium">Seats</th>
                          <th className="pb-2 text-muted-foreground font-medium">$/mo</th>
                          <th className="pb-2 text-muted-foreground font-medium">Assigned User</th>
                          <th className="pb-2 text-muted-foreground font-medium">Status</th>
                          <th className="pb-2 text-muted-foreground font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {enterprisePlansData.map((plan) => (
                          <tr key={plan.id} className="py-2">
                            <td className="py-2 font-medium text-foreground">{plan.companyName}</td>
                            <td className="py-2 text-muted-foreground">{plan.contactEmail}</td>
                            <td className="py-2 text-muted-foreground">{plan.maxTeamMembers}</td>
                            <td className="py-2 text-muted-foreground">${plan.pricePerMonth}</td>
                            <td className="py-2 text-muted-foreground">
                              {plan.assignedUserId ? <CopyId id={plan.assignedUserId} /> : "—"}
                            </td>
                            <td className="py-2">
                              <Badge variant={plan.isActive ? "default" : "secondary"}>
                                {plan.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setEpAssignPlanId(plan.id); setEpAssignTarget(""); }}>Assign</Button>
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                                  setEpEditPlanId(plan.id);
                                  setEpEditCompany(plan.companyName ?? "");
                                  setEpEditEmail(plan.contactEmail ?? "");
                                  setEpEditSeats(plan.maxTeamMembers ?? 10);
                                  setEpEditPrice(Number(plan.pricePerMonth) || 0);
                                  setEpEditActive(plan.isActive ?? true);
                                  setEpEditNotes(plan.notes ?? "");
                                }}>Edit</Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => { setEpInvoicePlanId(plan.id); setEpInvoiceDays(30); }}>Invoice</Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 text-red-400 border-red-500/30 hover:bg-red-500/10" disabled={deleteEnterprisePlanMut.isPending} onClick={() => { if (confirm(`Delete plan for ${plan.companyName}?`)) deleteEnterprisePlanMut.mutate({ planId: plan.id }); }}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Edit Plan Dialog */}
              <Dialog open={epEditPlanId !== null} onOpenChange={(o) => { if (!o) setEpEditPlanId(null); }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Enterprise Plan</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Company Name</label><Input value={epEditCompany} onChange={(e) => setEpEditCompany(e.target.value)} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Contact Email</label><Input type="email" value={epEditEmail} onChange={(e) => setEpEditEmail(e.target.value)} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Seats</label><Input type="number" min={1} value={epEditSeats} onChange={(e) => setEpEditSeats(Number(e.target.value))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Monthly Price ($)</label><Input type="number" min={0} value={epEditPrice} onChange={(e) => setEpEditPrice(Number(e.target.value))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label><Textarea value={epEditNotes} onChange={(e) => setEpEditNotes(e.target.value)} rows={2} /></div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="epEditActive" checked={epEditActive} onChange={(e) => setEpEditActive(e.target.checked)} />
                      <label htmlFor="epEditActive" className="text-sm text-foreground">Active</label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEpEditPlanId(null)}>Cancel</Button>
                    <Button disabled={updateEnterprisePlanMut.isPending} onClick={() => epEditPlanId && updateEnterprisePlanMut.mutate({ planId: epEditPlanId, companyName: epEditCompany, contactEmail: epEditEmail, maxTeamMembers: epEditSeats, pricePerMonth: epEditPrice, notes: epEditNotes, isActive: epEditActive })}>
                      {updateEnterprisePlanMut.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Send Invoice Dialog */}
              <Dialog open={epInvoicePlanId !== null} onOpenChange={(o) => { if (!o) setEpInvoicePlanId(null); }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Send Stripe Invoice</DialogTitle><DialogDescription>Creates and emails a Stripe invoice to the plan contact for the monthly amount.</DialogDescription></DialogHeader>
                  <div className="space-y-3 py-2">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Days Until Due</label><Input type="number" min={1} max={90} value={epInvoiceDays} onChange={(e) => setEpInvoiceDays(Number(e.target.value))} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEpInvoicePlanId(null)}>Cancel</Button>
                    <Button disabled={sendInvoiceMut.isPending} onClick={() => epInvoicePlanId && sendInvoiceMut.mutate({ planId: epInvoicePlanId, daysUntilDue: epInvoiceDays })}>
                      {sendInvoiceMut.isPending ? "Sending..." : "Send Invoice"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          {/* ── Banned Accounts ── */}
          <TabsContent value="bans">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground">Banned Accounts</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">These email addresses are blocked from creating new accounts. Lift a ban to allow re-registration.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => refetchBans()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {bansLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !bansData || bansData.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active bans.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bansData.map((ban) => (
                    <div key={ban.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-foreground">{ban.email}</span>
                          {ban.openId && <Badge variant="outline" className="text-[10px]">openId locked</Badge>}
                        </div>
                        {ban.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">Reason: {ban.reason}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Banned by {ban.bannedByEmail ?? `User #${ban.bannedByUserId}`} on {new Date(ban.createdAt).toLocaleDateString()}
                          {ban.expiresAt && ` · Expires ${new Date(ban.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-green-400 border-green-500/30 hover:bg-green-500/10"
                        disabled={liftBanMut.isPending}
                        onClick={() => liftBanMut.mutate({ banId: ban.id })}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Lift Ban
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Enterprise Plan dialog */}
      <Dialog open={epAssignPlanId !== null} onOpenChange={(o) => { if (!o) setEpAssignPlanId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Enterprise Plan</DialogTitle>
            <DialogDescription>Enter the User ID to assign Plan #{epAssignPlanId} to.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground mb-1 block">User ID</label>
            <Input
              type="number"
              placeholder="User ID"
              value={epAssignTarget}
              onChange={(e) => setEpAssignTarget(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEpAssignPlanId(null)}>Cancel</Button>
            <Button
              disabled={assignEnterprisePlanMut.isPending || !epAssignTarget}
              onClick={() => {
                if (!epAssignPlanId) return;
                assignEnterprisePlanMut.mutate({ planId: epAssignPlanId, userId: Number(epAssignTarget) });
              }}
            >
              {assignEnterprisePlanMut.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke dialog */}
      <Dialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Revoke Service Access
            </DialogTitle>
            <DialogDescription>
              This will immediately remove service access for User #{revokeTarget?.userId}. They will need a paid subscription or a new grant to use InboxBrief again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
            <Textarea
              placeholder="Why are you revoking this grant?"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revokeServiceMut.isPending}
              onClick={() => {
                if (!revokeTarget) return;
                revokeServiceMut.mutate({ userId: revokeTarget.userId, reason: revokeReason || undefined });
              }}
            >
              {revokeServiceMut.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => { if (!o) setRoleTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {roleTarget?.email}</DialogTitle>
            <DialogDescription>
              Select the new role. Setting to "user" removes admin privileges immediately.
              Promoting to <strong>Owner</strong> requires TOTP verification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Select value={newRole} onValueChange={(v) => { setNewRole(v as typeof newRole); setRoleChangeTotpCode(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2"><User className="w-4 h-4" /> User (remove admin)</div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Admin</div>
                </SelectItem>
                <SelectItem value="owner">
                  <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-yellow-500" /> Owner</div>
                </SelectItem>
              </SelectContent>
            </Select>
            {newRole === "owner" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  <span className="text-amber-400 font-semibold">⚠ TOTP Required</span> — Enter your 6-digit authenticator code to confirm
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={roleChangeTotpCode}
                  onChange={(e) => setRoleChangeTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="font-mono tracking-widest text-center text-lg"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground mt-1">This action is irreversible without another owner account. Verify carefully.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRoleTarget(null); setRoleChangeTotpCode(""); }}>Cancel</Button>
            <Button
              disabled={setAdminRoleMut.isPending || (newRole === "owner" && roleChangeTotpCode.length !== 6)}
              variant={newRole === "owner" ? "destructive" : "default"}
              onClick={() => {
                if (!roleTarget) return;
                setAdminRoleMut.mutate({
                  userId: roleTarget.id,
                  role: newRole,
                  totpCode: newRole === "owner" ? roleChangeTotpCode : undefined,
                });
              }}
            >
              {setAdminRoleMut.isPending ? "Saving..." : newRole === "owner" ? "Promote to Owner" : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Owner Role to new user dialog */}
      <Dialog open={showGrantOwnerForm} onOpenChange={(o) => { if (!o) { setShowGrantOwnerForm(false); setGrantOwnerUserId(""); setGrantOwnerTotpCode(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Grant Owner Role</DialogTitle>
            <DialogDescription>
              Promote any user to Owner by their User ID. This grants full platform control.
              <strong className="text-amber-400 block mt-1">⚠ TOTP verification required.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
              <Input
                type="number"
                min={1}
                placeholder="Enter user ID"
                value={grantOwnerUserId}
                onChange={(e) => setGrantOwnerUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Your TOTP Code (6 digits)</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={grantOwnerTotpCode}
                onChange={(e) => setGrantOwnerTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="font-mono tracking-widest text-center text-lg"
                autoComplete="one-time-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowGrantOwnerForm(false); setGrantOwnerUserId(""); setGrantOwnerTotpCode(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={grantOwnerRoleMut.isPending || !grantOwnerUserId || grantOwnerTotpCode.length !== 6}
              onClick={() => {
                if (!grantOwnerUserId) return;
                grantOwnerRoleMut.mutate({
                  userId: Number(grantOwnerUserId),
                  role: "owner",
                  totpCode: grantOwnerTotpCode,
                });
              }}
            >
              {grantOwnerRoleMut.isPending ? "Granting..." : "Grant Owner Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <PageFooter />
    </div>
  );
}
