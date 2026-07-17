/**
 * SocialLoginButtons — renders "Sign in with Gmail" and "Sign in with Outlook" buttons.
 * Used on every page that needs a login entry point.
 *
 * Props:
 *   returnPath — where to redirect after login (default: "/dashboard")
 *   direction  — "row" (side-by-side) or "col" (stacked, default)
 *   size       — "sm" | "md" (default "md")
 */

import { googleLoginWithWarmUp, outlookLoginWithWarmUp } from "@/const";

interface SocialLoginButtonsProps {
  returnPath?: string;
  direction?: "row" | "col";
  size?: "sm" | "md";
  className?: string;
}

export function SocialLoginButtons({
  returnPath = "/dashboard",
  direction = "col",
  size = "md",
  className = "",
}: SocialLoginButtonsProps) {
  const containerClass =
    direction === "row"
      ? "flex flex-col sm:flex-row items-center justify-center gap-3"
      : "flex flex-col items-center gap-3 w-full";

  const btnBase =
    size === "sm"
      ? "flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors w-full max-w-xs"
      : "flex items-center justify-center gap-3 px-5 py-3 rounded-xl border text-sm sm:text-base font-medium transition-colors w-full max-w-xs";

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Sign in with Gmail */}
      <button
        type="button"
        className={`${btnBase} border-border/60 bg-white/5 hover:bg-white/10 text-foreground`}
        onClick={() => googleLoginWithWarmUp(returnPath)}
      >
        {/* Google "G" logo */}
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Gmail
      </button>

      {/* Sign in with Outlook */}
      <button
        type="button"
        className={`${btnBase} border-border/60 bg-white/5 hover:bg-white/10 text-foreground`}
        onClick={() => outlookLoginWithWarmUp(returnPath)}
      >
        {/* Microsoft / Outlook logo */}
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
          <path fill="#f35325" d="M1 1h10v10H1z"/>
          <path fill="#81bc06" d="M12 1h10v10H12z"/>
          <path fill="#05a6f0" d="M1 12h10v10H1z"/>
          <path fill="#ffba08" d="M12 12h10v10H12z"/>
        </svg>
        Sign in with Outlook
      </button>

      <p className="text-xs text-muted-foreground text-center mt-1">
        Gmail and Outlook are the only supported login methods.
      </p>
    </div>
  );
}
