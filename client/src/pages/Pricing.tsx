import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, MessageSquare, Check, Star, Zap, ArrowLeft, Users, ChevronDown, ChevronUp } from "lucide-react";

type PlanId = "solo" | "pro" | "business" | "enterprise";

const PLAN_DETAILS: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  emailLimit: string;
  smsPerDay: string;
  seats: string;
  features: string[];
  highlighted: boolean;
  badge: string | null;
  teamNote?: string;
}[] = [
  {
    id: "solo",
    name: "Solo",
    price: "$9",
    period: "/month",
    tagline: "Built for solo proprietors",
    emailLimit: "25 emails/briefing",
    smsPerDay: "2 SMS/day",
    seats: "1 user",
    features: [
      "25 emails read per briefing",
      "2 SMS briefings per day",
      "Gmail integration",
      "Smart priority filtering",
      "Manual & scheduled delivery",
      "AES-256-GCM encryption",
    ],
    highlighted: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    tagline: "The sweet spot for active professionals",
    emailLimit: "75 emails/briefing",
    smsPerDay: "5 SMS/day",
    seats: "1 user",
    features: [
      "75 emails read per briefing",
      "5 SMS briefings per day",
      "Gmail & Outlook integration",
      "Smart priority filtering",
      "Custom SMS schedule",
      "Briefing history & feedback",
      "AES-256-GCM encryption",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "business",
    name: "Business",
    price: "$39",
    period: "/month",
    tagline: "Coordinated briefings for your whole team",
    emailLimit: "150 emails/briefing",
    smsPerDay: "10 SMS/day",
    seats: "Up to 5 members",
    features: [
      "150 emails read per briefing",
      "10 SMS briefings per day",
      "Up to 5 team members",
      "Gmail & Outlook integration",
      "Custom schedule per member",
      "Team briefing dashboard",
      "Briefing history & feedback",
      "AES-256-GCM encryption",
      "Priority support",
    ],
    highlighted: false,
    badge: "Best for Teams",
    teamNote: "Each team member receives their own personalized SMS briefing on their own schedule.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$79",
    period: "/month",
    tagline: "Unlimited scale for growing organizations",
    emailLimit: "Unlimited emails",
    smsPerDay: "Unlimited SMS",
    seats: "Unlimited members",
    features: [
      "Unlimited emails per briefing",
      "Unlimited SMS briefings/day",
      "Unlimited team members",
      "Gmail & Outlook integration",
      "Custom schedule per member",
      "Full briefing history & analytics",
      "AES-256-GCM encryption",
      "Dedicated support",
      "Custom onboarding",
    ],
    highlighted: false,
    badge: "Unlimited",
    teamNote: "Scale to your entire organization with no per-seat fees.",
  },
];

const FAQ = [
  {
    q: "What happens after my 7-day trial ends?",
    a: "You'll be prompted to choose a paid plan. If you don't subscribe, briefings will pause — your data stays encrypted and safe.",
  },
  {
    q: "How does the Business plan work for teams?",
    a: "Each team member you invite gets their own SMS briefing on their own schedule. The account owner manages the team from the dashboard. The plan covers up to 5 members total.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade anytime from your dashboard. Changes take effect at the next billing cycle.",
  },
  {
    q: "What does 'emails per briefing' mean?",
    a: "Each time a briefing runs, we fetch up to your plan's limit of unread emails since your last briefing, classify them by priority, and summarize them into a natural SMS message.",
  },
  {
    q: "Is my email data stored?",
    a: "Never in plaintext. Email snippets are processed in-memory for summarization, then the final summary is AES-256-GCM encrypted before storage. Your OAuth tokens are also encrypted.",
  },
  {
    q: "Can I set when I receive my briefings?",
    a: "Yes. From your dashboard settings you can choose manual-only, once daily (morning or evening), twice daily, or set custom times in your local timezone.",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSelectPlan = (planId: PlanId) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/pricing");
      return;
    }
    toast.info("Redirecting to secure checkout...");
    createCheckout.mutate({ plan: planId, origin: window.location.origin });
  };

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/onboarding");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold hidden sm:block" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
            </div>
          </button>
          {isAuthenticated ? (
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="border-border/60 text-foreground" onClick={handleStartTrial}>
              Start Free Trial
            </Button>
          )}
        </div>
      </nav>

      {/* Header */}
      <section className="pt-14 pb-8 px-4 text-center">
        <div className="container max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>7-day free trial — full access, no card required</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Every plan includes end-to-end encryption, intelligent email triage, and SMS delivery.
            Pick the volume that fits your inbox.
          </p>
        </div>
      </section>

      {/* Free Trial Banner */}
      <div className="px-4 mb-10">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-card border border-primary/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Try all features free for 7 days
                </p>
                <p className="text-sm text-muted-foreground">
                  Unlimited emails, unlimited SMS, full team features. No credit card needed.
                </p>
              </div>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-white border-0 whitespace-nowrap w-full sm:w-auto"
              onClick={handleStartTrial}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="px-4 pb-16">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLAN_DETAILS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 sm:p-6 flex flex-col relative ${
                  plan.highlighted
                    ? "bg-primary/10 border-2 border-primary shadow-xl shadow-primary/20"
                    : "bg-card border border-border/40"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    plan.badge === "Best for Teams"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      : plan.badge === "Unlimited"
                      ? "bg-violet-500/20 border border-violet-500/40 text-violet-400"
                      : "bg-primary text-white"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-bold text-lg text-foreground mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-3">{plan.tagline}</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>

                  {/* Key stats */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {plan.emailLimit}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
                      {plan.smsPerDay}
                    </span>
                    {(plan.id === "business" || plan.id === "enterprise") && (
                      <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.seats}
                      </span>
                    )}
                  </div>

                  {plan.teamNote && (
                    <p className="text-xs text-muted-foreground/70 mt-2 italic">{plan.teamNote}</p>
                  )}
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full text-sm ${
                    plan.highlighted
                      ? "bg-primary hover:bg-primary/90 text-white border-0"
                      : "border-border/60 text-foreground hover:border-primary/50 bg-transparent"
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending && createCheckout.variables?.plan === plan.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Test card note */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Test payments: use card <span className="font-mono text-foreground/70">4242 4242 4242 4242</span> · Any future date · Any CVC
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div key={q} className="bg-card border border-border/40 rounded-xl overflow-hidden">
                <button
                  className="w-full p-5 text-left flex items-center justify-between gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <p className="font-semibold text-foreground text-sm">{q}</p>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>All data encrypted at rest with AES-256-GCM</span>
          </div>
          <span className="hidden sm:block text-border">·</span>
          <span>InboxBrief by 16 Star Collective</span>
        </div>
      </footer>
    </div>
  );
}
