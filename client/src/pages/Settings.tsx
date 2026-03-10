import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, MessageSquare, ArrowLeft, User, Bell, CreditCard, Lock } from "lucide-react";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "Europe/London",
  "Europe/Paris", "Asia/Tokyo", "Australia/Sydney",
];

export default function Settings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: subStatus } = trpc.subscription.getStatus.useQuery(undefined, { enabled: isAuthenticated });

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.settings.get.invalidate();
      setSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl("/settings");
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (settings) {
      setPhone(settings.phone ?? "");
      setTimezone(settings.timezone ?? "America/Chicago");
    }
  }, [settings]);

  const handleSave = () => {
    setSaving(true);
    updateSettings.mutate({ phone, timezone });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planName = subStatus?.plan === "trial" ? "Business Trial" : (subStatus?.planDetails?.name ?? "No Plan");
  const trialDaysLeft = subStatus?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subStatus.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
            </div>
          </button>
          <div className="encrypted-badge px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Data Encrypted
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Settings</h1>

        {/* Account Info */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Account</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <p className="text-sm text-foreground font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <p className="text-sm text-foreground font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>SMS & Notifications</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mobile Number</label>
              <Input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">US numbers only. This is where your briefings are delivered.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Used to schedule automated briefings at the right local time.</p>
            </div>
            <Button
              className="btn-primary-glow text-white border-0"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Subscription</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
              <div>
                <p className="font-medium text-foreground text-sm">{planName}</p>
                <p className="text-xs text-muted-foreground">
                  {subStatus?.isActive ? (
                    subStatus.plan === "trial" && trialDaysLeft !== null
                      ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}`
                      : subStatus.currentPeriodEnd
                        ? `Renews ${new Date(subStatus.currentPeriodEnd).toLocaleDateString()}`
                        : "Active"
                  ) : "Inactive"}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                subStatus?.isActive
                  ? "text-green-400 bg-green-400/10 border-green-400/30"
                  : "text-muted-foreground bg-muted/30 border-border/50"
              }`}>
                {subStatus?.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex gap-3">
              {!subStatus?.isActive || subStatus.plan === "trial" ? (
                <Button
                  className="btn-primary-glow text-white border-0 flex-1"
                  onClick={() => navigate("/pricing")}
                >
                  {subStatus?.plan === "trial" ? "Upgrade Plan" : "Choose a Plan"}
                </Button>
              ) : null}
              {subStatus?.hasStripeSubscription && (
                <Button
                  variant="outline"
                  className="border-border/60 text-muted-foreground hover:text-foreground bg-transparent flex-1"
                  onClick={() => createPortal.mutate({ origin: window.location.origin })}
                  disabled={createPortal.isPending}
                >
                  {createPortal.isPending ? "Loading..." : "Manage Billing"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Security & Privacy</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Encryption", value: "AES-256-GCM at rest", badge: "Active" },
              { label: "Email token storage", value: "Encrypted before database write", badge: "Secure" },
              { label: "Plaintext retention", value: "Zero — wiped after summarization", badge: "Zero" },
              { label: "SMS delivery", value: "Twilio encrypted transport", badge: "TLS 1.3" },
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{value}</p>
                </div>
                <span className="encrypted-badge px-2 py-0.5 rounded-full text-xs font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
