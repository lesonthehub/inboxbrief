import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PageFooter } from "@/components/PageFooter";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  StickyNote,
  Trash2,
  Crown,
  User,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

type AdminUser = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  onboardingComplete: boolean;
  trialUsed: boolean;
  trialEndsAt: Date | null;
  referralCode: string | null;
  referralCredits: number;
  createdAt: Date;
  lastSignedIn: Date;
  loginMethod: string | null;
  isActive: boolean;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  adminNotes: string | null;
};

type ModalType = "suspend" | "unsuspend" | "notes" | "delete" | "role" | null;

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AdminCustomers() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalInput, setModalInput] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [totpCode, setTotpCode] = useState("");

  const isAuthorized = isAuthenticated && (user?.role === "admin" || user?.role === "owner");

  const { data, isLoading, refetch } = trpc.adminUsers.list.useQuery(
    { limit: 200, offset: 0 },
    { enabled: !!isAuthorized }
  );

  const suspendMutation = trpc.adminUsers.suspend.useMutation({
    onSuccess: () => { toast.success("Account suspended"); closeModal(); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const unsuspendMutation = trpc.adminUsers.unsuspend.useMutation({
    onSuccess: () => { toast.success("Account reinstated"); closeModal(); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const notesMutation = trpc.adminUsers.updateNotes.useMutation({
    onSuccess: () => { toast.success("Notes saved"); closeModal(); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.adminUsers.softDelete.useMutation({
    onSuccess: () => { toast.success("Account deleted"); closeModal(); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const roleMutation = trpc.adminUsers.setRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); closeModal(); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) return null;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Admin or owner access required.</p>
          <button className="text-primary underline" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  function openModal(u: AdminUser, type: ModalType) {
    setSelectedUser(u);
    setModalType(type);
    setModalInput(type === "notes" ? (u.adminNotes ?? "") : "");
    if (type === "role") setNewRole(u.role === "admin" ? "user" : "admin");
  }

  function closeModal() {
    setModalType(null);
    setSelectedUser(null);
    setModalInput("");
    setTotpCode("");
  }

  function handleConfirm() {
    if (!selectedUser) return;
    if (totpCode.length !== 6) return toast.error("Enter your 6-digit authenticator code");
    if (modalType === "suspend") {
      if (!modalInput.trim()) return toast.error("Reason is required");
      suspendMutation.mutate({ userId: selectedUser.id, reason: modalInput.trim(), totpCode });
    } else if (modalType === "unsuspend") {
      unsuspendMutation.mutate({ userId: selectedUser.id, totpCode });
    } else if (modalType === "notes") {
      notesMutation.mutate({ userId: selectedUser.id, notes: modalInput, totpCode });
    } else if (modalType === "delete") {
      if (!modalInput.trim()) return toast.error("Reason is required");
      deleteMutation.mutate({ userId: selectedUser.id, reason: modalInput.trim(), totpCode });
    } else if (modalType === "role") {
      roleMutation.mutate({ userId: selectedUser.id, role: newRole, totpCode });
    }
  }

  const isMutating = suspendMutation.isPending || unsuspendMutation.isPending || notesMutation.isPending || deleteMutation.isPending || roleMutation.isPending;

  const filtered = (data?.users ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const totalCount = data?.total ?? 0;
  const activeCount = (data?.users ?? []).filter((u) => u.isActive).length;
  const suspendedCount = (data?.users ?? []).filter((u) => !u.isActive).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-sm text-foreground hover:opacity-80 transition-opacity"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            InboxBrief
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate("/admin/announcements")}>
              Announcements
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Customers
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage user accounts, suspensions, and notes.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total", value: totalCount, color: "text-foreground" },
            { label: "Active", value: activeCount, color: "text-emerald-400" },
            { label: "Suspended", value: suspendedCount, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No customers found.</div>
        ) : (
          <div className="rounded-lg border border-border/40 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/50">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">ID</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Last Login</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-border/20 hover:bg-card/30 transition-colors ${!u.isActive ? "opacity-60" : ""} ${i % 2 === 0 ? "" : "bg-card/10"}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded select-all">#{u.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[180px]">{u.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Active</Badge>
                        ) : (
                          <div>
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">Suspended</Badge>
                            {u.suspendedReason && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">{u.suspendedReason}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "owner" ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs"><Crown className="w-3 h-3 mr-1" />Owner</Badge>
                        ) : u.role === "admin" ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 text-xs"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs"><User className="w-3 h-3 mr-1" />User</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{timeAgo(u.lastSignedIn)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <ActionMenu user={u as AdminUser} onAction={openModal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/20">
              {filtered.map((u) => (
                <div key={u.id} className={`p-4 flex items-start justify-between gap-3 ${!u.isActive ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded select-all">#{u.id}</span>
                      <span className="font-medium truncate">{u.name ?? "—"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {u.isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">Suspended</Badge>
                      )}
                      {u.role === "owner" ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs"><Crown className="w-3 h-3 mr-1" />Owner</Badge>
                        ) : u.role === "admin" ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 text-xs"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs"><User className="w-3 h-3 mr-1" />User</Badge>
                        )}
                      <span className="text-xs text-muted-foreground">Last: {timeAgo(u.lastSignedIn)}</span>
                    </div>
                  </div>
                  <ActionMenu user={u as AdminUser} onAction={openModal} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Dialog open={modalType !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalType === "suspend" && "Suspend Account"}
              {modalType === "unsuspend" && "Reinstate Account"}
              {modalType === "notes" && "Admin Notes"}
              {modalType === "delete" && "Delete Account"}
              {modalType === "role" && "Change Role"}
            </DialogTitle>
            {selectedUser && (
              <DialogDescription className="text-sm text-muted-foreground">
                {selectedUser.name ?? selectedUser.email ?? `User #${selectedUser.id}`}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-2 space-y-3">
            {modalType === "suspend" && (
              <>
                <p className="text-sm text-muted-foreground">This will immediately block the user from sending briefings and accessing their dashboard.</p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason (required)</label>
                  <Textarea
                    placeholder="e.g. Abuse of service, billing dispute, DMCA request…"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </>
            )}
            {modalType === "unsuspend" && (
              <p className="text-sm text-muted-foreground">This will restore full access to the account immediately.</p>
            )}
            {modalType === "notes" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Internal notes (not visible to user)</label>
                <Textarea
                  placeholder="Add notes about this account…"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">{modalInput.length}/2000</p>
              </div>
            )}
            {modalType === "delete" && (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-300">This will anonymize the user's PII (name, email, phone) and permanently block their account. This cannot be undone.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason (required)</label>
                  <Textarea
                    placeholder="e.g. User request, GDPR erasure, ToS violation…"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </>
            )}
            {modalType === "role" && selectedUser && (
              <p className="text-sm text-muted-foreground">
                Change <strong>{selectedUser.name ?? selectedUser.email}</strong> from <strong>{selectedUser.role}</strong> to <strong>{newRole}</strong>?
                {newRole === "admin" && " This grants full admin access to all admin pages."}
              </p>
            )}

            {/* TOTP gate — always required */}
            <div className="pt-2 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Authenticator code (required)</label>
              <Input
                placeholder="6-digit code from your app"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="font-mono tracking-widest text-center"
              />
              <p className="text-xs text-muted-foreground mt-1">Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current code.</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={closeModal} disabled={isMutating} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isMutating}
              variant={modalType === "delete" || modalType === "suspend" ? "destructive" : "default"}
              className="w-full sm:w-auto"
            >
              {isMutating ? "Processing…" : (
                modalType === "suspend" ? "Suspend Account" :
                modalType === "unsuspend" ? "Reinstate Account" :
                modalType === "notes" ? "Save Notes" :
                modalType === "delete" ? "Delete Account" :
                "Change Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PageFooter />
    </div>
  );
}

function ActionMenu({ user, onAction }: { user: AdminUser; onAction: (u: AdminUser, t: ModalType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user.isActive ? (
          <DropdownMenuItem
            className="text-red-400 focus:text-red-300 gap-2"
            onClick={() => onAction(user, "suspend")}
          >
            <ShieldOff className="w-4 h-4" />
            Suspend Account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-emerald-400 focus:text-emerald-300 gap-2"
            onClick={() => onAction(user, "unsuspend")}
          >
            <ShieldCheck className="w-4 h-4" />
            Reinstate Account
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="gap-2" onClick={() => onAction(user, "notes")}>
          <StickyNote className="w-4 h-4" />
          {user.adminNotes ? "Edit Notes" : "Add Notes"}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => onAction(user, "role")}>
          <Crown className="w-4 h-4" />
          {user.role === "admin" ? "Remove Admin" : "Make Admin"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-400 focus:text-red-300 gap-2"
          onClick={() => onAction(user, "delete")}
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
