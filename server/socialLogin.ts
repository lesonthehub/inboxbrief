/**
 * Social Login — provider-agnostic OAuth sign-in for InboxBrief accounts.
 *
 * This module handles "Sign in with <Provider>" flows for ACCOUNT ACCESS only.
 * It is completely separate from the Gmail/Outlook connections used for briefing emails.
 *
 * Currently supported: Google
 * To add a new provider: add routes following the same pattern, register in index.ts, add button in Home.tsx
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Build a unique, stable openId for social-login users that won't clash with Manus openIds */
function buildSocialOpenId(provider: string, providerUserId: string): string {
  return `social:${provider}:${providerUserId}`;
}

/** Create a session cookie and redirect the user after successful social login */
async function finishSocialLogin(
  res: Response,
  req: Request,
  openId: string,
  name: string,
  returnPath: string
) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  res.redirect(302, returnPath || "/");
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function getGoogleLoginUrl(redirectUri: string, returnPath = "/"): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: Buffer.from(JSON.stringify({ returnPath })).toString("base64"),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function registerGoogleLoginRoutes(app: Express) {
  // Step 1 — Redirect to Google
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
    const returnPath = typeof req.query.returnPath === "string" ? req.query.returnPath : "/";
    const redirectUri =
      ENV.googleLoginRedirectUri ||
      `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const url = getGoogleLoginUrl(redirectUri, returnPath);
    res.redirect(302, url);
  });

  // Step 2 — Handle Google callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const error = typeof req.query.error === "string" ? req.query.error : null;

    if (error) {
      console.error("[GoogleLogin] User denied access:", error);
      res.redirect(302, "/?login_error=access_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    let returnPath = "/";
    try {
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
        if (decoded?.returnPath?.startsWith("/")) returnPath = decoded.returnPath;
      }
    } catch { /* use default */ }

    try {
      const redirectUri =
        ENV.googleLoginRedirectUri ||
        `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

      const tokenRes = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenRes.data;

      const userInfoRes = await axios.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { sub, name, email } = userInfoRes.data as { sub: string; name: string; email: string };
      if (!sub) {
        res.status(400).json({ error: "Google did not return a user ID" });
        return;
      }

      // ── Email-based account merge ──────────────────────────────────────────
      // If a user with this email already exists (e.g., the original owner account
      // created via Manus OAuth), log them into THAT account instead of creating
      // a new one. This prevents duplicate accounts for the same person.
      let resolvedOpenId = buildSocialOpenId("google", sub);
      let resolvedName = name || email || "Google User";

      if (email) {
        const database = await getDb();
        if (database) {
          const existing = await database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (existing.length > 0 && existing[0].openId !== resolvedOpenId) {
            // Use the pre-existing account — update its loginMethod and lastSignedIn
            resolvedOpenId = existing[0].openId;
            resolvedName = existing[0].name || resolvedName;
            await database
              .update(users)
              .set({
                loginMethod: "google",
                lastSignedIn: new Date(),
                // Auto-verify email for the owner and for Google-verified emails
                emailVerified: true,
              })
              .where(eq(users.openId, resolvedOpenId));
            await finishSocialLogin(res, req, resolvedOpenId, resolvedName, returnPath);
            return;
          }
        }
      }

      await db.upsertUser({
        openId: resolvedOpenId,
        name: resolvedName,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
        emailVerified: true, // Google has already verified this email
      });

      await finishSocialLogin(res, req, resolvedOpenId, resolvedName, returnPath);
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data ?? (err as any)?.message ?? String(err);
      console.error("[GoogleLogin] Callback failed", JSON.stringify(detail));
      res.redirect(302, "/?login_error=google_failed");
    }
  });
}

// ─── Microsoft / Outlook Sign-In ─────────────────────────────────────────────

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/v1.0/me";

export function getMicrosoftLoginUrl(redirectUri: string, returnPath = "/"): string {
  const params = new URLSearchParams({
    client_id: ENV.microsoftClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile User.Read",
    response_mode: "query",
    prompt: "select_account",
    state: Buffer.from(JSON.stringify({ returnPath })).toString("base64"),
  });
  return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
}

export function registerMicrosoftLoginRoutes(app: Express) {
  // Step 1 — Redirect to Microsoft
  app.get("/api/auth/microsoft/login", (req: Request, res: Response) => {
    const returnPath = typeof req.query.returnPath === "string" ? req.query.returnPath : "/";
    const redirectUri =
      ENV.microsoftLoginRedirectUri ||
      `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`;
    const url = getMicrosoftLoginUrl(redirectUri, returnPath);
    res.redirect(302, url);
  });

  // Step 2 — Handle Microsoft callback
  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const error = typeof req.query.error === "string" ? req.query.error : null;

    if (error) {
      console.error("[MicrosoftLogin] User denied access:", error);
      res.redirect(302, "/?login_error=access_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    let returnPath = "/";
    try {
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
        if (decoded?.returnPath?.startsWith("/")) returnPath = decoded.returnPath;
      }
    } catch { /* use default */ }

    try {
      const redirectUri =
        ENV.microsoftLoginRedirectUri ||
        `${req.protocol}://${req.get("host")}/api/auth/microsoft/callback`;

      const tokenRes = await axios.post(
        MICROSOFT_TOKEN_URL,
        new URLSearchParams({
          code,
          client_id: ENV.microsoftClientId,
          client_secret: ENV.microsoftClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenRes.data;

      const userInfoRes = await axios.get(MICROSOFT_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = userInfoRes.data as { id: string; displayName?: string; mail?: string; userPrincipalName?: string };
      const { id, displayName, mail, userPrincipalName } = profile;
      if (!id) {
        res.status(400).json({ error: "Microsoft did not return a user ID" });
        return;
      }

      const email = mail || userPrincipalName || null;
      const name = displayName || email || "Outlook User";

      // ── Email-based account merge ──────────────────────────────────────────
      let resolvedOpenId = buildSocialOpenId("microsoft", id);
      let resolvedName = name;

      if (email) {
        const database = await getDb();
        if (database) {
          const existing = await database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (existing.length > 0 && existing[0].openId !== resolvedOpenId) {
            resolvedOpenId = existing[0].openId;
            resolvedName = existing[0].name || resolvedName;
            await database
              .update(users)
              .set({
                loginMethod: "microsoft",
                lastSignedIn: new Date(),
                emailVerified: true,
              })
              .where(eq(users.openId, resolvedOpenId));
            await finishSocialLogin(res, req, resolvedOpenId, resolvedName, returnPath);
            return;
          }
        }
      }

      await db.upsertUser({
        openId: resolvedOpenId,
        name: resolvedName,
        email,
        loginMethod: "microsoft",
        lastSignedIn: new Date(),
        emailVerified: true, // Microsoft has already verified this email
      });

      await finishSocialLogin(res, req, resolvedOpenId, resolvedName, returnPath);
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data ?? (err as any)?.message ?? String(err);
      console.error("[MicrosoftLogin] Callback failed", JSON.stringify(detail));
      res.redirect(302, "/?login_error=microsoft_failed");
    }
  });
}
