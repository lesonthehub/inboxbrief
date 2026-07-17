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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  BarChart3,
  Tag,
  Megaphone,
  Zap,
  Trash2,
  Plus,
  RefreshCw,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

type CouponType = "percent" | "amount";
type CouponDuration = "once" | "repeating" | "forever";

export default function AdminTools() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  // ── Coupon form state ──────────────────────────────────────────────────────
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponName, setCouponName] = useState("");
  const [couponType, setCouponType] = useState<CouponType>("percent");
  const [percentOff, setPercentOff] = useState("");
  const [amountOff, setAmountOff] = useState("");
  const [duration, setDuration] = useState<CouponDuration>("once");
  const [durationMonths, setDurationMonths] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // ── Broadcast SMS state ────────────────────────────────────────────────────
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all_active" | "subscribers_only" | "trial_only">("subscribers_only");
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // ── Manual briefing state ──────────────────────────────────────────────────
  const [briefingUserId, setBriefingUserId] = useState("");
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: stats, refetch: refetchStats } = trpc.adminTools.getStats.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "owner"),
    refetchInterval: 30000,
  });

  const { data: coupons, refetch: refetchCoupons } = trpc.adminTools.listCoupons.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "owner"),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCoupon = trpc.adminTools.createCoupon.useMutation({
    onSuccess: () => {
      toast.success("Coupon created successfully");
      utils.adminTools.listCoupons.invalidate();
      setShowCouponForm(false);
      resetCouponForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCoupon = trpc.adminTools.deleteCoupon.useMutation({
    onSuccess: () => {
      toast.success("Coupon deleted");
      utils.adminTools.listCoupons.invalidate();
      setDeleteCouponId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const broadcastSms = trpc.adminTools.broadcastSms.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent: ${data.sent} delivered, ${data.failed} failed`);
      setBroadcastMsg("");
      setShowBroadcastConfirm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const triggerBriefing = trpc.adminTools.triggerBriefingForUser.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Briefing triggered — SMS sent`);
      } else {
        toast.error(`Briefing failed: ${data.error ?? "Unknown error"}`);
      }
      setBriefingUserId("");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function resetCouponForm() {
    setCouponName("");
    setCouponType("percent");
    setPercentOff("");
    setAmountOff("");
    setDuration("once");
    setDurationMonths("");
    setMaxRedemptions("");
    setExpiresAt("");
  }

  function handleCreateCoupon() {
    if (!couponName.trim()) return toast.error("Coupon name is required");
    createCoupon.mutate({
      name: couponName.trim(),
      type: couponType,
      percentOff: couponType === "percent" ? parseFloat(percentOff) : undefined,
      amountOff: couponType === "amount" ? parseFloat(amountOff) : undefined,
      duration,
      durationInMonths: duration === "repeating" ? parseInt(durationMonths) : undefined,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
      expiresAt: expiresAt || undefined,
    });
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (authLoading) return null;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }
  if (user?.role !== "admin" && user?.role !== "owner") {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <span className="text-border/60">|</span>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Admin Tools</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { refetchStats(); refetchCoupons(); }} className="text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── System Stats ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>System Stats</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-400", badge: null },
              { label: "Active Users", value: stats?.activeUsers ?? "—", icon: Users, color: "text-green-400", badge: null },
              { label: "New Today", value: stats?.newUsersToday ?? "—", icon: TrendingUp, color: "text-indigo-400", badge: null },
              { label: "Subscribers", value: stats?.activeSubscriptions ?? "—", icon: Crown, color: "text-amber-400", badge: null },
              {
                label: "MRR",
                value: stats?.mrr !== undefined ? `$${stats.mrr}` : "—",
                icon: DollarSign,
                color: "text-emerald-400",
                badge: stats?.mrrSource === "stripe" ? "live" : stats?.mrrSource === "estimate" ? "~est" : null,
              },
              { label: "Briefings Sent", value: stats?.briefingsTodayCount ?? "—", icon: MessageSquare, color: "text-purple-400", badge: null },
            ].map(({ label, value, icon: Icon, color, badge }) => (
              <div key={label} className="bg-card border border-border/40 rounded-xl p-4 flex flex-col gap-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  {badge && (
                    <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
                      badge === "live" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    }`}>{badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Coupon Management ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Stripe Coupons</h2>
            </div>
            <Button size="sm" onClick={() => setShowCouponForm(true)} className="bg-primary hover:bg-primary/90 text-white text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Coupon
            </Button>
          </div>

          {/* Coupon list */}
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            {!coupons || coupons.length === 0 ? (
              <p className="text-muted-foreground text-sm p-5 text-center">No coupons yet. Create one to offer discounts at checkout.</p>
            ) : (
              <div className="divide-y divide-border/30">
                {coupons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{c.name}</span>
                        <Badge variant={c.valid ? "default" : "secondary"} className={`text-xs ${c.valid ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}`}>
                          {c.valid ? "Active" : "Expired"}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                          {c.duration === "forever" ? "Forever" : c.duration === "repeating" ? `${c.durationInMonths}mo` : "Once"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.percentOff ? `${c.percentOff}% off` : `$${c.amountOff} off`}
                        {" · "}{c.timesRedeemed} used{c.maxRedemptions ? ` / ${c.maxRedemptions} max` : ""}
                        {" · "}ID: <span className="font-mono">{c.id}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 shrink-0"
                      onClick={() => setDeleteCouponId(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Manual Briefing Trigger ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Manual Briefing Trigger</h2>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-3">Trigger an immediate briefing for any user by their database User ID. The briefing will fetch their emails, summarize with AI, and send an SMS.</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="User ID (e.g. 42)"
                value={briefingUserId}
                onChange={(e) => setBriefingUserId(e.target.value)}
                className="bg-background border-border/60 text-sm max-w-48"
              />
              <Button
                size="sm"
                onClick={() => {
                  const id = parseInt(briefingUserId);
                  if (!id || isNaN(id)) return toast.error("Enter a valid user ID");
                  triggerBriefing.mutate({ userId: id });
                }}
                disabled={triggerBriefing.isPending || !briefingUserId}
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {triggerBriefing.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                {triggerBriefing.isPending ? "Sending…" : "Trigger Briefing"}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Broadcast SMS ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Broadcast SMS</h2>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-5 space-y-3">
            <p className="text-xs text-muted-foreground">Send a one-time SMS to a group of users. Only users with verified phone numbers receive the message. The [InboxBrief] prefix is added automatically.</p>
            <Select value={broadcastTarget} onValueChange={(v) => setBroadcastTarget(v as typeof broadcastTarget)}>
              <SelectTrigger className="bg-background border-border/60 text-sm w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subscribers_only">Paid subscribers only</SelectItem>
                <SelectItem value="trial_only">Trial users only</SelectItem>
                <SelectItem value="all_active">All active users</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Your message here (max 400 chars)…"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value.slice(0, 400))}
              rows={3}
              className="bg-background border-border/60 text-sm resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{broadcastMsg.length}/400</span>
              <Button
                size="sm"
                onClick={() => setShowBroadcastConfirm(true)}
                disabled={broadcastMsg.trim().length < 10}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                <Megaphone className="w-3.5 h-3.5 mr-1" />
                Send Broadcast
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Create Coupon Modal ─────────────────────────────────────────────── */}
      <Dialog open={showCouponForm} onOpenChange={setShowCouponForm}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Stripe Coupon</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Coupons can be applied at checkout via Stripe's promotion code field.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Coupon Name (shown to customers)</label>
              <Input value={couponName} onChange={(e) => setCouponName(e.target.value)} placeholder="e.g. LAUNCH20" className="bg-background border-border/60 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Discount Type</label>
                <Select value={couponType} onValueChange={(v) => setCouponType(v as CouponType)}>
                  <SelectTrigger className="bg-background border-border/60 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent off</SelectItem>
                    <SelectItem value="amount">Amount off ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {couponType === "percent" ? "Percent Off (1–100)" : "Amount Off (USD)"}
                </label>
                <Input
                  type="number"
                  min={couponType === "percent" ? 1 : 0.5}
                  max={couponType === "percent" ? 100 : undefined}
                  value={couponType === "percent" ? percentOff : amountOff}
                  onChange={(e) => couponType === "percent" ? setPercentOff(e.target.value) : setAmountOff(e.target.value)}
                  placeholder={couponType === "percent" ? "20" : "10.00"}
                  className="bg-background border-border/60 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                <Select value={duration} onValueChange={(v) => setDuration(v as CouponDuration)}>
                  <SelectTrigger className="bg-background border-border/60 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="repeating">Repeating</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {duration === "repeating" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Months</label>
                  <Input type="number" min={1} max={24} value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} placeholder="3" className="bg-background border-border/60 text-sm" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Redemptions (optional)</label>
                <Input type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" className="bg-background border-border/60 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Expires (optional)</label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="bg-background border-border/60 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCouponForm(false); resetCouponForm(); }} className="text-muted-foreground">Cancel</Button>
            <Button onClick={handleCreateCoupon} disabled={createCoupon.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {createCoupon.isPending ? "Creating…" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Coupon Confirm ───────────────────────────────────────────── */}
      <Dialog open={!!deleteCouponId} onOpenChange={() => setDeleteCouponId(null)}>
        <DialogContent className="bg-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Coupon?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Coupon <span className="font-mono text-foreground">{deleteCouponId}</span> will be permanently deleted from Stripe. Existing subscriptions using it are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteCouponId(null)} className="text-muted-foreground">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteCouponId && deleteCoupon.mutate({ couponId: deleteCouponId })}
              disabled={deleteCoupon.isPending}
            >
              {deleteCoupon.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Broadcast Confirm ───────────────────────────────────────────────── */}
      <Dialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
        <DialogContent className="bg-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Send Broadcast SMS?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              This will send the following message to all <strong>{broadcastTarget === "subscribers_only" ? "paid subscribers" : broadcastTarget === "trial_only" ? "trial users" : "active users"}</strong> with verified phone numbers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 border border-border/40 rounded-lg p-3 text-sm text-foreground my-2">
            [InboxBrief] {broadcastMsg}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBroadcastConfirm(false)} className="text-muted-foreground">Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => broadcastSms.mutate({ message: broadcastMsg, targetGroup: broadcastTarget })}
              disabled={broadcastSms.isPending}
            >
              {broadcastSms.isPending ? "Sending…" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PageFooter />
    </div>
  );
}
