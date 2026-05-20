import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, MessageSquare } from "lucide-react";

const TOS_VERSION = "4.0";
const EFFECTIVE_DATE = "May 20, 2026";
const TOS_PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_tos_v3_1bd41576.pdf";
const COMPANY = "InboxBrief";
const SERVICE = "InboxBrief";
const CONTACT_EMAIL = "support@inboxbrief.org";
const DOMAIN = "inboxbrief.org";

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Terms of Services
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-muted-foreground text-sm">
              Version {TOS_VERSION} · Effective {EFFECTIVE_DATE}
            </p>
            <a
              href={TOS_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-medium"
            >
              Download PDF ↗
            </a>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-foreground/90 leading-relaxed">

          {/* SMS Program sections from InboxBrief.txt — prepended before existing detailed terms */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>SMS Program Description</h2>
            <p className="text-muted-foreground text-sm mb-4">InboxBrief offers SMS messaging programs that may include:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm mb-4">
              <li>Account notifications</li>
              <li>Customer support communications</li>
              <li>Appointment reminders</li>
              <li>Promotional offers and updates (where consent is provided)</li>
            </ul>
            <p className="text-muted-foreground text-sm"><strong className="text-foreground">Opt-Out:</strong> Reply <strong className="text-foreground">STOP</strong> at any time to unsubscribe. Reply <strong className="text-foreground">HELP</strong> or contact: <a href="mailto:support@inboxbrief.org" className="text-primary hover:underline">support@inboxbrief.org</a></p>
            <p className="text-muted-foreground text-sm mt-2"><strong className="text-foreground">Message Frequency &amp; Costs:</strong> Message frequency may vary. Message and data rates may apply depending on your carrier plan.</p>
            <p className="text-muted-foreground text-sm mt-2"><strong className="text-foreground">Carrier Disclaimer:</strong> Wireless carriers are not liable for delayed or undelivered messages.</p>
            <p className="text-muted-foreground text-sm mt-2"><strong className="text-foreground">Eligibility:</strong> You must be at least 18 years old to participate in our SMS programs.</p>
          </section>

          <section>
            <p className="text-muted-foreground text-sm bg-card border border-border/40 rounded-xl p-4">
              <strong className="text-foreground">IMPORTANT — PLEASE READ CAREFULLY.</strong> These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and {COMPANY} ("Company," "we," "us," or "our") governing your access to and use of the {SERVICE} service, website, and all related features (collectively, the "Service"). By accessing the Service, completing onboarding, or making any purchase, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>1. Acceptance of Terms</h2>
            <p>By creating an account, completing the onboarding flow, clicking "I Agree," or otherwise accessing or using the Service, you represent that: (a) you are at least 18 years of age; (b) you have the legal authority to enter into this agreement; (c) you are not prohibited by any applicable law from using the Service; and (d) you agree to these Terms and our Privacy Policy, which is incorporated herein by reference.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>2. Description of Service</h2>
            <p>{SERVICE} is an automated email summarization and SMS delivery service. The Service connects to your designated email account(s), applies automated filtering and summarization, and delivers text message briefings to your registered phone number. The Service is provided on an "as-is" and "as-available" basis. We do not guarantee the accuracy, completeness, timeliness, or fitness for any particular purpose of any briefing delivered.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>3. Subscription, Billing, and Fees</h2>
            <p>Access to certain features requires a paid subscription. By subscribing, you authorize us to charge your payment method on a recurring monthly basis. All fees are stated in US dollars and are non-refundable except as expressly set forth herein or required by applicable law. We reserve the right to modify pricing with 30 days' advance notice. International SMS surcharges apply to phone numbers outside the United States and Canada; such surcharges are disclosed at checkout and reflect increased carrier costs. Your subscription will automatically renew unless cancelled before the renewal date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>4. Refund Policy</h2>
            <p>All subscription fees are non-refundable. We do not issue prorated refunds for partial months. If you cancel your subscription, you will retain access to the Service through the end of your current billing period. We may, at our sole discretion, issue a credit or refund in exceptional circumstances. To request a refund consideration, you must contact us directly at {CONTACT_EMAIL} within 7 days of the charge in question.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>5. Email Access and Data Processing</h2>
            <p>You grant {SERVICE} permission to access, read, and process emails from your connected email account(s) solely for the purpose of generating briefings. We do not sell, share, or use your email content for advertising. Email content is processed transiently — summaries are encrypted using AES-256-GCM before storage, and raw email content is not retained after processing. You are responsible for ensuring you have the right to grant us access to any email account you connect, including any shared or business accounts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>6. SMS Delivery</h2>
            <p>By providing a phone number, you consent to receive automated text messages from {SERVICE}. Standard message and data rates from your carrier may apply. We do not guarantee SMS delivery — carrier-level failures, number porting issues, and network conditions are outside our control. You may opt out of SMS delivery at any time by updating your settings or replying STOP to any message. We are not liable for any charges incurred by your carrier in connection with SMS delivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3 text-yellow-400" style={{ fontFamily: "Space Grotesk, sans-serif" }}>7. Disclaimer of Warranties</h2>
            <p className="font-medium">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, RELIABILITY, NON-INFRINGEMENT, OR UNINTERRUPTED ACCESS. WE DO NOT WARRANT THAT: (A) THE SERVICE WILL MEET YOUR REQUIREMENTS; (B) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (C) ANY BRIEFING WILL BE ACCURATE, COMPLETE, OR TIMELY; OR (D) ANY ERRORS WILL BE CORRECTED. YOU USE THE SERVICE ENTIRELY AT YOUR OWN RISK.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3 text-yellow-400" style={{ fontFamily: "Space Grotesk, sans-serif" }}>8. Limitation of Liability</h2>
            <p className="font-medium">TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO: LOSS OF PROFITS, LOSS OF DATA, LOSS OF BUSINESS OPPORTUNITIES, MISSED LEADS, MISSED COMMUNICATIONS, BUSINESS INTERRUPTION, OR ANY OTHER COMMERCIAL LOSS, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p className="mt-3 font-medium">IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT PAID BY YOU TO US IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) FIFTY US DOLLARS ($50.00).</p>
            <p className="mt-3">Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In such jurisdictions, our liability is limited to the maximum extent permitted by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>9. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless {COMPANY}, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; (d) your violation of any third-party rights, including email account terms of service; or (e) any content you provide to the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>10. Dispute Resolution — Mandatory Arbitration</h2>
            <p>ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL BE RESOLVED EXCLUSIVELY THROUGH BINDING INDIVIDUAL ARBITRATION, NOT IN COURT. You waive any right to participate in a class action lawsuit or class-wide arbitration. Arbitration shall be conducted by a mutually agreed-upon arbitrator under the rules of the American Arbitration Association (AAA). Before initiating arbitration, you must first contact us at {CONTACT_EMAIL} and attempt to resolve the dispute informally within 30 days. This arbitration clause does not apply to claims for injunctive relief or intellectual property disputes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions. Any dispute not subject to arbitration shall be brought exclusively in the state or federal courts located in Texas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>12. Account Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms, fraudulent activity, or for any other reason at our sole discretion. Upon termination, your right to use the Service ceases immediately. You may terminate your account at any time through the Settings page or by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>13. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our website and updating the effective date. Your continued use of the Service after such changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must discontinue use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>14. Third-Party Services</h2>
            <p>The Service integrates with third-party services including email providers (Gmail, Outlook), SMS carriers, and payment processors. We are not responsible for the availability, accuracy, or practices of any third-party service. Your use of third-party services is governed by their respective terms of service and privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>15. Contact</h2>
            <p>For questions, disputes, or concerns regarding these Terms, please contact us at: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>. We are committed to resolving issues promptly and fairly on a one-on-one basis.</p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
            <p>Terms of Service Version {TOS_VERSION} · {COMPANY} · {DOMAIN}</p>
            <p className="mt-1">Last updated: {EFFECTIVE_DATE}</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/40 py-6 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">© 2026 InboxBrief. All rights reserved.</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/enterprise")} className="hover:text-foreground transition-colors">Enterprise</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
