/**
 * DisclaimerModal
 * ─────────────────
 * Shown to ALL visitors on first interaction with the service.
 * Users must accept before any service features are accessible.
 * Covers: coincidental likeness, no affiliation, no liability.
 *
 * Acceptance is stored in:
 *   1. localStorage (for non-authenticated visitors)
 *   2. Database via trpc.disclaimer.accept (for authenticated users)
 */

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const DISCLAIMER_VERSION = "1.0";
const STORAGE_KEY = "inboxbrief_disclaimer_v1";

interface DisclaimerModalProps {
  onAccepted: () => void;
}

export function DisclaimerModal({ onAccepted }: DisclaimerModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { isAuthenticated } = useAuth();

  const acceptMutation = trpc.disclaimer.accept.useMutation({
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
      setAccepting(false);
      onAccepted();
    },
    onError: () => {
      // Even if DB save fails, allow access — local storage is the fallback
      localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
      setAccepting(false);
      onAccepted();
    },
  });

  const handleAccept = () => {
    setAccepting(true);
    if (isAuthenticated) {
      acceptMutation.mutate({ version: DISCLAIMER_VERSION });
    } else {
      localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
      setAccepting(false);
      onAccepted();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (atBottom) setScrolledToBottom(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-border/40 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base sm:text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Important Disclaimer
            </h2>
            <p className="text-xs text-muted-foreground">Please read before continuing</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm text-muted-foreground leading-relaxed"
          onScroll={handleScroll}
        >
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-300 font-semibold text-xs uppercase tracking-wider mb-2">Coincidental Likeness Notice</p>
            <p>
              Any resemblance of InboxBrief's name, branding, service descriptions, features, or content to any other
              individual, brand, organization, product, service, or entity — whether living, deceased, real, or fictitious —
              is <strong className="text-foreground">purely coincidental</strong> and entirely unintentional.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">No Affiliation</p>
            <p>
              InboxBrief is an independent service and is not affiliated with, endorsed by, sponsored by, or connected to
              any third-party brand, company, platform, or individual. Any similarity in name, appearance, or function to
              existing products or services is coincidental.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">No Warranties</p>
            <p>
              InboxBrief is provided "as-is" and "as-available" without warranties of any kind, express or implied.
              We do not guarantee that the service will be uninterrupted, error-free, or that any specific email will be
              detected, classified, or delivered as an SMS briefing.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Limitation of Liability</p>
            <p>
              InboxBrief and its operators shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to missed business opportunities, missed leads, missed emails,
              lost revenue, or data loss arising from use of or inability to use this service.
            </p>
            <p className="mt-2">
              Our total aggregate liability to you for any claim arising from use of InboxBrief shall not exceed the
              total amount you paid to InboxBrief in the three (3) months immediately preceding the claim.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Dispute Resolution</p>
            <p>
              Any issues, complaints, or disputes must first be raised directly with InboxBrief at{" "}
              <span className="text-primary font-medium">support@inboxbrief.com</span> for one-on-one resolution.
              You agree to attempt good-faith resolution before initiating any formal legal proceedings.
              Class action lawsuits and class arbitration are expressly waived.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Intellectual Property</p>
            <p>
              All InboxBrief trademarks, service marks, logos, and trade names are the exclusive property of InboxBrief.
              Any similarity to third-party intellectual property is unintentional. If you believe there is a conflict,
              please contact us at support@inboxbrief.com and we will address it promptly.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Governing Law</p>
            <p>
              This disclaimer and all related disputes are governed by the laws of the State of Texas, United States,
              without regard to conflict of law principles. You consent to the exclusive jurisdiction of courts located
              in Texas for any disputes that proceed to formal proceedings.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">By Clicking "I Agree"</p>
            <p>
              You confirm that you have read, understood, and agree to this disclaimer in its entirety. You acknowledge
              that any resemblance to other brands or entities is coincidental, and that you will resolve any concerns
              directly with InboxBrief before pursuing any other action.
            </p>
          </div>

          {!scrolledToBottom && (
            <p className="text-center text-xs text-muted-foreground/60 italic">
              Scroll to the bottom to enable the agree button
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border/40 flex-shrink-0 space-y-3">
          {scrolledToBottom && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>You've read the full disclaimer</span>
            </div>
          )}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white border-0 h-11 font-semibold"
            onClick={handleAccept}
            disabled={!scrolledToBottom || accepting}
          >
            {accepting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                I Have Read and Agree to This Disclaimer
              </span>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            You must agree to this disclaimer to use InboxBrief.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: returns whether the disclaimer has been accepted.
 * Checks localStorage first (fast), then DB for authenticated users.
 */
export function useDisclaimerStatus() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const dbStatus = trpc.disclaimer.getStatus.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
  });

  useEffect(() => {
    if (authLoading) return;

    // Check localStorage first
    const localAccepted = localStorage.getItem(STORAGE_KEY) === DISCLAIMER_VERSION;

    if (localAccepted) {
      setAccepted(true);
      return;
    }

    if (!isAuthenticated) {
      setAccepted(false);
      return;
    }

    // Wait for DB check
    if (dbStatus.data !== undefined) {
      setAccepted(dbStatus.data.accepted);
      if (dbStatus.data.accepted) {
        // Sync to localStorage for faster future checks
        localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
      }
    }
  }, [authLoading, isAuthenticated, dbStatus.data]);

  return {
    accepted,
    loading: accepted === null,
    markAccepted: () => setAccepted(true),
  };
}
