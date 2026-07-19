import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";
import { PageFooter } from "@/components/PageFooter";
import {
  Shield, MessageSquare, Settings, LogOut, Plus, Trash2,
  Clock, CheckCircle, XCircle, AlertCircle, Zap, Mail,
  Calendar, Lock, Gift, Star, Users, ThumbsUp, ThumbsDown,
  Globe, ChevronDown, Copy, Check, Send, UserPlus, ExternalLink, Crown
} from "lucide-react";

const SCHEDULE_OPTIONS = [
  { value: "manual", label: "Manual only", desc: "Tap the button when you want a briefing" },
  { value: "daily_morning", label: "Daily at 8 AM", desc: "One briefing every morning" },
  { value: "daily_evening", label: "Daily at 6 PM", desc: "One briefing every evening" },
  { value: "twice_daily", label: "Twice daily", desc: "8 AM and 5 PM every day" },
  { value: "custom", label: "Custom times", desc: "Set your own delivery times" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Not helpful",
  2: "Needs work",
  3: "Pretty good",
  4: "Very helpful",
  5: "Perfect",
};

function SmsStatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    sent: { icon: <CheckCircle className="w-3 h-3" />, label: "Sent", cls: "text-green-400 bg-green-400/10 border-green-400/30" },
    failed: { icon: <XCircle className="w-3 h-3" />, label: "Failed", cls: "text-red-400 bg-red-400/10 border-red-400/30" },
    pending: { icon: <Clock className="w-3 h-3" />, label: "Pending", cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    skipped: { icon: <AlertCircle className="w-3 h-3" />, label: "Skipped", cls: "text-muted-foreground bg-muted/30 border-border/50" },
  };
  const s = map[status] ?? map.skipped;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function FeedbackPanel({ logId, onClose }: { logId: number; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [tone, setTone] = useState<string>("");
  const [addKw, setAddKw] = useState("");
  const [removeKw, setRemoveKw] = useState("");
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();

  const submitFeedback = trpc.briefing.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback saved — your next briefing will be adjusted.");
      utils.briefing.history.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="mt-3 bg-background/60 border border-border/40 rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-foreground">Rate this briefing</p>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star className={`w-6 h-6 transition-colors ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-muted-foreground ml-2">{RATING_LABELS[rating]}</span>}
      </div>

      {/* Tone adjustment */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Adjust the tone?</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "more_concise", label: "More concise" },
            { value: "more_detail", label: "More detail" },
            { value: "more_casual", label: "More casual" },
            { value: "more_formal", label: "More formal" },
            { value: "perfect", label: "Perfect as-is" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                tone === opt.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Always include (keywords)</label>
          <Input
            placeholder="e.g. invoice, Sarah, contract"
            value={addKw}
            onChange={(e) => setAddKw(e.target.value)}
            className="bg-input border-border text-xs h-8"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Always skip (keywords)</label>
          <Input
            placeholder="e.g. newsletter, promo"
            value={removeKw}
            onChange={(e) => setRemoveKw(e.target.value)}
            className="bg-input border-border text-xs h-8"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Any other notes? (optional)</label>
        <Input
          placeholder="e.g. Focus more on job applicants"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="bg-input border-border text-xs h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white border-0 text-xs"
          disabled={rating === 0 || submitFeedback.isPending}
          onClick={() => submitFeedback.mutate({
            briefingLogId: logId,
            rating,
            toneAdjustment: tone as "more_concise" | "more_detail" | "more_casual" | "more_formal" | "perfect" | undefined,
            addKeywords: addKw || undefined,
            removeKeywords: removeKw || undefined,
            freeformNote: note || undefined,
          })}
        >
          {submitFeedback.isPending ? "Saving..." : "Save Feedback"}
        </Button>
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showSchedule, setShowSchedule] = useState(false);
  const [customTimes, setCustomTimes] = useState("");
  const [feedbackLogId, setFeedbackLogId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"briefings" | "team" | "referral">("briefings");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [emailVerifCode, setEmailVerifCode] = useState("");
  const [showEmailVerifInput, setShowEmailVerifInput] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const utils = trpc.useUtils();

  const { data: subStatus, isLoading: subLoading } = trpc.subscription.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const { data: emailVerifStatus, refetch: refetchEmailVerif } = trpc.emailVerification.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const sendVerifEmail = trpc.emailVerification.sendCode.useMutation({
    onSuccess: () => { toast.success("Verification email sent! Check your inbox."); setShowEmailVerifInput(true); },
    onError: (err) => toast.error(err.message),
  });
  const verifyEmailCode = trpc.emailVerification.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("Email verified! You now have full access.");
      refetchEmailVerif();
      setEmailVerifCode("");
      setShowEmailVerifInput(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const { data: emailAccounts } = trpc.emailAccounts.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: history, isLoading: historyLoading } = trpc.briefing.history.useQuery({ limit: 15 }, { enabled: isAuthenticated });
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: referralData } = trpc.referral.getMyReferral.useQuery(undefined, { enabled: isAuthenticated });
  const { data: teamMembers } = trpc.team.getMembers.useQuery(undefined, { enabled: isAuthenticated });

  const triggerBriefing = trpc.briefing.trigger.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.smsSent
          ? `Briefing sent! ${result.highPriorityCount} priority, ${result.generalCount} general emails.`
          : "Briefing processed but SMS failed. Check your phone settings.",
        { duration: 5000 }
      );
      utils.briefing.history.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      utils.settings.get.invalidate();
      setShowSchedule(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteMember = trpc.team.invite.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/invite/${data.inviteToken}`;
      setGeneratedInviteLink(link);
      setInviteEmail("");
      setInvitePhone("");
      toast.success("Invite link generated! Share it with your team member.");
      utils.team.getMembers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Team member removed");
      utils.team.getMembers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectAccount = trpc.emailAccounts.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Email account disconnected");
      utils.emailAccounts.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Redirect to homepage instead of showing the login modal inline.
      // This gives users a clean exit without being immediately prompted to sign back in.
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (settings?.scheduleTimes) setCustomTimes(settings.scheduleTimes);
  }, [settings]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmailVerifiedFinal = !!emailVerifStatus?.emailVerified;
  const isActive = subStatus?.isActive;
  const phoneVerified = subStatus?.phoneVerified ?? false;
  const userPhone = subStatus?.phone ?? user?.email ?? "";
  const planName = subStatus?.plan === "trial" ? "Free Trial" : (subStatus?.planDetails?.name ?? "No Plan");
  const trialDaysLeft = subStatus?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subStatus.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const isTeamPlan = subStatus?.plan === "business" || subStatus?.plan === "enterprise";
  const isSoloPlan = subStatus?.plan === "solo";
  const isPro = subStatus?.plan === "pro" || subStatus?.plan === "business" || subStatus?.plan === "enterprise";
  const manualBriefingsToday = (subStatus as { manualBriefingsToday?: number } | undefined)?.manualBriefingsToday ?? 0;
  const manualLimit = isSoloPlan ? 0 : isPro ? 2 : 0; // Pro/Business = 2/day, Solo = 0
  const trialAlreadyUsed = !!(user as { trialUsed?: boolean } | null)?.trialUsed && !isActive;

  const handleTrigger = () => {
    if (!isActive) {
      toast.error("Active subscription required. Please choose a plan.");
      navigate("/pricing");
      return;
    }
    if (!emailAccounts || emailAccounts.length === 0) {
      toast.error("Connect an email account first.");
      return;
    }
    // Email verification gate
    if (!isEmailVerifiedFinal) {
      toast.error("Please verify your email address before sending briefings.");
      return;
    }
    // Phone verification gate — must verify before first briefing or after number change
    if (!phoneVerified) {
      setShowPhoneVerification(true);
      return;
    }
    triggerBriefing.mutate();
  };

  const handleScheduleChange = (value: string) => {
    const times = value === "daily_morning" ? "08:00"
      : value === "daily_evening" ? "18:00"
      : value === "twice_daily" ? "08:00,17:00"
      : settings?.scheduleTimes ?? "08:00";
    updateSettings.mutate({
      scheduleType: value as "manual" | "daily_morning" | "daily_evening" | "twice_daily" | "custom",
      scheduleTimes: times,
    });
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Referral code copied!");
    }
  };

  const currentSchedule = SCHEDULE_OPTIONS.find(o => o.value === settings?.scheduleType) ?? SCHEDULE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* LoginModal removed — unauthenticated users are redirected to / */}
      {/* Phone Verification Modal */}
      {showPhoneVerification && userPhone && (
        <PhoneVerificationModal
          open={showPhoneVerification}
          phone={userPhone}
          onVerified={() => {
            setShowPhoneVerification(false);
            utils.subscription.getStatus.invalidate();
            toast.success("Phone verified! Sending your briefing now...");
            triggerBriefing.mutate();
          }}
          onClose={() => setShowPhoneVerification(false)}
        />
      )}
      {/* Email Verification Banner */}
      {!isEmailVerifiedFinal && !bannerDismissed && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3">
          <div className="container max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Mail className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-200">
                <span className="font-semibold">Email not verified.</span> Verify your email to unlock all features including briefings.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!showEmailVerifInput ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs h-8"
                    onClick={() => sendVerifEmail.mutate()}
                    disabled={sendVerifEmail.isPending}
                  >
                    {sendVerifEmail.isPending ? "Sending..." : "Send Verification Email"}
                  </Button>
                  <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={emailVerifCode}
                    onChange={e => setEmailVerifCode(e.target.value)}
                    maxLength={6}
                    className="w-36 h-8 text-xs bg-background/60 border-yellow-500/40"
                  />
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs h-8"
                    onClick={() => verifyEmailCode.mutate({ code: emailVerifCode })}
                    disabled={verifyEmailCode.isPending || emailVerifCode.length !== 6}
                  >
                    {verifyEmailCode.isPending ? "Verifying..." : "Verify"}
                  </Button>
                  <button className="text-xs text-yellow-400 underline" onClick={() => sendVerifEmail.mutate()}>Resend</button>
                  <button className="text-xs text-muted-foreground hover:text-foreground ml-1" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Top Nav */}
      <nav className="border-b border-border/40 bg-background/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-base sm:text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Admin/Owner dropdown — visible to admin and owner roles */}
            {(user?.role === "admin" || user?.role === "owner") && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 h-auto rounded-full"
                >
                  <Crown className="w-3 h-3" />
                  <span className="hidden sm:inline">{user?.role === "owner" ? "Owner" : "Admin"}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${adminMenuOpen ? "rotate-180" : ""}`} />
                </Button>
                {/* Click-driven dropdown */}
                {adminMenuOpen && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAdminMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-amber-400/20 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border/40">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">{user?.role === "owner" ? "Owner Panel" : "Admin Panel"}</p>
                      </div>
                      {/* Owner-only: Owner Dashboard link */}
                      {user?.role === "owner" && (
                        <button
                          onClick={() => { setAdminMenuOpen(false); navigate("/owner"); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-amber-300 hover:bg-amber-400/10 transition-colors text-left border-b border-amber-400/10 font-medium"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          Owner Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => { setAdminMenuOpen(false); navigate("/admin/customers"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors text-left"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Customer Accounts
                      </button>
                      <button
                        onClick={() => { setAdminMenuOpen(false); navigate("/admin/announcements"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors text-left"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Announcements
                      </button>
                      <button
                        onClick={() => { setAdminMenuOpen(false); navigate("/admin/tools"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors text-left"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Admin Tools
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1.5 rounded-full text-xs font-medium text-green-400">
              <Shield className="w-3.5 h-3.5" />
              Data Encrypted
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Sign out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-4xl mx-auto space-y-5 px-4">

        {/* Welcome + Plan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {user?.name ? `Hey, ${user.name.split(" ")[0]}` : "Your Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 flex flex-wrap items-center gap-1">
              <span>{isActive ? `Active · ${planName}` : "No active subscription"}</span>
              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <span className="text-primary font-medium">· {trialDaysLeft} days left in trial</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isActive && (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0 text-xs" onClick={() => navigate("/pricing")}>
                Choose a Plan
              </Button>
            )}
            {isActive && subStatus?.plan === "trial" && (
              <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 text-xs" onClick={() => navigate("/pricing")}>
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* ── THE MAIN BUTTON ─────────────────────────────────────────────── */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 sm:p-8 text-center shadow-xl shadow-primary/5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1 rounded-full text-xs font-medium text-green-400">
              <Lock className="w-3 h-3" />
              AES-256-GCM Protected
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {emailAccounts && emailAccounts.length > 0
              ? `Reading from ${emailAccounts.map(a => a.emailAddress).join(", ")}`
              : "Connect an email account below to get started"}
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white border-0 text-base sm:text-xl px-8 sm:px-12 py-5 sm:py-7 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] rounded-xl"
            onClick={handleTrigger}
            disabled={triggerBriefing.isPending || !isActive}
          >
            {triggerBriefing.isPending ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating briefing...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                💬 TEXT MY BRIEFING
              </span>
            )}
          </Button>
          {!isActive && (
            <p className="text-xs text-muted-foreground mt-3">Requires an active subscription</p>
          )}
          {isActive && (!emailAccounts || emailAccounts.length === 0) && (
            <p className="text-xs text-yellow-400 mt-3">Connect an email account below first</p>
          )}
          {isActive && isPro && (
            <p className="text-xs text-muted-foreground mt-3">
              Manual briefings today: <span className={manualBriefingsToday >= manualLimit ? "text-red-400 font-semibold" : "text-foreground font-semibold"}>{manualBriefingsToday}/{manualLimit}</span>
            </p>
          )}
          {isActive && isSoloPlan && (
            <p className="text-xs text-muted-foreground mt-3">Manual briefings are available on Pro plan and above.</p>
          )}
        </div>

        {/* Email Accounts */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Connected Accounts
            </h2>
          </div>

          {/* Provider cards — Gmail and Outlook only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gmail card */}
            {(() => {
              const gmailAcc = emailAccounts?.find(a => a.provider === "gmail");
              return (
                <div className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                  gmailAcc ? "border-green-500/40 bg-green-950/20" : "border-border/40 bg-muted/20"
                }`}>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    {/* Gmail logo */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.907 1.528-1.148C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">Gmail</p>
                      {gmailAcc ? (
                        <p className="text-xs text-muted-foreground truncate">{gmailAcc.emailAddress}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                    {gmailAcc && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-400/10 text-green-400 border border-green-400/30">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  {/* Action */}
                  {gmailAcc ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-red-400 hover:bg-red-950/30 border border-border/40 rounded-lg h-8"
                      onClick={() => disconnectAccount.mutate({ accountId: gmailAcc.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg h-8"
                      onClick={() => { window.location.href = "/api/oauth/gmail/start"; }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Connect Gmail
                    </Button>
                  )}
                </div>
              );
            })()}

            {/* Outlook card */}
            {(() => {
              const outlookAcc = emailAccounts?.find(a => a.provider === "outlook");
              const isLocked = isSoloPlan;
              return (
                <div className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                  outlookAcc ? "border-green-500/40 bg-green-950/20" : isLocked ? "border-border/20 bg-muted/10 opacity-60" : "border-border/40 bg-muted/20"
                }`}>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    {/* Outlook logo */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-7.85-3.93h-4.45v6.2h4.45V8.07zm-4.45 7.3v1.1h4.45v-1.1h-4.45zm4.45-9.5h-4.45v1.1h4.45V5.87zm2.2 0v1.1h1.1V5.87h-1.1zm0 2.2v1.1h1.1V8.07h-1.1zm0 2.2v1.1h1.1v-1.1h-1.1zm0 2.2v1.1h1.1v-1.1h-1.1zm0 2.2v1.1h1.1v-1.1h-1.1z" fill="#0078D4"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">Outlook</p>
                      {outlookAcc ? (
                        <p className="text-xs text-muted-foreground truncate">{outlookAcc.emailAddress}</p>
                      ) : isLocked ? (
                        <p className="text-xs text-muted-foreground">Pro plan required</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                    {outlookAcc && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-400/10 text-green-400 border border-green-400/30">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  {/* Action */}
                  {outlookAcc ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-red-400 hover:bg-red-950/30 border border-border/40 rounded-lg h-8"
                      onClick={() => disconnectAccount.mutate({ accountId: outlookAcc.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                    </Button>
                  ) : isLocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-border/40 text-muted-foreground rounded-lg h-8 cursor-not-allowed"
                      onClick={() => navigate("/pricing")}
                    >
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-[#0078D4] hover:bg-[#006BBE] text-white border-0 rounded-lg h-8"
                      onClick={() => { window.location.href = "/api/oauth/outlook/start"; }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Connect Outlook
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Solo plan note */}
          {isSoloPlan && (
            <div className="mt-3 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/20">
              <p className="text-xs text-blue-300 leading-relaxed">Solo plan includes <strong>Gmail only</strong>. <button className="underline font-medium" onClick={() => navigate("/pricing")}>Upgrade to Pro</button> to also connect Outlook.</p>
            </div>
          )}
        </div>

        {/* Schedule Picker */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                SMS Schedule
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              {showSchedule ? "Cancel" : "Change"}
            </Button>
          </div>

          {!showSchedule ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{currentSchedule.label}</p>
                <p className="text-xs text-muted-foreground">{currentSchedule.desc}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleScheduleChange(opt.value)}
                  className={`w-full p-3 rounded-lg text-left transition-all border flex items-center justify-between text-sm ${
                    settings?.scheduleType === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border/40 bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {settings?.scheduleType === opt.value && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
              {settings?.scheduleType === "custom" && (
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Times (comma-separated, 24h format)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 07:00,12:00,17:00"
                      value={customTimes}
                      onChange={(e) => setCustomTimes(e.target.value)}
                      className="bg-input border-border text-sm h-8 flex-1"
                    />
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white border-0 text-xs"
                      onClick={() => updateSettings.mutate({ scheduleType: "custom", scheduleTimes: customTimes })}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs: Briefings / Team / Referral */}
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="flex border-b border-border/40">
            {[
              { id: "briefings" as const, label: "Briefing History", icon: <Zap className="w-3.5 h-3.5" /> },
              ...(isTeamPlan ? [{ id: "team" as const, label: "Team", icon: <Users className="w-3.5 h-3.5" /> }] : []),
              { id: "referral" as const, label: "Referrals", icon: <Gift className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Briefing History Tab */}
          {activeTab === "briefings" && (
            <div className="p-4 sm:p-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !history || history.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No briefings yet. Hit the button above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="bg-background/60 border border-border/30 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SmsStatusBadge status={log.smsStatus} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            · {log.triggerType}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-primary p-1 flex-shrink-0"
                          onClick={() => setFeedbackLogId(feedbackLogId === log.id ? null : log.id)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          <span className="hidden sm:inline">Rate</span>
                        </Button>
                      </div>

                      {log.summary && (
                        <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 rounded-lg p-3 font-mono text-xs">
                          {log.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">{log.emailsFetched} emails read</span>
                        {log.highPriorityCount > 0 && (
                          <span className="text-xs text-primary">{log.highPriorityCount} priority</span>
                        )}
                        {log.generalCount > 0 && (
                          <span className="text-xs text-muted-foreground">{log.generalCount} general</span>
                        )}
                        {log.ignoredCount > 0 && (
                          <span className="text-xs text-muted-foreground/50">{log.ignoredCount} ignored</span>
                        )}
                      </div>

                      {feedbackLogId === log.id && (
                        <FeedbackPanel logId={log.id} onClose={() => setFeedbackLogId(null)} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "team" && isTeamPlan && (
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Team Members</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Each member receives their own SMS briefings.</p>
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white border-0 text-xs"
                  onClick={() => { setShowInviteForm(!showInviteForm); setGeneratedInviteLink(null); }}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Invite
                </Button>
              </div>

              {/* Invite Form */}
              {showInviteForm && !generatedInviteLink && (
                <div className="mb-4 p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-foreground">Send an invite link</p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Team member email *</label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-input border-border text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Their phone number (optional)</label>
                    <Input
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="bg-input border-border text-sm h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white border-0 text-xs"
                      disabled={!inviteEmail || inviteMember.isPending}
                      onClick={() => inviteMember.mutate({ email: inviteEmail, phone: invitePhone || undefined })}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">{inviteMember.isPending ? "Generating..." : "Generate Invite Link"}</span>
                      <span className="sm:hidden">{inviteMember.isPending ? "Generating..." : "Generate Link"}</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setShowInviteForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Generated Invite Link */}
              {generatedInviteLink && (
                <div className="mb-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-semibold text-green-400">Invite link ready!</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this link with your team member. It expires in 7 days.</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs font-mono text-foreground/70 truncate">
                      {generatedInviteLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/60 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteLink);
                        setCopiedInviteLink(true);
                        setTimeout(() => setCopiedInviteLink(false), 2000);
                        toast.success("Link copied!");
                      }}
                    >
                      {copiedInviteLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground"
                    onClick={() => { setGeneratedInviteLink(null); setShowInviteForm(false); }}
                  >
                    Done
                  </Button>
                </div>
              )}

              {teamMembers && teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.inviteEmail}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.phone ? `${m.phone} · ` : ""}{m.status}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          m.status === "active"
                            ? "text-green-400 bg-green-400/10 border-green-400/30"
                            : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
                        }`}>
                          {m.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-400 p-1.5"
                          onClick={() => removeMember.mutate({ memberId: m.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No team members yet. Invite your first member above.</p>
                </div>
              )}
            </div>
          )}

          {/* Referral Tab */}
          {activeTab === "referral" && (
            <div className="p-4 sm:p-5">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Earn $5 per referral
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share your code. When a friend signs up and subscribes, you both benefit.
                </p>
              </div>

              {referralData?.referralCode ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-4 py-3 font-mono text-lg font-bold text-foreground tracking-widest text-center">
                      {referralData.referralCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/60 text-foreground hover:border-primary/50 flex-shrink-0"
                      onClick={copyReferralCode}
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Referrals", value: referralData.totalReferrals },
                      { label: "Earned", value: `$${((referralData.creditsEarned ?? 0) / 100).toFixed(0)}` },
                      { label: "Available", value: `$${((referralData.referralCredits ?? 0) / 100).toFixed(0)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/20 border border-border/30 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Credits are applied automatically to your next billing cycle.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete onboarding to get your referral code.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upgrade prompt for non-team plans */}
        {!isTeamPlan && isActive && (
          <div className="bg-card border border-border/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Add your team</p>
                <p className="text-xs text-muted-foreground">Upgrade to Business to send briefings to up to 5 team members.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs flex-shrink-0"
              onClick={() => navigate("/pricing")}
            >
              View Team Plans
            </Button>
          </div>
        )}
      </div>
      <PageFooter />
    </div>
  );
}
