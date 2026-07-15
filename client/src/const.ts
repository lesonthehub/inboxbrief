export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath is embedded in the state so the server can redirect there after login.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode both the redirectUri and the returnPath in state
  const statePayload = JSON.stringify({ redirectUri, returnPath: returnPath ?? "/" });
  const state = btoa(statePayload);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Redirect to Google Sign-In (native account login, not Gmail briefing connection).
 * Warms up the server first to avoid cold-start issues.
 */
export const googleLoginWithWarmUp = async (returnPath?: string): Promise<void> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    await fetch("/api/health", { signal: controller.signal });
    clearTimeout(timeoutId);
  } catch {
    // Ignore — proceed regardless
  }
  const params = new URLSearchParams();
  if (returnPath) params.set("returnPath", returnPath);
  window.location.href = `/api/auth/google/login?${params.toString()}`;
};

export const loginWithWarmUp = async (returnPath?: string): Promise<void> => {
  const loginUrl = getLoginUrl(returnPath);
  try {
    // Wait up to 8s for the server to warm up before redirecting to OAuth.
    // The OAuth code has a ~60s window, so we can afford to wait.
    // Production Autoscale cold starts typically take 5-15s.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    await fetch("/api/health", { signal: controller.signal });
    clearTimeout(timeoutId);
  } catch {
    // Ignore errors (timeout or network) — proceed to login regardless
  }
  window.location.href = loginUrl;
};
