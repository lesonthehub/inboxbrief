import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "May 20, 2026";
const CONTACT_EMAIL = "support@inboxbrief.org";

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {num}. {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-sm text-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            InboxBrief
          </button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto py-10 sm:py-16 px-4">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
            InboxBrief, ("InboxBrief", "we", "us", or "our") respects your privacy and is committed to protecting it through this Privacy Policy. This policy explains how we collect, use, disclose, and safeguard your information when you visit:{" "}
            <a href="https://inboxbrief.org/" className="text-primary underline underline-offset-2">https://inboxbrief.org/</a>{" "}
            or engage with our services, including SMS communications.
          </p>

          <Section num={1} title="Information We Collect">
            <p>We may collect the following information:</p>
            <p><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, mailing address.</p>
            <p><strong className="text-foreground">Mobile Information:</strong> Phone number provided for SMS communications.</p>
            <p><strong className="text-foreground">Usage Data:</strong> IP address, browser type, pages visited, time spent on pages.</p>
            <p><strong className="text-foreground">Cookies &amp; Tracking Data:</strong> See Section 6 below.</p>
          </Section>

          <Section num={2} title="How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and manage our services</li>
              <li>Communicate with you regarding your account or inquiries</li>
              <li>Send SMS messages you have opted into</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section num={3} title="SMS Communications & Consent">
            <p>
              By providing your mobile phone number and opting in, you expressly consent to receive automated and non-automated SMS messages from InboxBrief, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Customer support messages</li>
              <li>Service updates and notifications</li>
              <li>Appointment reminders</li>
              <li>Promotional and marketing messages</li>
            </ul>
            <p><strong className="text-foreground">Message Frequency:</strong> May vary.</p>
            <p><strong className="text-foreground">Message &amp; Data Rates:</strong> Standard message and data rates may apply.</p>
            <p><strong className="text-foreground">Opt-Out:</strong> You may opt out at any time by replying <strong className="text-foreground">STOP</strong> to any message. Reply <strong className="text-foreground">HELP</strong> for assistance.</p>
            <p><strong className="text-foreground">Consent Not Required for Purchase:</strong> Your consent to receive SMS messages is not a condition of purchasing any goods or services.</p>
          </Section>

          <Section num={4} title="Sharing of Information">
            <p>
              We do not sell, rent, or share your personal information with third-party companies for their marketing purposes.
            </p>
            <p>
              No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service, is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
            </p>
          </Section>

          <Section num={5} title="Data Security">
            <p>
              We implement reasonable administrative, technical, and physical safeguards designed to protect your information. However, no method of transmission over the internet is 100% secure.
            </p>
          </Section>

          <Section num={6} title="Cookies & Tracking Technologies">
            <p>We use cookies and similar tracking technologies to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Analyze website traffic and usage</li>
              <li>Improve user experience</li>
              <li>Understand user behavior</li>
            </ul>
            <p>
              You may control cookie settings through your browser preferences. Disabling cookies may affect website functionality.
            </p>
          </Section>

          <Section num={7} title="Your Rights & Choices">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, correct, or delete your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw SMS consent at any time by replying STOP</li>
            </ul>
            <p>To exercise these rights, contact us using the information below.</p>
          </Section>

          <Section num={8} title="Children's Privacy">
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect information from minors.
            </p>
          </Section>

          <Section num={9} title="Contact Us">
            <p>If you have questions about this Privacy Policy or our SMS practices, contact us at:</p>
            <p>
              <strong className="text-foreground">Email:</strong>{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>
            </p>
            <p>
              Or use our{" "}
              <a href="/contact" className="text-primary underline underline-offset-2">Contact Us page</a>.
            </p>
          </Section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</a>
            <a href="/sms-opt-in" className="hover:text-foreground transition-colors underline underline-offset-2">SMS Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors underline underline-offset-2">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
