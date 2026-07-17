import { useLocation } from "wouter";
import { Shield } from "lucide-react";

/**
 * PageFooter — shared footer used on every public-facing and authenticated page.
 * Contains copyright, all policy/legal links, and the encryption badge.
 * Responsive: stacks vertically on mobile, horizontal on sm+.
 */
export function PageFooter() {
  const [, navigate] = useLocation();

  const links: { label: string; path: string }[] = [
    { label: "Pricing", path: "/pricing" },
    { label: "Enterprise", path: "/enterprise" },
    { label: "Contact", path: "/contact" },
    { label: "Terms", path: "/terms" },
    { label: "Privacy", path: "/privacy" },
    { label: "SMS Terms", path: "/sms-opt-in" },
    { label: "Data Usage", path: "/data-usage" },
  ];

  return (
    <footer className="border-t border-border/40 py-6 sm:py-8 px-4 mt-auto">
      <div className="container flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-4">
        {/* Copyright */}
        <span className="text-sm text-muted-foreground text-center sm:text-left whitespace-nowrap">
          © {new Date().getFullYear()} InboxBrief. All rights reserved.
        </span>

        {/* Links + encryption badge */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
          {links.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span>AES-256-GCM Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
