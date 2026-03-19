/**
 * DisclaimerBanner
 * ─────────────────
 * Compact checkbox banner shown to first-time visitors only.
 * - Shown ONCE per browser (stored in localStorage)
 * - Skipped entirely when user is logged in
 * - Links to full PDF documents for ToS and Privacy Policy
 * - Must check the box before accessing any page content
 */

import { useState, useEffect } from "react";
import { Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "inboxbrief_legal_v1";

export const TOS_PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief-terms-of-service_87c978b1.pdf";
export const PRIVACY_PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief-privacy-policy_2b032300.pdf";

export function DisclaimerBanner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState<boolean | null>(null); // null = not yet determined
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === "1");
  }, []);

  // While auth or acceptance status is loading, render children normally
  if (authLoading || accepted === null) {
    return <>{children}</>;
  }

  // Logged-in users never see the banner
  if (isAuthenticated || accepted) {
    return <>{children}</>;
  }

  const handleAccept = () => {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, "1");
    setAccepted(true);
  };

  return (
    <>
      {/* Blurred, dimmed background content */}
      <div
        className="pointer-events-none select-none overflow-hidden"
        style={{ filter: "blur(4px) brightness(0.4)", maxHeight: "100vh" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Fixed overlay */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-md rounded-2xl border shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)",
            borderColor: "rgba(79,70,229,0.3)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(79,70,229,0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: "rgba(79,70,229,0.2)" }}
            >
              <Shield className="w-5 h-5" style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Before you continue
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                One-time acknowledgment · Only shown once
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              InboxBrief is an independent service. Any resemblance to other individuals, brands, organizations, or
              entities is <span className="text-white font-semibold">purely coincidental</span>. All disputes must be
              resolved directly with us before any formal proceedings.
            </p>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer" htmlFor="legal-checkbox">
              <Checkbox
                id="legal-checkbox"
                checked={checked}
                onCheckedChange={(v) => setChecked(Boolean(v))}
                className="mt-0.5 flex-shrink-0 border-white/25 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <span className="text-sm leading-relaxed select-none" style={{ color: "rgba(255,255,255,0.75)" }}>
                I have read and agree to the{" "}
                <a
                  href={TOS_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline inline-flex items-center gap-0.5"
                  style={{ color: "#818cf8" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and{" "}
                <a
                  href={PRIVACY_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline inline-flex items-center gap-0.5"
                  style={{ color: "#818cf8" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
                , including the coincidental likeness notice and limitation of liability.
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <Button
              onClick={handleAccept}
              disabled={!checked}
              className="w-full h-11 font-semibold text-sm border-0 transition-all duration-200"
              style={
                checked
                  ? { background: "#4f46e5", color: "#ffffff" }
                  : {
                      background: "rgba(79,70,229,0.25)",
                      color: "rgba(255,255,255,0.35)",
                      cursor: "not-allowed",
                    }
              }
            >
              Continue to InboxBrief
            </Button>
            <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
              Logged-in users are never shown this screen again.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Legacy export alias so existing App.tsx imports don't break.
 * DisclaimerModal is now the same as DisclaimerBanner.
 */
export const DisclaimerModal = DisclaimerBanner;

/**
 * Hook kept for backward compatibility.
 * Returns accepted status from localStorage.
 */
export function useDisclaimerStatus() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setAccepted(true);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === "1");
  }, [isAuthenticated]);

  return {
    accepted: accepted ?? false,
    loading: accepted === null,
    markAccepted: () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setAccepted(true);
    },
  };
}

export default DisclaimerBanner;
