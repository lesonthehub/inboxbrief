/**
 * /data-usage — Public page explaining exactly what Gmail and Outlook data
 * InboxBrief accesses, why, and how it is protected.
 *
 * Required by:
 *  - Google OAuth App Verification (Limited Use policy disclosure)
 *  - Microsoft Azure Publisher Verification (data handling transparency)
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Mail, Smartphone, Lock, Trash2, ExternalLink } from "lucide-react";

export default function DataUsage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-sm text-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            InboxBrief
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto py-10 sm:py-16 px-4">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transparency Report
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            How InboxBrief Uses Your Email Data
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This page explains exactly what data InboxBrief accesses from your Gmail or Microsoft Outlook account,
            why we need it, what we do with it, and how you can revoke access at any time.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Mail, label: "Read-only access", desc: "We never send, delete, or modify your emails" },
            { icon: Lock, label: "AES-256-GCM encrypted", desc: "Tokens stored encrypted, never in plaintext" },
            { icon: Trash2, label: "Not retained", desc: "Email content processed in memory, not stored" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8">

          {/* ─── GMAIL ─── */}
          <section className="rounded-xl border border-border/60 overflow-hidden">
            <div className="bg-muted/30 px-5 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Gmail Integration</h2>
            </div>
            <div className="px-5 py-5 space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-foreground font-medium mb-1">Permission requested</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block w-fit">
                  https://www.googleapis.com/auth/gmail.readonly
                </code>
                <p className="mt-2">Read-only access to your Gmail messages. We cannot send, delete, label, or modify any emails.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">What we read</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email subject lines</li>
                  <li>Sender names and addresses</li>
                  <li>Email body text (to understand context and priority)</li>
                  <li>Received timestamps</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Why we need it</p>
                <p>
                  InboxBrief's core function is to read your inbox, identify the most important messages, and deliver a
                  concise natural-language summary to your phone via SMS. Without read access to your emails, we cannot
                  generate your briefing.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">What we do NOT do</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We do not sell or share your Gmail data with any third party</li>
                  <li>We do not use Gmail data to train AI or ML models</li>
                  <li>We do not use Gmail data for advertising or profiling</li>
                  <li>We do not allow any human to read your Gmail data (except as required by law or to investigate security incidents)</li>
                  <li>We do not store email body text in our database — it is processed in memory and discarded</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Google's Limited Use Policy</p>
                <p>
                  InboxBrief's use of Gmail data complies with the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  , including the Limited Use requirements. Data obtained through Gmail APIs is used only to provide
                  the InboxBrief service directly to you.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">How to revoke access</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    From InboxBrief: Dashboard → Connected Accounts → Disconnect Gmail
                  </li>
                  <li>
                    From Google:{" "}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      myaccount.google.com/permissions
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ─── MICROSOFT / OUTLOOK ─── */}
          <section className="rounded-xl border border-border/60 overflow-hidden">
            <div className="bg-muted/30 px-5 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Microsoft Outlook Integration</h2>
            </div>
            <div className="px-5 py-5 space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-foreground font-medium mb-1">Permissions requested</p>
                <div className="flex flex-col gap-1">
                  {[
                    { scope: "Mail.Read", desc: "Read-only access to your Outlook messages" },
                    { scope: "User.Read", desc: "Read your basic profile (name and email address)" },
                    { scope: "offline_access", desc: "Maintain access for scheduled briefings while you are not actively using the app" },
                  ].map(({ scope, desc }) => (
                    <div key={scope} className="flex items-start gap-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded flex-shrink-0 mt-0.5">{scope}</code>
                      <span className="text-xs">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">What we read</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email subject lines</li>
                  <li>Sender names and addresses</li>
                  <li>Email body text (to understand context and priority)</li>
                  <li>Received timestamps</li>
                  <li>Your display name and email address (for account identification)</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Why we need it</p>
                <p>
                  The same as Gmail — InboxBrief reads your Outlook inbox to identify important messages and deliver
                  a concise SMS briefing on your schedule. <code className="text-xs bg-muted px-1 py-0.5 rounded">offline_access</code> is required
                  so your scheduled briefings can be generated even when you are not actively logged in to InboxBrief.
                </p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">What we do NOT do</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We do not sell or share your Outlook data with any third party</li>
                  <li>We do not use Outlook data to train AI or ML models</li>
                  <li>We do not use Outlook data for advertising or profiling</li>
                  <li>We do not store email body text in our database</li>
                  <li>We do not send, delete, or modify any Outlook emails</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">How to revoke access</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    From InboxBrief: Dashboard → Connected Accounts → Disconnect Outlook
                  </li>
                  <li>
                    From Microsoft:{" "}
                    <a
                      href="https://account.microsoft.com/privacy/app-access"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      account.microsoft.com/privacy/app-access
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ─── AI PROCESSING ─── */}
          <section className="rounded-xl border border-border/60 overflow-hidden">
            <div className="bg-muted/30 px-5 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground">AI Processing & SMS Delivery</h2>
            </div>
            <div className="px-5 py-5 space-y-4 text-sm text-muted-foreground">
              <p>
                After reading your inbox, InboxBrief passes email subjects and snippets to an AI language model to
                generate a concise, natural-language briefing. This processing happens on our servers; email content
                is not stored after the briefing is generated.
              </p>
              <p>
                The generated briefing text (not the raw email content) is then delivered to your phone via SMS.
                An encrypted copy of the briefing summary is stored in your account history so you can review past
                briefings in your Dashboard.
              </p>
              <p>
                We use AI providers under strict data processing agreements that prohibit them from using your data
                for model training or any purpose other than generating your briefing.
              </p>
            </div>
          </section>

          {/* ─── CONTACT ─── */}
          <section className="rounded-xl border border-border/60 bg-muted/20 px-5 py-5 text-sm text-muted-foreground">
            <p className="text-foreground font-medium mb-2">Questions about data usage?</p>
            <p>
              Contact us at{" "}
              <a href="mailto:support@inboxbrief.org" className="text-primary underline underline-offset-2">
                support@inboxbrief.org
              </a>{" "}
              or visit our{" "}
              <a href="/contact" className="text-primary underline underline-offset-2">Contact page</a>.
              We respond within 1 business day.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</a>
            <a href="/sms-opt-in" className="hover:text-foreground transition-colors underline underline-offset-2">SMS Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors underline underline-offset-2">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
