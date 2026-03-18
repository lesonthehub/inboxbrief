import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ArrowLeft, CheckCircle, Shield, Users, Zap, Lock, BarChart3, Headphones } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ENTERPRISE_FEATURES = [
  { icon: <Users className="w-5 h-5" />, title: "Unlimited Team Members", desc: "Every person on your team gets their own personalized briefing on their own schedule." },
  { icon: <Zap className="w-5 h-5" />, title: "Unlimited Briefings", desc: "No caps on emails read or SMS sent. Full coverage, all day." },
  { icon: <Lock className="w-5 h-5" />, title: "AES-256-GCM Encryption", desc: "End-to-end encryption on every email snippet and OAuth token." },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Analytics Dashboard", desc: "Full briefing history, engagement metrics, and team-level insights." },
  { icon: <Headphones className="w-5 h-5" />, title: "Dedicated Support", desc: "A real person who knows your account — not a ticket queue." },
  { icon: <Shield className="w-5 h-5" />, title: "SLA-Backed Uptime", desc: "Contractual uptime guarantees and priority incident response." },
];

export default function Enterprise() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "",
    useCase: "",
    message: "",
  });

  const contactMutation = trpc.enterprise.contact.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send. Please email us directly.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.teamSize) {
      toast.error("Please fill in all required fields.");
      return;
    }
    contactMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => navigate("/pricing")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Button>
        </div>
      </nav>

      <div className="container max-w-5xl mx-auto py-12 sm:py-20 px-4">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-5">
            <Shield className="w-3.5 h-3.5" />
            Enterprise Plan
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
          >
            Built for organizations that<br className="hidden sm:block" />
            <span className="text-gradient"> can't afford to miss a thing</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Custom pricing based on your team size, volume, and requirements. Tell us about your needs and we'll build a plan around you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Features */}
          <div>
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Everything in Business, plus:</h2>
            <div className="space-y-4">
              {ENTERPRISE_FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{f.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Message received!</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  We'll review your requirements and reach out within 1 business day to discuss a custom plan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-border/60 text-muted-foreground hover:text-foreground bg-transparent"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Contact our team</h3>
                  <p className="text-muted-foreground text-xs mb-5">We'll respond within 1 business day.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ent-name" className="text-xs text-muted-foreground">Full Name *</Label>
                    <Input
                      id="ent-name"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-background border-border/60 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ent-email" className="text-xs text-muted-foreground">Work Email *</Label>
                    <Input
                      id="ent-email"
                      type="email"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-background border-border/60 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ent-company" className="text-xs text-muted-foreground">Company Name *</Label>
                  <Input
                    id="ent-company"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="bg-background border-border/60 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Team Size *</Label>
                  <Select value={form.teamSize} onValueChange={v => setForm(f => ({ ...f, teamSize: v }))}>
                    <SelectTrigger className="bg-background border-border/60 text-sm">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6_15">6–15 people</SelectItem>
                      <SelectItem value="16_50">16–50 people</SelectItem>
                      <SelectItem value="51_200">51–200 people</SelectItem>
                      <SelectItem value="200_plus">200+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ent-usecase" className="text-xs text-muted-foreground">Primary Use Case</Label>
                  <Input
                    id="ent-usecase"
                    placeholder="e.g. Sales team lead tracking, executive briefings..."
                    value={form.useCase}
                    onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))}
                    className="bg-background border-border/60 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ent-message" className="text-xs text-muted-foreground">Anything else we should know?</Label>
                  <Textarea
                    id="ent-message"
                    placeholder="Special requirements, integrations, compliance needs..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="bg-background border-border/60 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white border-0 h-11"
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our{" "}
                  <button type="button" onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" onClick={() => navigate("/privacy")} className="text-primary hover:underline">Privacy Policy</button>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-border/40 py-6 px-4 mt-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">InboxBrief · 16 Star Collective</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
