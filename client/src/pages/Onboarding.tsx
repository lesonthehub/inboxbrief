import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, loginWithWarmUp } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield, MessageSquare, ChevronRight, ChevronLeft, Check,
  Building2, Users, Inbox, Phone, Gift, Globe
} from "lucide-react";

type UserRole = "solo_owner" | "team_lead" | "executive" | "operations" | "other";
type TeamSize = "just_me" | "2_5" | "6_15" | "16_plus";
type InboxChallenge = "missing_leads" | "client_follow_up" | "too_much_volume" | "team_coordination";

const STEPS = [
  {
    id: 1,
    icon: Building2,
    title: "What best describes your role?",
    subtitle: "This helps us understand your business context and surface the most relevant emails for you.",
  },
  {
    id: 2,
    icon: Users,
    title: "How many people are on your team?",
    subtitle: "We'll recommend the right plan and configure briefings that work for your team size.",
  },
  {
    id: 3,
    icon: Inbox,
    title: "What's your biggest inbox challenge?",
    subtitle: "We'll tune your briefings to solve the exact problem costing you time and money.",
  },
  {
    id: 4,
    icon: Globe,
    title: "What language should your briefings be in?",
    subtitle: "Your SMS briefings will be delivered in this language, regardless of what language your emails are written in.",
  },
];

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: "solo_owner", label: "Solo Business Owner", desc: "I run the show — every email matters" },
  { value: "team_lead", label: "Team Lead / Manager", desc: "I oversee a team and need visibility" },
  { value: "executive", label: "Executive / Director", desc: "High-level decisions, low inbox time" },
  { value: "operations", label: "Operations / Admin", desc: "I manage workflows and communications" },
  { value: "other", label: "Other", desc: "Something else entirely" },
];

const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string; desc: string; recommended: string }[] = [
  { value: "just_me", label: "Just Me", desc: "Solo proprietor or freelancer", recommended: "Solo plan" },
  { value: "2_5", label: "2–5 people", desc: "Small team or partnership", recommended: "Pro plan" },
  { value: "6_15", label: "6–15 people", desc: "Growing small business", recommended: "Business plan" },
  { value: "16_plus", label: "16+ people", desc: "Established organization", recommended: "Enterprise plan" },
];

const CHALLENGE_OPTIONS: { value: InboxChallenge; label: string; desc: string }[] = [
  { value: "missing_leads", label: "Missing Leads & Inquiries", desc: "New clients reach out but I don't respond fast enough" },
  { value: "client_follow_up", label: "Client Follow-Up Delays", desc: "Existing clients wait too long for replies" },
  { value: "too_much_volume", label: "Inbox Overwhelm", desc: "Too many emails — I can't find what matters" },
  { value: "team_coordination", label: "Team Communication Gaps", desc: "Important team emails get lost in the noise" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "pt", label: "Português", flag: "🇧🇷" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
];

const BUSINESS_TYPES = [
  "Real Estate", "Consulting", "Freelance / Creative", "Retail / E-commerce",
  "Legal / Accounting", "Healthcare", "Construction / Trades", "Marketing Agency",
  "Financial Services", "Restaurant / Food", "Fitness / Wellness", "Other",
];

export default function Onboarding() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0); // 0 = business type intro
  const [businessType, setBusinessType] = useState("");
  const [customBusiness, setCustomBusiness] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [inboxChallenge, setInboxChallenge] = useState<InboxChallenge | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const { data: onboardingStatus } = trpc.onboarding.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const validateCode = trpc.referral.validateCode.useQuery(
    { code: referralCode },
    { enabled: referralCode.length >= 6 }
  );

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: (data) => {
      toast.success("Welcome to InboxBrief! Your 7-day free trial has started.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithWarmUp("/onboarding");
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (onboardingStatus?.onboardingComplete) {
      navigate("/dashboard");
    }
  }, [onboardingStatus]);

  const totalSteps = 5; // business type + 3 qualifying questions + language/phone
  const currentProgress = step === 0 ? 1 : step + 1;

  const handleNext = () => {
    if (step === 0 && !businessType) {
      toast.error("Please select your business type");
      return;
    }
    if (step === 1 && !userRole) {
      toast.error("Please select your role");
      return;
    }
    if (step === 2 && !teamSize) {
      toast.error("Please select your team size");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const validatePhone = (val: string) => {
    if (!val.trim()) return ""; // optional
    const digits = val.replace(/\D/g, "");
    if (digits.length < 10) return "Please enter a valid 10-digit phone number";
    return "";
  };

  const handleSubmit = () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    if (phone.trim() && !smsConsent) { toast.error("Please agree to receive SMS briefings to continue."); return; }
    if (!userRole || !teamSize || !inboxChallenge) return;

    const finalBusiness = businessType === "Other" ? customBusiness || "Other" : businessType;

    completeMutation.mutate({
      phone: phone.trim() ? phone.replace(/\D/g, "") : undefined,
      businessType: finalBusiness,
      userRole,
      teamSize,
      inboxChallenge,
      preferredLanguage,
      referralCode: referralCode.toUpperCase() || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepData = step > 0 ? STEPS[step - 1] : null;
  const StepIcon = currentStepData?.icon ?? Building2;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/40 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span className="hidden sm:inline">Data Encrypted</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  i < currentProgress ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {currentProgress} of {totalSteps}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-card border border-border/40 rounded-2xl p-6 sm:p-8 shadow-xl">

            {/* Step 0: Business Type */}
            {step === 0 && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  What type of business do you run?
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  This helps us understand your email context and prioritize the right messages.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt}
                      onClick={() => setBusinessType(bt)}
                      className={`p-3 rounded-xl text-sm text-left transition-all border ${
                        businessType === bt
                          ? "border-primary bg-primary/15 text-foreground font-medium"
                          : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
                {businessType === "Other" && (
                  <Input
                    placeholder="Describe your business..."
                    value={customBusiness}
                    onChange={(e) => setCustomBusiness(e.target.value)}
                    className="mt-3 bg-input border-border"
                  />
                )}
              </>
            )}

            {/* Step 1: Role (Q1) */}
            {step === 1 && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  <StepIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {currentStepData?.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">{currentStepData?.subtitle}</p>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setUserRole(opt.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                        userRole === opt.value
                          ? "border-primary bg-primary/15"
                          : "border-border/50 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      {userRole === opt.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Team Size (Q2) */}
            {step === 2 && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  <StepIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {currentStepData?.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">{currentStepData?.subtitle}</p>
                <div className="space-y-2">
                  {TEAM_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTeamSize(opt.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                        teamSize === opt.value
                          ? "border-primary bg-primary/15"
                          : "border-border/50 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary/70 font-medium hidden sm:block">{opt.recommended}</span>
                        {teamSize === opt.value && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: Inbox Challenge (Q3) */}
            {step === 3 && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  <Inbox className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {currentStepData?.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">{currentStepData?.subtitle}</p>

                <div className="space-y-2 mb-6">
                  {CHALLENGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setInboxChallenge(opt.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                        inboxChallenge === opt.value
                          ? "border-primary bg-primary/15"
                          : "border-border/50 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      {inboxChallenge === opt.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

              </>
            )}

            {/* Step 4: Language + Phone + Referral */}
            {step === 4 && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {STEPS[3].title}
                </h2>
                <p className="text-muted-foreground text-sm mb-5">{STEPS[3].subtitle}</p>

                {/* Language selection */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => setPreferredLanguage(lang.value)}
                      className={`p-3 rounded-xl text-left transition-all border flex items-center gap-2 ${
                        preferredLanguage === lang.value
                          ? "border-primary bg-primary/15"
                          : "border-border/50 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium text-foreground">{lang.label}</span>
                      {preferredLanguage === lang.value && (
                        <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Phone number */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Your mobile number for SMS briefings <span className="text-muted-foreground font-normal">(optional — add later in Settings)</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000 — skip to add later"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    className={`bg-input border-border ${phoneError ? "border-red-500" : ""}`}
                  />
                  {phoneError && <p className="text-xs text-red-400 mt-1">{phoneError}</p>}
                </div>

                {/* SMS Consent — required for Twilio 10DLC compliance */}
                <div className="mt-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setSmsConsent(!smsConsent)}
                      className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                        smsConsent
                          ? "bg-primary border-primary"
                          : "border-border group-hover:border-primary/60"
                      }`}
                    >
                      {smsConsent && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      I agree to receive automated SMS briefings from InboxBrief at the number above. Message frequency varies based on your schedule (typically 1–3 msgs/day). Msg &amp; data rates may apply. Reply <strong className="text-foreground">STOP</strong> to cancel, <strong className="text-foreground">HELP</strong> for help. View our{" "}
                      <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2">Privacy Policy</a>{" "}and{" "}
                      <a href="/terms" target="_blank" className="text-primary underline underline-offset-2">Terms of Service</a>.
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground pl-6">Outbound only — replies and calls are not accepted.</p>
                </div>

                {/* Referral code (collapsible) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowReferral(!showReferral)}
                    className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Have a referral code? (optional)
                  </button>
                  {showReferral && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="bg-input border-border uppercase"
                        maxLength={16}
                      />
                      {referralCode.length >= 6 && (
                        <p className={`text-xs mt-1 ${validateCode.data?.valid ? "text-green-400" : "text-muted-foreground"}`}>
                          {validateCode.isLoading ? "Checking..." :
                            validateCode.data?.valid
                              ? `Valid code from ${validateCode.data.referrerName ?? "a friend"}`
                              : "Code not found"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white px-6">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={completeMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white px-6"
                >
                  {completeMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Start Free Trial
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Trial notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Your 7-day free trial includes full access to all features. No credit card required to start.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
