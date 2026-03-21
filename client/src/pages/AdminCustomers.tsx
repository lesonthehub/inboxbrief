import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Search,
  RefreshCw,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

// ─── Authorized admin emails ────────────────────────────────────────────────
const ADMIN_EMAILS = [
  "lesterantoine@inboxbrief.org",
  "lesterantoine@16starcollective.com",
];

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(d: Date | string | null | undefined) {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  phone: string | null;
  phoneVerified: boolean;
  businessType: string | null;
  onboardingComplete: boolean;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  trialUsed: boolean;
  referralCode: string | null;
  referralCredits: number;
  createdAt: Date;
  lastSignedIn: Date;
  loginMethod: string | null;
};

export default function AdminCustomers() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Enforce email whitelist on the frontend (backend also enforces role check)
  const isAuthorized = isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email);

  const { data, isLoading, refetch } = trpc.adminUsers.list.useQuery(
    { limit: 200, offset: 0 },
    { enabled: !!isAuthorized }
  );

  const { data: detail, isLoading: detailLoading } = trpc.adminUsers.getDetail.useQuery(
    { userId: selectedUserId! },
    { enabled: selectedUserId !== null && !!isAuthorized }
  );

  const setRoleMutation = trpc.adminUsers.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to access this page.</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm">You are not authorized to view this page.</p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const users: UserRow[] = (data?.users ?? []) as UserRow[];
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.businessType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/announcements")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Admin</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Customers
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {data?.total ?? 0} total
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Refresh</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60 text-sm"
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: data?.total ?? 0, icon: Users },
            { label: "Onboarded", value: users.filter(u => u.onboardingComplete).length, icon: CheckCircle },
            { label: "Phone Verified", value: users.filter(u => u.phoneVerified).length, icon: Phone },
            { label: "Admins", value: users.filter(u => u.role === "admin").length, icon: Crown },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 bg-card/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground">User</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground hidden md:table-cell">Business Type</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Last Login</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        {search ? "No users match your search." : "No users yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => (
                      <TableRow
                        key={u.id}
                        className="border-border/30 hover:bg-card/60 cursor-pointer transition-colors"
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(79,70,229,0.15)", color: "#818cf8" }}
                            >
                              {(u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[140px]">{u.name ?? "—"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{u.email ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-muted-foreground">{u.phone ?? "—"}</span>
                            {u.phoneVerified && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{u.businessType ?? "—"}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{formatRelative(u.lastSignedIn)}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(u.lastSignedIn)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {u.role === "admin" && (
                              <Badge className="text-xs bg-indigo-500/15 text-indigo-400 border-indigo-500/30 w-fit">
                                Admin
                              </Badge>
                            )}
                            {u.onboardingComplete ? (
                              <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/30 w-fit">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-yellow-500/15 text-yellow-400 border-yellow-500/30 w-fit">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={selectedUserId !== null} onOpenChange={(o) => { if (!o) setSelectedUserId(null); }}>
        <DialogContent className="bg-card border border-border/60 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Customer Details
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              {/* Identity */}
              <div className="bg-background/50 border border-border/30 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</h3>
                <Row icon={<Users className="w-3.5 h-3.5" />} label="Name" value={detail.user.name ?? "—"} />
                <Row icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={detail.user.email ?? "—"} />
                <Row icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={
                  <span className="flex items-center gap-1.5">
                    {detail.user.phone ?? "—"}
                    {detail.user.phoneVerified
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </span>
                } />
                <Row icon={<Shield className="w-3.5 h-3.5" />} label="Role" value={
                  <Badge className={detail.user.role === "admin"
                    ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-xs"
                    : "bg-muted text-muted-foreground text-xs"
                  }>
                    {detail.user.role}
                  </Badge>
                } />
                <Row icon={<Mail className="w-3.5 h-3.5" />} label="Login Method" value={detail.user.loginMethod ?? "—"} />
              </div>

              {/* Activity */}
              <div className="bg-background/50 border border-border/30 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</h3>
                <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Joined" value={formatDate(detail.user.createdAt)} />
                <Row icon={<Clock className="w-3.5 h-3.5" />} label="Last Login" value={
                  <span>
                    <span className="font-medium">{formatRelative(detail.user.lastSignedIn)}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">({formatDate(detail.user.lastSignedIn)})</span>
                  </span>
                } />
                <Row icon={<CheckCircle className="w-3.5 h-3.5" />} label="Onboarding" value={
                  detail.user.onboardingComplete
                    ? <span className="text-green-400">Complete</span>
                    : <span className="text-yellow-400">Pending</span>
                } />
                <Row icon={<Users className="w-3.5 h-3.5" />} label="Business Type" value={detail.user.businessType ?? "—"} />
                <Row icon={<Mail className="w-3.5 h-3.5" />} label="Total Briefings" value={String(detail.totalBriefings)} />
              </div>

              {/* Subscription */}
              <div className="bg-background/50 border border-border/30 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Subscription</h3>
                {detail.subscription ? (
                  <>
                    <Row icon={<Crown className="w-3.5 h-3.5" />} label="Plan" value={
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs capitalize">
                        {detail.subscription.plan}
                      </Badge>
                    } />
                    <Row icon={<CheckCircle className="w-3.5 h-3.5" />} label="Status" value={detail.subscription.status ?? "—"} />
                    <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Period End" value={formatDate(detail.subscription.currentPeriodEnd)} />
                    <Row icon={<Users className="w-3.5 h-3.5" />} label="Seats" value={String(detail.subscription.seatCount ?? 1)} />
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">No subscription record.</p>
                )}
              </div>

              {/* Connected Accounts */}
              {detail.emailAccounts.length > 0 && (
                <div className="bg-background/50 border border-border/30 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Connected Accounts ({detail.emailAccounts.length})
                  </h3>
                  {detail.emailAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs">{acc.emailAddress}</span>
                      </div>
                      <Badge className={`text-xs ${acc.isActive ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}`}>
                        {acc.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin Actions */}
              {detail.user.id !== user?.id && (
                <div className="bg-background/50 border border-border/30 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Admin Actions</h3>
                  <div className="flex gap-2">
                    {detail.user.role === "user" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => setRoleMutation.mutate({ userId: detail.user.id, role: "admin" })}
                        disabled={setRoleMutation.isPending}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Promote to Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setRoleMutation.mutate({ userId: detail.user.id, role: "user" })}
                        disabled={setRoleMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Remove Admin
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0 min-w-[110px]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xs text-right break-all">{value}</div>
    </div>
  );
}
