/**
 * LoginModal — provider-choice login modal.
 * Mobile: slides up from the bottom as a bottom-sheet with safe-area padding.
 * Tablet+: centred card with rounded corners on all sides.
 * Three states: idle (provider choice), loading (spinner), error (message + retry).
 */

import { useState, useCallback } from "react";
import { X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { googleLoginWithWarmUp, outlookLoginWithWarmUp } from "@/const";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
  title?: string;
}

type Provider = "gmail" | "outlook";
type ModalState = "idle" | "loading" | "error";

const PROVIDER_LABELS: Record<Provider, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
};

const ERROR_MESSAGES: Record<string, string> = {
  network: "Unable to reach the authentication server. Please check your connection and try again.",
  timeout: "The connection timed out. Please try again.",
  default: "Something went wrong connecting to {provider}. Please try again or use the other provider.",
};

export function LoginModal({
  open,
  onClose,
  returnPath = "/dashboard",
  title = "Sign in to InboxBrief",
}: LoginModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleProviderClick = useCallback(async (provider: Provider) => {
    setState("loading");
    setActiveProvider(provider);
    setErrorMessage("");

    try {
      const endpoint =
        provider === "gmail"
          ? "/api/auth/google/login"
          : "/api/auth/microsoft/login";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let reachable = false;
      try {
        const res = await fetch(endpoint, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "manual",
        });
        reachable = res.status < 500;
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          throw new Error("timeout");
        }
        throw new Error("network");
      } finally {
        clearTimeout(timeoutId);
      }

      if (!reachable) throw new Error("default");

      if (provider === "gmail") {
        googleLoginWithWarmUp(returnPath);
      } else {
        outlookLoginWithWarmUp(returnPath);
      }
    } catch (err: unknown) {
      const errType = err instanceof Error ? err.message : "default";
      const label = PROVIDER_LABELS[provider];
      const raw = ERROR_MESSAGES[errType] ?? ERROR_MESSAGES.default;
      setErrorMessage(raw.replace("{provider}", label));
      setState("error");
      setActiveProvider(null);
    }
  }, [returnPath]);

  const handleRetry = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setActiveProvider(null);
  }, []);

  const handleClose = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setActiveProvider(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    /* Backdrop — aligns to bottom on mobile, centres on sm+ */
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={state === "loading" ? undefined : handleClose}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Blurred dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card
          Mobile:  full-width bottom-sheet, rounded top corners, safe-area bottom padding
          Tablet+: max-w-sm centred card, all corners rounded
      */}
      <div
        className={[
          "relative z-10 w-full bg-[#0f172a] border border-border/60 shadow-2xl shadow-black/60",
          // Mobile bottom-sheet
          "rounded-t-2xl px-5 pt-5",
          "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
          // Tablet+ centred card
          "sm:max-w-sm sm:rounded-2xl sm:px-8 sm:pt-8 sm:pb-8 sm:mx-4",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — larger tap target on mobile */}
        {state !== "loading" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* ── Loading state ── */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-6 gap-4">
            {/* Drag handle visible on mobile */}
            <div className="w-10 h-1 rounded-full bg-white/20 absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />
            <Loader2 className="w-12 h-12 sm:w-10 sm:h-10 text-violet-400 animate-spin" />
            <p className="text-base sm:text-sm text-muted-foreground text-center">
              Connecting to{" "}
              <span className="text-foreground font-medium">
                {activeProvider ? PROVIDER_LABELS[activeProvider] : "provider"}
              </span>
              …
            </p>
            <p className="text-sm sm:text-xs text-muted-foreground/70 text-center">
              You'll be redirected to sign in securely.
            </p>
          </div>
        )}

        {/* ── Error state ── */}
        {state === "error" && (
          <>
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" />

            <h2
              className="text-xl font-bold text-foreground mb-1 text-center"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Connection failed
            </h2>

            <div className="mt-4 mb-5">
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 w-full">
                <AlertCircle className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Retry — tall touch target on mobile */}
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 w-full px-4 py-4 sm:py-3 rounded-xl border border-violet-500/50 bg-violet-600/20 hover:bg-violet-600/30 active:bg-violet-600/40 text-violet-300 text-base sm:text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4" />
                Try again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm sm:text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-2"
              >
                Cancel
              </button>
            </div>

            <p className="text-sm sm:text-xs text-muted-foreground/70 text-center mt-4">
              If the problem persists, contact{" "}
              <a
                href="mailto:support@inboxbrief.com"
                className="underline hover:text-muted-foreground transition-colors"
              >
                support@inboxbrief.com
              </a>
            </p>
          </>
        )}

        {/* ── Idle state ── */}
        {state === "idle" && (
          <>
            {/* Drag handle — visual affordance on mobile */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 sm:hidden" />

            <h2
              className="text-xl font-bold text-foreground mb-1 text-center"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Choose your email provider to continue
            </p>

            {/* Provider buttons — min 48px height for WCAG touch targets */}
            <div className="flex flex-col gap-3">
              {/* Gmail */}
              <button
                type="button"
                className="flex items-center justify-center gap-3 w-full px-4 py-4 sm:py-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-white/10 active:bg-white/15 text-foreground text-base sm:text-sm font-medium transition-colors min-h-[52px] sm:min-h-[48px]"
                onClick={() => handleProviderClick("gmail")}
              >
                <svg className="w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Gmail
              </button>

              {/* Outlook */}
              <button
                type="button"
                className="flex items-center justify-center gap-3 w-full px-4 py-4 sm:py-3.5 rounded-xl border border-border/60 bg-white/5 hover:bg-white/10 active:bg-white/15 text-foreground text-base sm:text-sm font-medium transition-colors min-h-[52px] sm:min-h-[48px]"
                onClick={() => handleProviderClick("outlook")}
              >
                <svg className="w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Continue with Outlook
              </button>
            </div>

            <p className="text-sm sm:text-xs text-muted-foreground text-center mt-5">
              Gmail and Outlook are the only supported login methods.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
