import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { googleLoginWithWarmUp } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Shield, Zap, Clock, MessageSquare, Lock, ChevronRight,
  Star, CheckCircle, Globe, Users, Gift, RefreshCw,
  Plug, BrainCircuit, Smartphone, ArrowRight
} from "lucide-react";
import { PageFooter } from "@/components/PageFooter";

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Intelligent Email Triage",
    desc: "Your inbox is scanned automatically. Client leads, urgent requests, and key updates rise to the top — everything else is filtered out.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Natural SMS Briefings",
    desc: "Briefings sound like a trusted assistant wrote them: 'You have 3 applicants for the Manager role, 2 new client inquiries, and 1 invoice due Friday.'",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Your Schedule, Your Way",
    desc: "Set briefings to arrive with your morning coffee, after lunch, or tap the button on demand. You decide when you're informed.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Zero-Trust Encryption",
    desc: "AES-256-GCM encrypts every email snippet and access token before it touches our database. We never store your emails in plaintext.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Built for Teams Too",
    desc: "On Business and Enterprise plans, each team member gets their own personalized briefing on their own schedule — managed from one dashboard.",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    title: "Self-Adjusting Briefings",
    desc: "Rate each briefing and tell us what to change. More concise? More detail? Focus on invoices? Your briefings learn and adapt over time.",
  },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Real Estate Agent", quote: "I went from drowning in 200 emails to a 2-sentence text every morning. Game changer." },
  { name: "Marcus T.", role: "Freelance Consultant", quote: "Caught a $12k lead I would have missed buried in my inbox. Worth every penny." },
  { name: "Diane L.", role: "Boutique Owner", quote: "My VA used to do this. InboxBrief does it better, faster, and at a fraction of the cost." },
];

const LANGUAGES = [
  { flag: "🇺🇸", lang: "English" },
  { flag: "🇪🇸", lang: "Español" },
  { flag: "🇫🇷", lang: "Français" },
  { flag: "🇩🇪", lang: "Deutsch" },
  { flag: "🇧🇷", lang: "Português" },
  { flag: "🇯🇵", lang: "日本語" },
  { flag: "🇨🇳", lang: "中文" },
  { flag: "🇸🇦", lang: "العربية" },
];

const SMS_EXAMPLES = [
  {
    lang: "English",
    flag: "🇺🇸",
    text: "You have 3 applicants for the Store Manager role, 2 new client inquiries, and a contract renewal from Apex Corp due Friday. 14 general emails filtered.",
  },
  {
    lang: "Español",
    flag: "🇪🇸",
    text: "Tienes 3 candidatos para el puesto de Gerente, 2 nuevas consultas de clientes, y una renovación de contrato de Apex Corp con vencimiento el viernes.",
  },
  {
    lang: "Français",
    flag: "🇫🇷",
    text: "Vous avez 3 candidats pour le poste de Directeur, 2 nouvelles demandes clients, et un renouvellement de contrat d'Apex Corp à rendre vendredi.",
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeSmsLang, setActiveSmsLang] = useState(0);

  // Check if the logged-in user has already used their trial
  const { data: subStatus } = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isActive = subStatus?.isActive ?? false;
  // trialAlreadyUsed: user has used the trial but doesn't have an active plan
  const trialAlreadyUsed = !!(subStatus?.trialUsed) && !isActive;
  // hideTrialCopy: any logged-in user (active or not) should not see trial marketing
  const hideTrialCopy = isAuthenticated;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      googleLoginWithWarmUp("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex text-xs"
              onClick={() => navigate("/pricing")}
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex text-xs"
              onClick={() => navigate("/contact")}
            >
              Contact
            </Button>
            {isAuthenticated ? (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white border-0 text-xs"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hidden sm:inline-flex text-xs"
                  onClick={() => { googleLoginWithWarmUp("/dashboard"); }}
                >
                  Log In
                </Button>
                {!trialAlreadyUsed ? (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white border-0 text-xs px-3"
                    onClick={handleGetStarted}
                  >
                    Start Free Trial
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white border-0 text-xs px-3"
                    onClick={() => navigate("/pricing")}
                  >
                    Choose a Plan
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="container text-center max-w-4xl mx-auto">
          {!hideTrialCopy && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Star className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span>1 week free — full access, no card required</span>
          </div>
          )}
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-5 sm:mb-6"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
          >
            Your inbox,{" "}
            <span className="text-gradient">briefed to your phone</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            InboxBrief reads your Gmail or Outlook, filters out the noise, and texts you a natural-sounding briefing — encrypted end-to-end, delivered on your schedule, in your language.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full max-w-sm sm:max-w-none mx-auto">
            {isAuthenticated ? (
              // Logged-in users always go to Dashboard — never see trial CTA
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white border-0 text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
              </Button>
            ) : trialAlreadyUsed ? (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white border-0 text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 rounded-xl"
                onClick={() => navigate("/pricing")}
                disabled={loading}
              >
                💬 Choose a Plan
                <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white border-0 text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 rounded-xl"
                onClick={handleGetStarted}
                disabled={loading}
              >
                💬 Start Free — 7 Days Full Access
                <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
              </Button>
            )}
            {!isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 h-auto border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 bg-transparent w-full sm:w-auto rounded-xl"
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /><span>AES-256-GCM Encrypted</span></div>
            {!hideTrialCopy && <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /><span>No credit card for trial</span></div>}
            <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /><span>8 languages supported</span></div>
          </div>
          {!isAuthenticated && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground mb-1">Sign in to get started</p>
              <SocialLoginButtons returnPath="/dashboard" direction="col" />
            </div>
          )}
        </div>
      </section>

      {/* SMS Preview — multi-language switcher */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container max-w-lg mx-auto">
          <p className="text-center text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Example briefing</p>

          {/* Language tabs */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            {SMS_EXAMPLES.map((ex, i) => (
              <button
                key={ex.lang}
                onClick={() => setActiveSmsLang(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeSmsLang === i
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span>{ex.flag}</span>
                <span>{ex.lang}</span>
              </button>
            ))}
          </div>

          <div className="bg-card border border-border/40 rounded-2xl p-5 sm:p-6 shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">InboxBrief</p>
                <p className="text-xs text-muted-foreground">Today, 8:02 AM</p>
              </div>
              <div className="ml-auto flex items-center gap-1 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-full text-xs font-medium text-green-400">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Encrypted</span>
              </div>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 sm:p-4 text-sm text-foreground leading-relaxed border border-primary/20 min-h-[80px] transition-all">
              {SMS_EXAMPLES[activeSmsLang].text}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {SMS_EXAMPLES[activeSmsLang].flag} Delivered in {SMS_EXAMPLES[activeSmsLang].lang} · Under 320 characters · 1 SMS
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 bg-card/20 border-y border-border/30">
        <div className="container">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary/80 mb-3">How It Works</span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Three steps to a <span className="text-gradient">smarter inbox</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Set up once in under two minutes. Your briefings start arriving the same day.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center px-4 sm:px-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
              >
                <Plug className="w-7 h-7 text-white" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary mb-3">
                1
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Connect Your Inbox
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Link your Gmail or Outlook account with one click. OAuth-secured — we never store your password.
              </p>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0 px-2">
              <ArrowRight className="w-6 h-6 text-primary/40" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center px-4 sm:px-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
              >
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary mb-3">
                2
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                AI Reads &amp; Filters
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our AI scans every email, scores priority, and distills your inbox into a short, human-sounding summary.
              </p>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0 px-2">
              <ArrowRight className="w-6 h-6 text-primary/40" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center px-4 sm:px-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
              >
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary mb-3">
                3
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Receive Your SMS Briefing
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A crisp text message lands on your phone at the time you choose — or tap the button on demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container">
          <div className="text-center mb-10 sm:mb-14">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Built for the <span className="text-gradient">solo operator</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              No IT team. No inbox zero obsession. Just the emails that actually move your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border/40 rounded-xl p-5 sm:p-6 hover:border-primary/40 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-3 sm:mb-4">
                  {f.icon}
                </div>
                <h3
                  className="font-semibold text-base sm:text-lg text-foreground mb-2"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-language section */}
      <section className="py-16 sm:py-20 px-4 bg-card/30 border-y border-border/40">
        <div className="container max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Briefings in your language
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Set your preferred language during onboarding and every briefing will be delivered in that language — no matter what language the emails were written in.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {LANGUAGES.map((l) => (
              <div
                key={l.lang}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/40 text-sm text-foreground"
              >
                <span>{l.flag}</span>
                <span>{l.lang}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">More languages added regularly based on user requests.</p>
        </div>
      </section>

      {/* Referral callout */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-card border border-border/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3
                className="font-bold text-lg sm:text-xl text-foreground mb-1"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Earn $5 for every referral
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Share your unique code with other small business owners. When they subscribe, you both get credit toward your next billing cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            What small business owners say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
                <div className="flex gap-0.5 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-3 sm:mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!hideTrialCopy && (
      <section className="py-16 sm:py-24 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <div className="bg-card border border-primary/20 rounded-2xl p-8 sm:p-10 shadow-xl shadow-primary/10">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Ready to reclaim your mornings?
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Start your free 7-day trial. Full access, no credit card, cancel anytime.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white border-0 text-sm sm:text-base px-6 sm:px-10 py-5 sm:py-6 h-auto w-full sm:w-auto shadow-lg shadow-primary/30 rounded-xl"
              onClick={handleGetStarted}
            >
              💬 Get My First Briefing Free
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Secured with AES-256-GCM encryption · Delivered via SMS · End-to-end encrypted
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      <PageFooter />
    </div>
  );
}
