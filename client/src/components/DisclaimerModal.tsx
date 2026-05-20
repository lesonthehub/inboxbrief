/**
 * DisclaimerBanner
 * -----------------
 * Pop-up temporarily disabled for compliance review.
 * Renders children directly -- no overlay, no gate.
 * Re-enable by restoring the modal logic when ready.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "inboxbrief_legal_v1";

export const TOS_PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_tos_v3_1bd41576.pdf";
export const PRIVACY_PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_privacy_v3_9fa80d21.pdf";
export const GOOGLE_PRIVACY_PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_google_privacy_v3_3e6848bf.pdf";

export function DisclaimerBanner({ children }: { children: React.ReactNode }) {
  // Disabled for compliance review -- renders children directly
  return <>{children}</>;
}

/** Legacy export alias */
export const DisclaimerModal = DisclaimerBanner;

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
