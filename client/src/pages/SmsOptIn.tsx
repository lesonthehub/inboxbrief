import { useState } from "react";
import { Link } from "wouter";
import { MessageSquare, Check, Shield, Clock, Phone } from "lucide-react";
import { PageFooter } from "@/components/PageFooter";

export default function SmsOptIn() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <MessageSquare className="w-5 h-5 text-primary" />
            InboxBrief
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Phone className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">SMS Briefing Service</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            InboxBrief sends you a concise AI-generated summary of your most important emails — delivered as an SMS to your phone on a schedule you choose.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            How SMS Briefings Work
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p>You connect your Gmail or Outlook inbox during account setup at <a href="https://inboxbrief.org/onboarding" className="text-primary underline underline-offset-2">inboxbrief.org/onboarding</a>.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p>You choose a delivery schedule (morning, afternoon, or both) and the types of emails you care about.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <p>InboxBrief reads your inbox, filters out noise, and sends you a natural-language SMS summary at your chosen time.</p>
            </div>
          </div>
        </div>

        {/* Message examples */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Example Messages
          </h2>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground">
              <p className="font-medium text-xs text-muted-foreground mb-1">Sample briefing SMS</p>
              <p>[InboxBrief] Morning briefing: 3 emails need attention — Acme Corp replied to your proposal, TechStart asked for a demo, and your accountant needs a document by EOD. Reply STOP to unsubscribe.</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground">
              <p className="font-medium text-xs text-muted-foreground mb-1">Sample briefing SMS</p>
              <p>[InboxBrief] Afternoon update: 1 urgent email — a client escalated a support ticket and needs a response today. Reply STOP to unsubscribe.</p>
            </div>
          </div>
        </div>

        {/* SMS program details */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            SMS Program Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Program name</p>
              <p className="text-foreground">InboxBrief SMS Briefings</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Message frequency</p>
              <p className="text-foreground">1–3 messages per day based on your schedule</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Message type</p>
              <p className="text-foreground">Automated transactional notifications (outbound only)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Rates</p>
              <p className="text-foreground">Msg &amp; data rates may apply</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">To opt out</p>
              <p className="text-foreground">Reply <strong>STOP</strong> to any message</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">For help</p>
              <p className="text-foreground">Reply <strong>HELP</strong> or email <a href="mailto:support@inboxbrief.org" className="text-primary underline underline-offset-2">support@inboxbrief.org</a></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Supported carriers</p>
              <p className="text-foreground">All major US &amp; Canadian carriers</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Sender</p>
              <p className="text-foreground">InboxBrief · inboxbrief.org</p>
            </div>
          </div>
        </div>

        {/* Consent demonstration */}
        <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-base mb-1">How Users Consent</h2>
          <p className="text-sm text-muted-foreground mb-5">
            During account setup at <a href="https://inboxbrief.org/onboarding" className="text-primary underline underline-offset-2">inboxbrief.org/onboarding</a>, users who provide a mobile number must check the following checkbox before any SMS is sent. Providing a phone number is optional — users who skip it can add one later in Settings and will be shown the same consent checkbox at that time. No SMS is ever sent without this explicit opt-in.
          </p>

          {/* Live consent checkbox demo */}
          <div className="bg-background border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Consent checkbox shown to every user at sign-up:</p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setChecked(!checked)}
                className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  checked
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary/60"
                }`}
              >
                {checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-foreground leading-relaxed">
                I agree to receive automated SMS briefings from InboxBrief at the number above. Message frequency varies based on your schedule (typically 1–3 msgs/day). Msg &amp; data rates may apply. Reply <strong>STOP</strong> to cancel, <strong>HELP</strong> for help. View our{" "}
                <a href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</a>{" "}and{" "}
                <a href="/terms" className="text-primary underline underline-offset-2">Terms of Service</a>.
              </span>
            </label>
            {checked && (
              <p className="mt-3 text-xs text-primary/80 pl-8">✓ Consent recorded — this is how it appears when a user checks the box during onboarding.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            This checkbox is shown whenever a user enters a phone number — during onboarding or later in Settings. The "Finish Setup" button is blocked until the user checks it if a phone number has been entered. Consent is recorded server-side at the time it is given.
          </p>
        </div>

        {/* Opt-out instructions */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-base mb-3">Opt-Out &amp; Help</h2>
          <div className="space-y-2 text-sm">
            <p><strong className="text-foreground">To stop all messages:</strong> <span className="text-muted-foreground">Reply <strong className="text-foreground">STOP</strong>, <strong className="text-foreground">STOPALL</strong>, <strong className="text-foreground">UNSUBSCRIBE</strong>, <strong className="text-foreground">CANCEL</strong>, <strong className="text-foreground">END</strong>, or <strong className="text-foreground">QUIT</strong> to any InboxBrief message. You will receive one confirmation message and no further messages will be sent.</span></p>
            <p><strong className="text-foreground">To resubscribe:</strong> <span className="text-muted-foreground">Reply <strong className="text-foreground">START</strong> or <strong className="text-foreground">YES</strong> to resume messages.</span></p>
            <p><strong className="text-foreground">For help:</strong> <span className="text-muted-foreground">Reply <strong className="text-foreground">HELP</strong> or <strong className="text-foreground">INFO</strong>, or contact <a href="mailto:support@inboxbrief.org" className="text-primary underline underline-offset-2">support@inboxbrief.org</a>.</span></p>
          </div>
        </div>

      </main>
      <PageFooter />
    </div>
  );
}
