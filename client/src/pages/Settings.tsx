import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, MessageSquare, ArrowLeft, User, Bell, CreditCard, Lock, CheckCircle, Phone } from "lucide-react";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";

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
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: subStatus } = trpc.subscription.getStatus.useQuery(undefined, { enabled: isAuthenticated });

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.settings.get.invalidate();
      utils.subscription.getStatus.invalidate();
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
    const originalPhone = settings?.phone ?? "";
    // If phone number changed, require re-verification before saving
    if (phone !== originalPhone && phone.length >= 10) {
      setPendingPhone(phone);
      setShowPhoneVerification(true);
      setSaving(false);
      return;
    }
    updateSettings.mutate({ phone, timezone });
  };

  const handlePhoneVerified = () => {
    setShowPhoneVerification(false);
    // Save settings with the newly verified phone
    updateSettings.mutate({ phone: pendingPhone ?? phone, timezone });
    setPendingPhone(null);
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
  const isPhoneVerified = subStatus?.phoneVerified ?? false;
  const isInternational = phone && !phone.replace(/\D/g, "").startsWith("1");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Phone Verification Modal */}
      {showPhoneVerification && pendingPhone && (
        <PhoneVerificationModal
          open={showPhoneVerification}
          phone={pendingPhone}
          onVerified={handlePhoneVerified}
          onClose={() => {
            setShowPhoneVerification(false);
            setPendingPhone(null);
            setSaving(false);
          }}
        />
      )}

      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
            </div>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-3 py-1.5 rounded-full text-xs font-medium text-green-400">
            <Shield className="w-3.5 h-3.5" />
            Data Encrypted
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-2xl mx-auto space-y-5 px-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Settings</h1>

        {/* Account Info */}
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
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
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>SMS & Notifications</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mobile Number</label>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                />
                {isPhoneVerified && phone === (settings?.phone ?? "") && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Include country code for international numbers (e.g. +44 for UK).
                </p>
                {isPhoneVerified && phone === (settings?.phone ?? "") ? (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Verification required on save
                  </span>
                )}
              </div>
              {isInternational && (
                <div className="mt-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
                  <p className="text-xs text-indigo-300">
                    International number detected — a <strong>+$5/month</strong> surcharge applies to cover carrier costs outside the US/Canada.
                  </p>
                </div>
              )}
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
              className="bg-primary hover:bg-primary/90 text-white border-0"
              onClick={handleSave}
              disabled={saving || updateSettings.isPending}
            >
              {saving || updateSettings.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {!subStatus?.isActive || subStatus.plan === "trial" ? (
                <Button
                  className="bg-primary hover:bg-primary/90 text-white border-0 w-full sm:flex-1"
                  onClick={() => navigate("/pricing")}>
                  {subStatus?.plan === "trial" ? "Upgrade Plan" : "Choose a Plan"}
                </Button>
              ) : null}
              {subStatus?.hasStripeSubscription && (
                <Button
                  variant="outline"
                  className="border-border/60 text-muted-foreground hover:text-foreground bg-transparent w-full sm:flex-1"
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
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Security & Privacy</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Encryption", value: "AES-256-GCM at rest", badge: "Active" },
              { label: "Email token storage", value: "Encrypted before database write", badge: "Secure" },
              { label: "Plaintext retention", value: "Zero — wiped after summarization", badge: "Zero" },
              { label: "SMS delivery", value: "Encrypted transport (TLS 1.3)", badge: "TLS 1.3" },
              { label: "Phone verification", value: isPhoneVerified ? "Verified via OTP" : "Not yet verified", badge: isPhoneVerified ? "Verified" : "Pending" },
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

        {/* Legal */}
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Legal</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/terms" className="text-sm text-primary hover:underline">Terms of Service</a>
            <span className="text-muted-foreground">·</span>
            <a href="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
