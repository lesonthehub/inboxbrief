import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, MessageSquare, Check, Star, Zap, ArrowLeft } from "lucide-react";

const PLAN_DETAILS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$9",
    period: "/month",
    tagline: "Perfect for light inboxes",
    emailLimit: "50 emails/briefing",
    smsPerDay: "Up to 3 SMS/day",
    features: [
      "50 emails read per briefing",
      "3 SMS briefings per day",
      "Gmail integration",
      "AI priority classification",
      "Manual & daily schedule",
      "AES-256-GCM encryption",
    ],
    highlighted: false,
    badge: null,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$19",
    period: "/month",
    tagline: "The sweet spot for most businesses",
    emailLimit: "200 emails/briefing",
    smsPerDay: "Up to 6 SMS/day",
    features: [
      "200 emails read per briefing",
      "6 SMS briefings per day",
      "Gmail & Outlook integration",
      "AI priority classification",
      "Custom schedule (3x/day)",
      "AES-256-GCM encryption",
      "Briefing history log",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "business" as const,
    name: "Business",
    price: "$39",
    period: "/month",
    tagline: "Unlimited power for high-volume inboxes",
    emailLimit: "Unlimited emails",
    smsPerDay: "Up to 10 SMS/day",
    features: [
      "Unlimited emails per briefing",
      "10 SMS briefings per day",
      "Gmail & Outlook integration",
      "AI priority classification",
      "Custom schedule (6x/day)",
      "AES-256-GCM encryption",
      "Full history & analytics",
      "Priority support",
    ],
    highlighted: false,
    badge: "Free 7-Day Trial",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSelectPlan = (planId: "starter" | "pro" | "business") => {
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
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
            </div>
          </button>
          {isAuthenticated && (
            <Button size="sm" className="btn-primary-glow text-white border-0" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-10 px-4 text-center">
        <div className="container max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Start with a free 7-day Business trial — no card required</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Every plan includes AES-256-GCM encryption, AI triage, and SMS delivery. Pick the volume that fits your inbox.
          </p>
        </div>
      </section>

      {/* Free Trial Banner */}
      <div className="px-4 mb-10">
        <div className="container max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-6 glow-indigo flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Try Business free for 7 days
                </p>
                <p className="text-sm text-muted-foreground">
                  Unlimited emails, 10 SMS/day, full features. No credit card needed.
                </p>
              </div>
            </div>
            <Button className="btn-primary-glow text-white border-0 whitespace-nowrap" onClick={handleStartTrial}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="px-4 pb-20">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_DETAILS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col relative ${
                  plan.highlighted ? "tier-card-highlighted" : "tier-card-normal"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    plan.badge === "Free 7-Day Trial"
                      ? "bg-green-500/20 border border-green-500/40 text-green-400"
                      : "bg-primary text-white"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-xl text-foreground mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.tagline}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {plan.emailLimit}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
                      {plan.smsPerDay}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={plan.highlighted ? "btn-primary-glow text-white border-0 w-full" : "w-full border-border/60 text-foreground hover:border-primary/50 bg-transparent"}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending && createCheckout.variables?.plan === plan.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
            Test payments: use card <span className="font-mono text-foreground">4242 4242 4242 4242</span> · Any future date · Any CVC
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Common questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "What happens after my trial ends?", a: "You'll be prompted to choose a paid plan. If you don't subscribe, briefings will pause — your data stays encrypted and safe." },
              { q: "Can I change plans later?", a: "Yes, upgrade or downgrade anytime from your dashboard. Changes take effect at the next billing cycle." },
              { q: "What does 'emails per briefing' mean?", a: "Each time a briefing runs, we fetch up to your plan's limit of unread emails, classify them, and summarize. Higher tiers read more emails per run." },
              { q: "Is my email data stored?", a: "Never in plaintext. Email snippets are processed in-memory for AI summarization, then the summary is AES-256-GCM encrypted before storage." },
            ].map(({ q, a }) => (
              <div key={q} className="glass-card rounded-xl p-5">
                <p className="font-semibold text-foreground mb-2 text-sm">{q}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>All data encrypted at rest with AES-256-GCM · InboxBrief by 16 Star Collective</span>
        </div>
      </footer>
    </div>
  );
}
