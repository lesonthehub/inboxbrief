import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, MessageSquare } from "lucide-react";

const EFFECTIVE_DATE = "March 19, 2026";
const PRIVACY_VERSION = "2.0";
const PRIVACY_PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_privacy_b78b9176.pdf";
const COMPANY = "InboxBrief";
const SERVICE = "InboxBrief";
const CONTACT_EMAIL = "support@inboxbrief.com";

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => navigate(-1 as any)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto py-10 sm:py-16 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Privacy Policy
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-muted-foreground text-sm">
              Version {PRIVACY_VERSION} · Effective {EFFECTIVE_DATE}
            </p>
            <a
              href={PRIVACY_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium"
            >
              Download PDF ↗
            </a>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-foreground/90 leading-relaxed">

          <section>
            <p className="text-muted-foreground text-sm bg-card border border-border/40 rounded-xl p-4">
              {COMPANY} ("we," "us," or "our") operates {SERVICE}. This Privacy Policy explains how we collect, use, disclose, and protect your information. By using the Service, you consent to the practices described herein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>1. Information We Collect</h2>
            <p><strong>Account Information:</strong> Name, email address, phone number, and authentication credentials provided during registration.</p>
            <p className="mt-2"><strong>Onboarding Data:</strong> Business type, team size, and inbox challenge answers used to personalize your experience.</p>
            <p className="mt-2"><strong>Email Content (Transient):</strong> We access your connected email account to fetch and process emails. Raw email content is processed in memory only and is never stored in plaintext. Summaries are encrypted with AES-256-GCM before storage.</p>
            <p className="mt-2"><strong>OAuth Tokens:</strong> Access and refresh tokens for connected email accounts are encrypted with AES-256-GCM before storage.</p>
            <p className="mt-2"><strong>Usage Data:</strong> Briefing logs (metadata only — counts, timestamps, delivery status), feedback ratings, and schedule preferences.</p>
            <p className="mt-2"><strong>Payment Information:</strong> Payment processing is handled entirely by Stripe. We store only Stripe customer and subscription IDs — never card numbers or financial details.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>2. How We Use Your Information</h2>
            <p>We use your information to: (a) provide and improve the Service; (b) generate and deliver SMS briefings; (c) process payments and manage subscriptions; (d) send service-related communications; (e) personalize briefing tone and content based on your preferences; and (f) comply with legal obligations.</p>
            <p className="mt-2">We do not sell your personal information to third parties. We do not use your email content for advertising, profiling, or any purpose other than generating your briefings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>3. Data Retention</h2>
            <p>Account data is retained for the duration of your account and for up to 90 days after deletion. Encrypted briefing summaries are retained for up to 12 months to support your briefing history. OAuth tokens are deleted when you disconnect an email account. You may request deletion of your data at any time by contacting {CONTACT_EMAIL}.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>4. Data Security</h2>
            <p>We implement AES-256-GCM encryption for all sensitive stored data, including email summaries and OAuth tokens. Data is encrypted before it is written to our database. We use HTTPS for all data in transit. However, no security measure is 100% foolproof, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>5. Third-Party Sharing</h2>
            <p>We share data only with: (a) email providers (Google, Microsoft) as necessary to access your connected accounts; (b) Stripe for payment processing; (c) SMS carriers for message delivery; and (d) infrastructure providers (hosting, database) under data processing agreements. We do not share your data with advertisers or data brokers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to: access, correct, delete, or export your personal data; withdraw consent; and lodge a complaint with a supervisory authority. To exercise these rights, contact us at {CONTACT_EMAIL}.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>7. Cookies</h2>
            <p>We use session cookies for authentication only. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>8. Contact</h2>
            <p>For privacy inquiries: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
            <p>{COMPANY} · Last updated: {EFFECTIVE_DATE}</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/40 py-6 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">© 2026 InboxBrief. All rights reserved.</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
