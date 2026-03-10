import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Zap, Clock, MessageSquare, Lock, ChevronRight, Star, CheckCircle } from "lucide-react";

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "AI-Powered Triage",
    desc: "Grok 3 reads your inbox and surfaces only what matters — client leads, urgent requests, and key updates.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "SMS in Seconds",
    desc: "One tap sends a crisp 1–2 message briefing to your phone. No app to open. No inbox to dread.",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Your Schedule",
    desc: "Set it to arrive with your morning coffee, after lunch, or on demand — you control when you're briefed.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Zero-Trust Encryption",
    desc: "AES-256-GCM encrypts every email snippet and token before it touches our database. We never store plaintext.",
  },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Real Estate Agent", quote: "I went from drowning in 200 emails to a 2-sentence text every morning. Game changer." },
  { name: "Marcus T.", role: "Freelance Consultant", quote: "Caught a $12k lead I would have missed buried in my inbox. Worth every penny." },
  { name: "Diane L.", role: "Boutique Owner", quote: "My VA used to do this. InboxBrief does it better, faster, and at a fraction of the cost." },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-indigo-sm">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground" style={{fontFamily:'Space Grotesk,sans-serif'}}>InboxBrief</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/pricing")}>Pricing</Button>
            {isAuthenticated ? (
              <Button size="sm" className="btn-primary-glow text-white border-0" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            ) : (
              <Button size="sm" className="btn-primary-glow text-white border-0" onClick={handleGetStarted}>Start Free Trial</Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>1 week free — Business tier, no card required</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{fontFamily:'Space Grotesk,sans-serif',letterSpacing:'-0.02em'}}>
            Your inbox,{" "}
            <span className="text-gradient">briefed to your phone</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            InboxBrief uses Grok AI to read your Gmail or Outlook, filter out the noise, and text you a crisp briefing — encrypted end-to-end, delivered on your schedule.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="btn-primary-glow text-white border-0 text-lg px-8 py-6 h-auto" onClick={handleGetStarted} disabled={loading}>
              💬 Start Free — 7 Days Business Access
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 bg-transparent" onClick={() => navigate("/pricing")}>
              View Plans
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-400" /><span>AES-256-GCM Encrypted</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /><span>No credit card for trial</span></div>
            <div className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-green-400" /><span>Zero plaintext storage</span></div>
          </div>
        </div>
      </section>

      {/* SMS Preview */}
      <section className="py-16 px-4">
        <div className="container max-w-lg mx-auto">
          <div className="glass-card rounded-2xl p-6 glow-indigo">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">InboxBrief</p>
                <p className="text-xs text-muted-foreground">Today, 8:02 AM</p>
              </div>
              <div className="ml-auto encrypted-badge px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Encrypted
              </div>
            </div>
            <div className="bg-primary/10 rounded-xl p-4 text-sm text-foreground leading-relaxed border border-primary/20">
              InboxBrief: 3 HP emails — Johnson & Co req. proposal by Fri; Maria Chen re: contract renewal; new lead from website form. 12 gen emails. (3 HP, 12 gen)
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">↑ Example briefing — 287 characters, 1 SMS</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{fontFamily:'Space Grotesk,sans-serif'}}>Built for the <span className="text-gradient">solo operator</span></h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">No IT team. No inbox zero obsession. Just the emails that actually move your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-xl p-6 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg text-foreground mb-2" style={{fontFamily:'Space Grotesk,sans-serif'}}>{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12" style={{fontFamily:'Space Grotesk,sans-serif'}}>What small business owners say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card rounded-xl p-6">
                <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}</div>
                <p className="text-foreground text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div><p className="font-semibold text-sm text-foreground">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-10 glow-indigo">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{fontFamily:'Space Grotesk,sans-serif'}}>Ready to reclaim your mornings?</h2>
            <p className="text-muted-foreground mb-8">Start your free 7-day Business trial. Full access, no credit card, cancel anytime.</p>
            <Button size="lg" className="btn-primary-glow text-white border-0 text-lg px-10 py-6 h-auto" onClick={handleGetStarted}>
              💬 Get My First Briefing Free
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Secured by AES-256-GCM · Powered by Grok 3 · Delivered by Twilio</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center"><MessageSquare className="w-3 h-3 text-primary" /></div>
            <span className="text-sm text-muted-foreground">InboxBrief · 16 Star Collective</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>All data encrypted at rest with AES-256-GCM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
