import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // Parse returnPath from state (new format: JSON with redirectUri + returnPath)
    // Fall back to legacy format (plain base64 of redirectUri) for backwards compat
    let returnPath = "/";
    try {
      const decoded = JSON.parse(atob(state));
      if (decoded && typeof decoded.returnPath === "string") {
        // Validate returnPath is a relative path (no external redirects)
        const rp = decoded.returnPath;
        returnPath = rp.startsWith("/") ? rp : "/";
      }
    } catch {
      // Legacy state: plain base64 of redirectUri — no returnPath, use default
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnPath);
    } catch (error: unknown) {
      // Log full error details for debugging
      const axiosErr = error as any;
      const detail = axiosErr?.response?.data ?? axiosErr?.message ?? String(error);
      console.error("[OAuth] Callback failed", JSON.stringify(detail));
      res.status(500).json({ error: "OAuth callback failed", detail });
    }
  });
}
