import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, MessageSquare, Settings, LogOut, Plus, Trash2,
  Clock, CheckCircle, XCircle, AlertCircle, Zap, Mail,
  Calendar, RefreshCw, Lock
} from "lucide-react";

const SCHEDULE_OPTIONS = [
  { value: "manual", label: "Manual only", desc: "I'll tap the button when I want a briefing" },
  { value: "daily_morning", label: "Daily at 8 AM", desc: "One briefing every morning" },
  { value: "daily_evening", label: "Daily at 6 PM", desc: "One briefing every evening" },
  { value: "twice_daily", label: "Twice daily", desc: "8 AM and 5 PM every day" },
  { value: "custom", label: "Custom times", desc: "Set your own delivery times" },
];

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

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showSchedule, setShowSchedule] = useState(false);
  const [customTimes, setCustomTimes] = useState("");

  const utils = trpc.useUtils();

  const { data: subStatus, isLoading: subLoading } = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: emailAccounts, isLoading: accountsLoading } = trpc.emailAccounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: history, isLoading: historyLoading } = trpc.briefing.history.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });

  const triggerBriefing = trpc.briefing.trigger.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.smsSent
          ? `Briefing sent! ${result.highPriorityCount} high-priority, ${result.generalCount} general emails.`
          : `Briefing processed but SMS failed. Check your phone settings.`,
        { duration: 5000 }
      );
      utils.briefing.history.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      utils.settings.get.invalidate();
      setShowSchedule(false);
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
  const planName = subStatus?.plan === "trial" ? "Business Trial" : (subStatus?.planDetails?.name ?? "No Plan");
  const trialDaysLeft = subStatus?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subStatus.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

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

  const handleConnectGmail = () => {
    toast.info("Gmail OAuth — configure GOOGLE_CLIENT_ID in settings to enable.");
  };

  const handleConnectOutlook = () => {
    toast.info("Outlook OAuth — configure MICROSOFT_CLIENT_ID in settings to enable.");
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <nav className="border-b border-border/40 bg-background/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-indigo-sm">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Data Encrypted Badge */}
            <div className="hidden sm:flex items-center gap-1.5 encrypted-badge px-3 py-1.5 rounded-full text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              Data Encrypted
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        {/* Welcome + Plan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isActive ? `Active on ${planName}` : "No active subscription"}
              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <span className="ml-2 text-primary font-medium">· {trialDaysLeft} trial days left</span>
              )}
            </p>
          </div>
          {!isActive && (
            <Button size="sm" className="btn-primary-glow text-white border-0" onClick={() => navigate("/pricing")}>
              Choose a Plan
            </Button>
          )}
          {isActive && subStatus?.plan === "trial" && (
            <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => navigate("/pricing")}>
              Upgrade Plan
            </Button>
          )}
        </div>

        {/* ── THE MAIN BUTTON ─────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-8 text-center glow-indigo">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="encrypted-badge px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
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
            className="btn-primary-glow text-white border-0 text-xl px-10 py-7 h-auto w-full sm:w-auto"
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

        {/* Schedule Picker */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
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
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {SCHEDULE_OPTIONS.find(s => s.value === settings?.scheduleType)?.label ?? "Manual only"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {SCHEDULE_OPTIONS.find(s => s.value === settings?.scheduleType)?.desc}
                  {settings?.scheduleTimes && settings.scheduleType !== "manual" && (
                    <span className="ml-1 text-primary">· {settings.scheduleTimes}</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleScheduleChange(opt.value)}
                  disabled={updateSettings.isPending}
                  className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                    settings?.scheduleType === opt.value
                      ? "border-primary bg-primary/15"
                      : "border-border/50 bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {settings?.scheduleType === opt.value && (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
              {settings?.scheduleType === "custom" && (
                <div className="pt-2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Custom times (comma-separated HH:MM, e.g. 07:30,12:00,18:00)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={customTimes}
                      onChange={(e) => setCustomTimes(e.target.value)}
                      placeholder="08:00,13:00,18:00"
                      className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <Button
                      size="sm"
                      className="btn-primary-glow text-white border-0"
                      onClick={() => updateSettings.mutate({ scheduleType: "custom", scheduleTimes: customTimes })}
                      disabled={updateSettings.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connected Email Accounts */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Connected Accounts
              </h2>
            </div>
          </div>

          {accountsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : emailAccounts && emailAccounts.length > 0 ? (
            <div className="space-y-3">
              {emailAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{account.emailAddress}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.provider} · {account.lastFetchedAt
                          ? `Last fetched ${new Date(account.lastFetchedAt).toLocaleDateString()}`
                          : "Not yet fetched"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => disconnectAccount.mutate({ accountId: account.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mb-4">No email accounts connected yet.</p>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 bg-transparent flex items-center gap-2"
              onClick={handleConnectGmail}
            >
              <Plus className="w-3.5 h-3.5" />
              Connect Gmail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 bg-transparent flex items-center gap-2"
              onClick={handleConnectOutlook}
            >
              <Plus className="w-3.5 h-3.5" />
              Connect Outlook
            </Button>
          </div>
        </div>

        {/* Briefing History */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Briefing History
            </h2>
          </div>

          {historyLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SmsStatusBadge status={log.smsStatus} />
                      <span className="text-xs text-muted-foreground capitalize">{log.triggerType}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                      {log.highPriorityCount > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="w-3 h-3" />{log.highPriorityCount} HP
                        </span>
                      )}
                      <span>{log.generalCount} gen</span>
                    </div>
                  </div>
                  {log.summary && (
                    <p className="text-sm text-foreground/80 leading-relaxed bg-primary/5 rounded-lg p-3 border border-primary/10">
                      {log.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">No briefings yet. Tap the button above to get your first one.</p>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>All email data encrypted with AES-256-GCM · Zero plaintext storage</span>
        </div>
      </div>
    </div>
  );
}
