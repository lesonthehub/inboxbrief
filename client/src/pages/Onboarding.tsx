import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, MessageSquare, ChevronRight, ChevronLeft, Check, Building2, Mail, Target } from "lucide-react";

type EmailVolume = "under_50" | "50_200" | "200_500" | "over_500";
type PrimaryGoal = "lead_tracking" | "client_updates" | "general_inbox" | "all_of_above";

const STEPS = [
  {
    id: 1,
    icon: <Building2 className="w-6 h-6" />,
    title: "What type of business do you run?",
    subtitle: "This helps Grok understand your email context and prioritize the right messages.",
  },
  {
    id: 2,
    icon: <Mail className="w-6 h-6" />,
    title: "How many emails do you receive daily?",
    subtitle: "We'll recommend the right plan to match your inbox volume.",
  },
  {
    id: 3,
    icon: <Target className="w-6 h-6" />,
    title: "What's your primary goal with InboxBrief?",
    subtitle: "We'll tune the AI to surface what matters most to you.",
  },
];

const EMAIL_VOLUME_OPTIONS: { value: EmailVolume; label: string; desc: string }[] = [
  { value: "under_50", label: "Under 50", desc: "Light inbox — Starter plan works great" },
  { value: "50_200", label: "50–200", desc: "Moderate volume — Pro plan recommended" },
  { value: "200_500", label: "200–500", desc: "High volume — Pro or Business plan" },
  { value: "over_500", label: "500+", desc: "Power user — Business plan required" },
];

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; desc: string }[] = [
  { value: "lead_tracking", label: "Track Leads & Inquiries", desc: "Never miss a potential client reaching out" },
  { value: "client_updates", label: "Client Project Updates", desc: "Stay on top of ongoing client communications" },
  { value: "general_inbox", label: "General Inbox Control", desc: "Tame the chaos and get a daily digest" },
  { value: "all_of_above", label: "All of the Above", desc: "Full business intelligence in one briefing" },
];

const BUSINESS_TYPES = [
  "Real Estate", "Consulting", "Freelance / Creative", "Retail / E-commerce",
  "Legal / Accounting", "Healthcare", "Construction / Trades", "Marketing Agency",
  "Financial Services", "Other",
];

export default function Onboarding() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [customBusiness, setCustomBusiness] = useState("");
  const [emailVolume, setEmailVolume] = useState<EmailVolume | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const { data: onboardingStatus } = trpc.onboarding.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Welcome to InboxBrief! Your 7-day Business trial has started.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl("/onboarding");
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (onboardingStatus?.onboardingComplete) {
      navigate("/dashboard");
    }
  }, [onboardingStatus]);

  const handleNext = () => {
    if (step === 1 && !businessType) {
      toast.error("Please select your business type");
      return;
    }
    if (step === 2 && !emailVolume) {
      toast.error("Please select your email volume");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length < 10) return "Please enter a valid 10-digit US phone number";
    return "";
  };

  const handleSubmit = () => {
    if (!primaryGoal) { toast.error("Please select your primary goal"); return; }
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    if (!emailVolume) return;

    const finalBusiness = businessType === "Other" ? customBusiness || "Other" : businessType;

    completeMutation.mutate({
      phone: phone.replace(/\D/g, ""),
      businessType: finalBusiness,
      emailVolume,
      primaryGoal,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground encrypted-badge px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          Data Encrypted
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s.id < step ? "bg-primary text-white" : s.id === step ? "bg-primary/20 border-2 border-primary text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {s.id < step ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {s.id < STEPS.length && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${s.id < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="glass-card rounded-2xl p-8">
            {/* Step header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                {currentStep.icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 mt-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {currentStep.title}
            </h2>
            <p className="text-muted-foreground text-sm mb-8">{currentStep.subtitle}</p>

            {/* Step 1: Business Type */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt}
                      onClick={() => setBusinessType(bt)}
                      className={`p-3 rounded-xl text-sm text-left transition-all border ${
                        businessType === bt
                          ? "border-primary bg-primary/15 text-foreground"
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
                    className="mt-3 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                )}
              </div>
            )}

            {/* Step 2: Email Volume */}
            {step === 2 && (
              <div className="space-y-3">
                {EMAIL_VOLUME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEmailVolume(opt.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                      emailVolume === opt.value
                        ? "border-primary bg-primary/15"
                        : "border-border/50 bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{opt.label} emails/day</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                    {emailVolume === opt.value && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Primary Goal + Phone */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPrimaryGoal(opt.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between ${
                        primaryGoal === opt.value
                          ? "border-primary bg-primary/15"
                          : "border-border/50 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      {primaryGoal === opt.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Your mobile number for SMS briefings
                  </label>
                  <Input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                  {phoneError && <p className="text-destructive text-xs mt-1">{phoneError}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    US numbers only. Standard SMS rates may apply.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button className="btn-primary-glow text-white border-0" onClick={handleNext}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="btn-primary-glow text-white border-0 px-6"
                  onClick={handleSubmit}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Starting trial...
                    </span>
                  ) : (
                    <>Start My Free Trial <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Trial badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
              <Shield className="w-4 h-4" />
              <span>7-day Business trial starts immediately — no card needed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
