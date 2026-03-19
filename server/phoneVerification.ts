/**
 * Phone Verification (OTP) System
 * ─────────────────────────────────
 * - Generates a 6-digit OTP, hashes it with SHA-256 before storage
 * - Sends the code via SMS (Twilio)
 * - Validates submitted codes against the hash
 * - Enforces: 10-minute expiry, max 5 attempts, 3 sends per 10 minutes
 * - Never stores or logs plaintext OTP codes
 */

import crypto from "crypto";
import { getDb } from "./db";
import { phoneVerifications } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendSms } from "./sms";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Hash a plaintext OTP code with SHA-256 */
function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Generate a cryptographically secure 6-digit OTP */
function generateOtp(): string {
  // Use crypto.randomInt for uniform distribution (no modulo bias)
  const code = crypto.randomInt(100000, 999999);
  return code.toString();
}

/** Normalize phone to E.164 format for consistency */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export type SendOtpResult =
  | { success: true; expiresAt: Date }
  | { success: false; error: "rate_limited" | "send_failed"; retryAfterSeconds?: number };

/**
 * Send a verification OTP to the given phone number.
 * Rate-limited to 3 sends per 10-minute window per user.
 */
export async function sendVerificationOtp(
  userId: number,
  phone: string
): Promise<SendOtpResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const normalizedPhone = normalizePhone(phone);

  // Rate limit: count recent sends for this user
  const windowStart = new Date(Date.now() - SEND_WINDOW_MS);
  const recentSends = await db
    .select()
    .from(phoneVerifications)
    .where(
      and(
        eq(phoneVerifications.userId, userId),
        eq(phoneVerifications.phone, normalizedPhone)
      )
    )
    .orderBy(desc(phoneVerifications.createdAt))
    .limit(MAX_SENDS_PER_WINDOW + 1);

  const recentInWindow = recentSends.filter(
    (r) => r.createdAt > windowStart
  );

  if (recentInWindow.length >= MAX_SENDS_PER_WINDOW) {
    const oldest = recentInWindow[recentInWindow.length - 1];
    const retryAfter = Math.ceil(
      (oldest.createdAt.getTime() + SEND_WINDOW_MS - Date.now()) / 1000
    );
    return { success: false, error: "rate_limited", retryAfterSeconds: Math.max(0, retryAfter) };
  }

  // Generate and hash the OTP
  const code = generateOtp();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Store hashed OTP
  await db.insert(phoneVerifications).values({
    userId,
    phone: normalizedPhone,
    codeHash,
    expiresAt,
    verified: false,
    attempts: 0,
  });

  // Send via SMS — the plaintext code is only ever in memory here
  const message = `Your InboxBrief verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

  try {
    await sendSms(normalizedPhone, message);
  } catch (err) {
    console.error("[OTP] Failed to send verification SMS:", (err as Error).message);
    return { success: false, error: "send_failed" };
  }

  // Code is no longer needed in memory — let it be GC'd
  return { success: true, expiresAt };
}

export type VerifyOtpResult =
  | { success: true }
  | { success: false; error: "invalid_code" | "expired" | "too_many_attempts" | "not_found"; attemptsLeft?: number };

/**
 * Verify a submitted OTP code for a user and phone number.
 * Marks the phone as verified on success.
 */
export async function verifyOtp(
  userId: number,
  phone: string,
  submittedCode: string
): Promise<VerifyOtpResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const normalizedPhone = normalizePhone(phone);

  // Find the most recent unverified OTP for this user+phone
  const [record] = await db
    .select()
    .from(phoneVerifications)
    .where(
      and(
        eq(phoneVerifications.userId, userId),
        eq(phoneVerifications.phone, normalizedPhone),
        eq(phoneVerifications.verified, false)
      )
    )
    .orderBy(desc(phoneVerifications.createdAt))
    .limit(1);

  if (!record) {
    return { success: false, error: "not_found" };
  }

  // Check expiry
  if (record.expiresAt < new Date()) {
    return { success: false, error: "expired" };
  }

  // Check attempt count
  if (record.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: "too_many_attempts" };
  }

  // Increment attempts first (prevents timing attacks from skipping increment)
  await db
    .update(phoneVerifications)
    .set({ attempts: record.attempts + 1 })
    .where(eq(phoneVerifications.id, record.id));

  // Constant-time comparison using hash
  const submittedHash = hashCode(submittedCode.trim());
  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedHash, "hex"),
    Buffer.from(record.codeHash, "hex")
  );

  if (!isValid) {
    const attemptsLeft = MAX_ATTEMPTS - (record.attempts + 1);
    return { success: false, error: "invalid_code", attemptsLeft: Math.max(0, attemptsLeft) };
  }

  // Mark as verified
  await db
    .update(phoneVerifications)
    .set({ verified: true })
    .where(eq(phoneVerifications.id, record.id));

  return { success: true };
}
