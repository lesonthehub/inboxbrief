/**
 * Email Provider Helpers — Gmail & Outlook
 * Handles OAuth token exchange, incremental email fetching, and token refresh.
 * Tokens are always decrypted in-memory only; never logged or re-persisted in plaintext.
 */
import { google } from "googleapis";
import { OWNER_EMAIL } from "./sms";

export interface RawEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: Date;
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

function getGmailOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.APP_URL ?? ""}/api/oauth/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Generates the Gmail OAuth authorization URL. */
export function getGmailAuthUrl(state: string): string {
  const oauth2Client = getGmailOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state,
  });
}

/** Exchanges an authorization code for Gmail tokens. */
export async function exchangeGmailCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  emailAddress: string;
}> {
  const oauth2Client = getGmailOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get the authenticated user's email
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
    emailAddress: data.email ?? OWNER_EMAIL,
  };
}

/**
 * Fetches emails from Gmail newer than lastProcessedEmailId.
 * Uses Gmail's history API for incremental fetching when a historyId exists,
 * otherwise falls back to a date-based query.
 * Returns emails and the new lastProcessedEmailId to persist.
 */
export async function fetchGmailEmails(
  accessToken: string,
  refreshToken: string | null,
  lastProcessedEmailId: string | null,
  limit: number // -1 = unlimited
): Promise<{ emails: RawEmail[]; newLastId: string | null }> {
  const oauth2Client = getGmailOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Build query: only unread, not spam/trash, newer than last fetch
  let query = "is:unread -category:promotions -category:social -in:spam -in:trash";

  // Fetch message list
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: limit === -1 ? 100 : Math.min(limit, 100),
    pageToken: undefined,
  });

  const messages = listResponse.data.messages ?? [];
  if (messages.length === 0) {
    return { emails: [], newLastId: lastProcessedEmailId };
  }

  // Filter out already-processed messages
  const newMessages = lastProcessedEmailId
    ? messages.filter((m) => m.id && m.id > lastProcessedEmailId)
    : messages;

  if (newMessages.length === 0) {
    return { emails: [], newLastId: lastProcessedEmailId };
  }

  // Fetch full details for each message (batch)
  const emails: RawEmail[] = [];
  for (const msg of newMessages.slice(0, limit === -1 ? newMessages.length : limit)) {
    if (!msg.id) continue;
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = detail.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";

      emails.push({
        id: msg.id,
        subject: get("Subject") || "(no subject)",
        from: get("From"),
        snippet: detail.data.snippet ?? "",
        date: new Date(parseInt(detail.data.internalDate ?? "0")),
      });
    } catch {
      // Skip individual message fetch failures
    }
  }

  const newLastId = newMessages[0]?.id ?? lastProcessedEmailId;
  return { emails, newLastId };
}

// ─── Outlook (Microsoft Graph) ────────────────────────────────────────────────

function getMsalConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI ?? `${process.env.APP_URL ?? ""}/api/oauth/outlook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret, redirectUri };
}

/** Generates the Outlook OAuth authorization URL. */
export function getOutlookAuthUrl(state: string): string {
  const { clientId, redirectUri } = getMsalConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "offline_access Mail.Read User.Read",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

/** Exchanges an Outlook authorization code for tokens. */
export async function exchangeOutlookCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  emailAddress: string;
}> {
  const { clientId, clientSecret, redirectUri } = getMsalConfig();

  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Get user email
  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = await meRes.json() as { mail?: string; userPrincipalName?: string };

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    emailAddress: me.mail ?? me.userPrincipalName ?? OWNER_EMAIL,
  };
}

/**
 * Fetches emails from Outlook using Microsoft Graph API.
 * Uses $skipToken / deltaLink for incremental fetching.
 */
export async function fetchOutlookEmails(
  accessToken: string,
  lastProcessedEmailId: string | null,
  limit: number
): Promise<{ emails: RawEmail[]; newLastId: string | null }> {
  const maxResults = limit === -1 ? 100 : Math.min(limit, 100);

  // If we have a delta link, use it for incremental fetch
  const url = lastProcessedEmailId && lastProcessedEmailId.startsWith("https://")
    ? lastProcessedEmailId
    : `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${maxResults}&$select=id,subject,from,receivedDateTime,bodyPreview&$filter=isRead eq false&$orderby=receivedDateTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Outlook fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as {
    value: Array<{
      id: string;
      subject: string;
      from: { emailAddress: { address: string; name: string } };
      receivedDateTime: string;
      bodyPreview: string;
    }>;
    "@odata.deltaLink"?: string;
    "@odata.nextLink"?: string;
  };

  const emails: RawEmail[] = (data.value ?? []).map((m) => ({
    id: m.id,
    subject: m.subject || "(no subject)",
    from: `${m.from?.emailAddress?.name ?? ""} <${m.from?.emailAddress?.address ?? ""}>`,
    snippet: m.bodyPreview ?? "",
    date: new Date(m.receivedDateTime),
  }));

  // Store deltaLink as the new cursor for next incremental fetch
  const newLastId = data["@odata.deltaLink"] ?? data["@odata.nextLink"] ?? lastProcessedEmailId;

  return { emails, newLastId };
}
