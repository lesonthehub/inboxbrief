import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield, MessageSquare, Settings, LogOut, Plus, Trash2,
  Clock, CheckCircle, XCircle, AlertCircle, Zap, Mail,
  Calendar, Lock, Gift, Star, Users, ThumbsUp, ThumbsDown,
  Globe, ChevronDown, Copy, Check, Send, UserPlus, ExternalLink
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

  const utils = trpc.useUtils();

  const { data: subStatus, isLoading: subLoading } = trpc.subscription.getStatus.useQuery(undefined, { enabled: isAuthenticated });
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl("/dashboard");
    }
  }, [isAuthenticated, authLoading]);

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

  const isActive = subStatus?.isActive;
  const planName = subStatus?.plan === "trial" ? "Free Trial" : (subStatus?.planDetails?.name ?? "No Plan");
  const trialDaysLeft = subStatus?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subStatus.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const isTeamPlan = subStatus?.plan === "business" || subStatus?.plan === "enterprise";

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
      {/* Top Nav */}
      <nav className="border-b border-border/40 bg-background/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1.5 rounded-full text-xs font-medium text-green-400">
              <Shield className="w-3.5 h-3.5" />
              Data Encrypted
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground p-2">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground p-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-4xl mx-auto space-y-5 px-4">

        {/* Welcome + Plan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {user?.name ? `Hey, ${user.name.split(" ")[0]}` : "Your Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isActive ? `Active · ${planName}` : "No active subscription"}
              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <span className="ml-2 text-primary font-medium">· {trialDaysLeft} days left in trial</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isActive && (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0" onClick={() => navigate("/pricing")}>
                Choose a Plan
              </Button>
            )}
            {isActive && subStatus?.plan === "trial" && (
              <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => navigate("/pricing")}>
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* ── THE MAIN BUTTON ─────────────────────────────────────────────── */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 sm:p-8 text-center shadow-xl shadow-primary/5">
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
            className="bg-primary hover:bg-primary/90 text-white border-0 text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
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
        </div>

        {/* Email Accounts */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Connected Accounts
              </h2>
            </div>
          </div>

          {emailAccounts && emailAccounts.length > 0 ? (
            <div className="space-y-2 mb-3">
              {emailAccounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${acc.isActive ? "bg-green-400" : "bg-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{acc.emailAddress}</p>
                      <p className="text-xs text-muted-foreground capitalize">{acc.provider}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-red-400 flex-shrink-0 p-1.5"
                    onClick={() => disconnectAccount.mutate({ accountId: acc.id })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No email accounts connected yet.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-border/60 text-foreground hover:border-primary/50 flex-1 text-xs"
              onClick={() => toast.info("Gmail OAuth — configure GOOGLE_CLIENT_ID in Settings → Secrets to enable.")}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Connect Gmail
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border/60 text-foreground hover:border-primary/50 flex-1 text-xs"
              onClick={() => toast.info("Outlook OAuth — configure MICROSOFT_CLIENT_ID in Settings → Secrets to enable.")}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Connect Outlook
            </Button>
          </div>
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
                      {inviteMember.isPending ? "Generating..." : "Generate Invite Link"}
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
                      { label: "Total Referrals", value: referralData.totalReferrals },
                      { label: "Credits Earned", value: `$${((referralData.creditsEarned ?? 0) / 100).toFixed(0)}` },
                      { label: "Available Credits", value: `$${((referralData.referralCredits ?? 0) / 100).toFixed(0)}` },
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
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 whitespace-nowrap text-xs"
              onClick={() => navigate("/pricing")}
            >
              View Team Plans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
