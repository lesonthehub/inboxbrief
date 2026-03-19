/**
 * Email OAuth Callback Routes
 * ────────────────────────────
 * Registers /api/oauth/gmail/callback and /api/oauth/outlook/callback
 * These routes handle the OAuth code exchange, encrypt tokens, and store them.
 * They are registered in server/_core/index.ts AFTER auth middleware.
 */

import { Express, Request, Response } from "express";
import { exchangeGmailCode, exchangeOutlookCode } from "./emailProviders";
import { encrypt } from "./encryption";
import { getDb } from "./db";
import { emailAccounts, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { writeAuditLog } from "./security";
import { sdk } from "./_core/sdk";

// ─── Helper: extract userId from session cookie ───────────────────────────────

async function getUserIdFromRequest(req: Request): Promise<number | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Gmail OAuth Callback ─────────────────────────────────────────────────────

async function handleGmailCallback(req: Request, res: Response) {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    console.error("[Gmail OAuth] Provider error:", error);
    return res.redirect(`/dashboard?error=gmail_denied`);
  }

  if (!code) {
    return res.redirect(`/dashboard?error=gmail_no_code`);
  }

  // Validate state param (should contain userId encoded as base64 JSON)
  let userId: number | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
  } catch {
    // Fallback: try to get from session cookie
    userId = await getUserIdFromRequest(req);
  }

  if (!userId) {
    return res.redirect(`/dashboard?error=gmail_auth_required`);
  }

  try {
    const tokens = await exchangeGmailCode(code);

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Encrypt tokens before storage
    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

    // Upsert: if this email is already connected, update tokens
    const existing = await db
      .select()
      .from(emailAccounts)
      .where(
        and(
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.provider, "gmail"),
          eq(emailAccounts.emailAddress, tokens.emailAddress)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(emailAccounts)
        .set({
          encryptedAccessToken: encryptedAccess,
          encryptedRefreshToken: encryptedRefresh,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(emailAccounts.id, existing[0].id));
    } else {
      await db.insert(emailAccounts).values({
        userId,
        provider: "gmail",
        emailAddress: tokens.emailAddress,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
      });
    }

    await writeAuditLog({
      userId,
      action: "email_account_connected",
      metadata: { provider: "gmail", email: tokens.emailAddress },
      req,
    });

    return res.redirect(`/dashboard?success=gmail_connected`);
  } catch (err) {
    console.error("[Gmail OAuth] Token exchange failed:", (err as Error).message);
    await writeAuditLog({
      userId,
      action: "email_account_connect_failed",
      metadata: { provider: "gmail", error: (err as Error).message },
      req,
    });
    return res.redirect(`/dashboard?error=gmail_connect_failed`);
  }
}

// ─── Outlook OAuth Callback ───────────────────────────────────────────────────

async function handleOutlookCallback(req: Request, res: Response) {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    console.error("[Outlook OAuth] Provider error:", error);
    return res.redirect(`/dashboard?error=outlook_denied`);
  }

  if (!code) {
    return res.redirect(`/dashboard?error=outlook_no_code`);
  }

  let userId: number | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
  } catch {
    userId = await getUserIdFromRequest(req);
  }

  if (!userId) {
    return res.redirect(`/dashboard?error=outlook_auth_required`);
  }

  try {
    const tokens = await exchangeOutlookCode(code);

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

    const existing = await db
      .select()
      .from(emailAccounts)
      .where(
        and(
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.provider, "outlook"),
          eq(emailAccounts.emailAddress, tokens.emailAddress)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(emailAccounts)
        .set({
          encryptedAccessToken: encryptedAccess,
          encryptedRefreshToken: encryptedRefresh,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(emailAccounts.id, existing[0].id));
    } else {
      await db.insert(emailAccounts).values({
        userId,
        provider: "outlook",
        emailAddress: tokens.emailAddress,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
      });
    }

    await writeAuditLog({
      userId,
      action: "email_account_connected",
      metadata: { provider: "outlook", email: tokens.emailAddress },
      req,
    });

    return res.redirect(`/dashboard?success=outlook_connected`);
  } catch (err) {
    console.error("[Outlook OAuth] Token exchange failed:", (err as Error).message);
    await writeAuditLog({
      userId,
      action: "email_account_connect_failed",
      metadata: { provider: "outlook", error: (err as Error).message },
      req,
    });
    return res.redirect(`/dashboard?error=outlook_connect_failed`);
  }
}

// ─── Gmail OAuth Start ────────────────────────────────────────────────────────

async function handleGmailStart(req: Request, res: Response) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return res.redirect(`/login?returnTo=/dashboard`);
  }

  try {
    const { getGmailAuthUrl } = await import("./emailProviders");
    const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");
    const url = getGmailAuthUrl(state);
    return res.redirect(url);
  } catch (err) {
    console.error("[Gmail OAuth] Failed to generate auth URL:", (err as Error).message);
    return res.redirect(`/dashboard?error=gmail_config_missing`);
  }
}

// ─── Outlook OAuth Start ──────────────────────────────────────────────────────

async function handleOutlookStart(req: Request, res: Response) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return res.redirect(`/login?returnTo=/dashboard`);
  }

  try {
    const { getOutlookAuthUrl } = await import("./emailProviders");
    const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");
    const url = getOutlookAuthUrl(state);
    return res.redirect(url);
  } catch (err) {
    console.error("[Outlook OAuth] Failed to generate auth URL:", (err as Error).message);
    return res.redirect(`/dashboard?error=outlook_config_missing`);
  }
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerEmailOAuthRoutes(app: Express): void {
  app.get("/api/oauth/gmail/start", handleGmailStart);
  app.get("/api/oauth/gmail/callback", handleGmailCallback);
  app.get("/api/oauth/outlook/start", handleOutlookStart);
  app.get("/api/oauth/outlook/callback", handleOutlookCallback);
}
