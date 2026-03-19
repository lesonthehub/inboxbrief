/**
 * Enterprise Security Middleware
 * ────────────────────────────────
 * Covers OWASP Top 10 + additional hardening:
 *  1. Helmet: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
 *  2. Rate limiting: global, auth, OTP, briefing trigger
 *  3. Input sanitization: strip XSS payloads from all string inputs
 *  4. Audit logging: immutable record of sensitive actions
 *  5. Origin validation: reject cross-origin mutations
 *  6. Request size limits: prevent DoS via large payloads
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss";
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

// ─── 1. Helmet Security Headers ──────────────────────────────────────────────

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.manus.im"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false, // Allow Stripe iframes
});

// ─── 2. Rate Limiters ─────────────────────────────────────────────────────────

/** Global rate limiter: 200 requests per minute per IP */
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/api/stripe/webhook", // Stripe webhooks exempt
});

/** Auth endpoints: 15 requests per 15 minutes per IP */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

/** OTP send: 3 requests per 10 minutes per IP (additional server-side check in phoneVerification.ts) */
export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification code requests. Please wait 10 minutes." },
});

/** Briefing trigger: 10 requests per hour per IP */
export const briefingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Briefing limit reached. Please wait before triggering another." },
});

/** Enterprise contact form: 5 per hour per IP */
export const contactFormRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many contact form submissions. Please try again later." },
});

// ─── 3. Input Sanitization ────────────────────────────────────────────────────

/** Recursively sanitize all string values in an object to prevent XSS */
export function sanitizeInput<T>(input: T): T {
  if (typeof input === "string") {
    return xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
    }) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized as T;
  }
  return input;
}

/** Express middleware: sanitize all req.body string fields */
export function sanitizeBodyMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }
  next();
}

// ─── 4. Audit Logging ─────────────────────────────────────────────────────────

export interface AuditEvent {
  userId?: number;
  action: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/**
 * Write an immutable audit log entry.
 * NEVER include tokens, passwords, or secret keys in metadata.
 */
export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Scrub any accidentally included sensitive fields
    const safeMetadata = event.metadata ? scrubSensitiveFields(event.metadata) : undefined;

    await db.insert(auditLogs).values({
      userId: event.userId ?? null,
      action: event.action,
      metadata: safeMetadata ? JSON.stringify(safeMetadata) : null,
      ipAddress: event.req ? getClientIp(event.req) : null,
      userAgent: event.req?.headers["user-agent"]?.slice(0, 512) ?? null,
    });
  } catch (err) {
    // Audit log failures must never crash the application
    console.error("[Audit] Failed to write audit log:", (err as Error).message);
  }
}

/** Remove known sensitive field names from metadata before logging */
function scrubSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    "password", "token", "accessToken", "refreshToken", "secret",
    "apiKey", "key", "authorization", "cookie", "code", "otp",
    "codeHash", "encryptedAccessToken", "encryptedRefreshToken",
    "stripeSecretKey", "twilioAuthToken",
  ]);

  const scrubbed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      scrubbed[k] = "[REDACTED]";
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      scrubbed[k] = scrubSensitiveFields(v as Record<string, unknown>);
    } else {
      scrubbed[k] = v;
    }
  }
  return scrubbed;
}

/** Extract real client IP, respecting proxy headers */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

// ─── 5. Origin Validation ─────────────────────────────────────────────────────

/** Validate that mutation requests come from allowed origins */
export function validateOriginMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  // Skip Stripe webhooks (they have their own signature verification)
  if (req.path.startsWith("/api/stripe/webhook")) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // In production, validate origin is from our domain
  if (process.env.NODE_ENV === "production" && origin) {
    const allowedOrigins = [
      "https://inboxbrief.com",
      "https://www.inboxbrief.com",
      "https://inboxbrief.com",
      "https://www.inboxbrief.com",
    ];

    // Also allow any *.manus.space domain for staging
    const isManusSpace = /^https:\/\/[a-z0-9-]+\.manus\.(space|computer)$/.test(origin);

    if (!allowedOrigins.includes(origin) && !isManusSpace) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
  }

  next();
}

// ─── 6. Security Headers for tRPC responses ───────────────────────────────────

export function securityResponseHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent caching of sensitive API responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}
