import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, Check, Mail, Phone, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function ConsentBox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-muted-foreground leading-relaxed">{children}</span>
    </label>
  );
}

export default function Contact() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consentNonMarketing, setConsentNonMarketing] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you shortly.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name."); return; }
    if (!email.trim()) { toast.error("Please enter your email address."); return; }
    if (!message.trim() || message.trim().length < 10) { toast.error("Please enter a message (at least 10 characters)."); return; }
    // consentPrivacy is optional — no longer required to submit

    submitMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      message: message.trim(),
      consentNonMarketing,
      consentMarketing,
      consentPrivacy,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <MessageSquare className="w-5 h-5 text-primary" />
            InboxBrief
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex" onClick={() => navigate("/pricing")}>Pricing</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex" onClick={() => navigate("/contact")}>Contact</Button>
            {isAuthenticated ? (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex" onClick={() => { window.location.href = getLoginUrl("/dashboard"); }}>Log In</Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0" onClick={() => { window.location.href = getLoginUrl("/onboarding"); }}>Start Free Trial</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 sm:pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Contact Us</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Have a question, need support, or want to learn more? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact info sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-base mb-5">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Email</p>
                      <a href="mailto:support@inboxbrief.org" className="text-sm text-foreground hover:text-primary transition-colors">
                        support@inboxbrief.org
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Service</p>
                      <p className="text-sm text-foreground">United States</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">SMS Support</p>
                      <p className="text-sm text-foreground">Reply HELP to any briefing message</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-base mb-3">Response Time</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We typically respond within 1 business day. For urgent account issues, include your registered email address in the message.
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Message Sent!</h2>
                  <p className="text-muted-foreground mb-6">Thank you for reaching out. We'll get back to you at <strong className="text-foreground">{email}</strong> within 1 business day.</p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setPhone(""); setMessage(""); setConsentNonMarketing(false); setConsentMarketing(false); setConsentPrivacy(false); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
                  <h2 className="font-semibold text-base mb-1">Send a Message</h2>

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <Input
                        placeholder="Jane Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-input border-border"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-input border-border"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Mobile Number <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <Textarea
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-input border-border min-h-[120px] resize-y"
                      required
                    />
                  </div>

                  {/* Consent checkboxes */}
                  <div className="space-y-4 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Consent</p>

                    {/* Non-marketing consent */}
                    <ConsentBox checked={consentNonMarketing} onChange={setConsentNonMarketing}>
                      I agree to receive non-marketing SMS messages from InboxBrief, regarding account setup, onboarding, inbox briefings, scheduling preferences, subscription management, security alerts, billing notifications, technical support, service updates and customer support communications. Message frequency may vary. Reply "HELP" for assistance or "STOP" to unsubscribe. Standard message and data rates may apply.
                    </ConsentBox>

                    {/* Marketing consent */}
                    <ConsentBox checked={consentMarketing} onChange={setConsentMarketing}>
                      I agree to receive marketing SMS messages from InboxBrief, regarding promotional offers, discounts, and related marketing communications. Message frequency may vary. Reply "HELP" for assistance or "STOP" to unsubscribe. Standard message and data rates may apply.
                    </ConsentBox>

                    {/* Privacy + Terms */}
                    <ConsentBox checked={consentPrivacy} onChange={setConsentPrivacy}>
                      By checking this box, I accept the{" "}
                      <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
                        Terms of Services
                      </Link>
.
                    </ConsentBox>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-white border-0"
                  >
                    {submitMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Fields marked <span className="text-red-400">*</span> are required.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/sms-opt-in" className="hover:text-foreground transition-colors">SMS Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
