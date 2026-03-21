/**
 * Twilio SMS Delivery Utility
 * Sends the final Grok-generated briefing to the user's phone number.
 */
import twilio from "twilio";

// Owner's primary email — used for admin routing and default account detection
export const OWNER_EMAIL = "lesterantoine@inboxbrief.org";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
  }
  return twilio(accountSid, authToken);
}

function getTwilioFromNumber(): string {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER must be set");
  return from;
}

export interface SmsSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

// Outbound-only footer appended to every briefing SMS
const OUTBOUND_FOOTER = "\n\nDo not reply. Support: support@inboxbrief.com";
// Max SMS body length (Twilio auto-splits at 160, but we target 500 per plan limit)
const MAX_SMS_CHARS = 500;

/**
 * Sends an SMS briefing to the specified phone number.
 * Appends an outbound-only footer and enforces the 500-char limit.
 * Messages over 160 chars are split by Twilio automatically.
 */
export async function sendSmsBriefing(
  toPhone: string,
  message: string
): Promise<SmsSendResult> {
  try {
    const client = getTwilioClient();
    const from = getTwilioFromNumber();

    // Normalize phone number — ensure E.164 format
    const normalized = toPhone.startsWith("+") ? toPhone : `+1${toPhone.replace(/\D/g, "")}`;

    // Enforce 500-char limit on the briefing body (before footer)
    const maxBody = MAX_SMS_CHARS - OUTBOUND_FOOTER.length;
    let body = message.length > maxBody
      ? message.slice(0, maxBody - 1).replace(/\s+\S*$/, "") + "…"
      : message;
    body = body + OUTBOUND_FOOTER;

    const result = await client.messages.create({
      body,
      from,
      to: normalized,
    });

    return { success: true, messageSid: result.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Twilio error";
    console.error("[Twilio] SMS send failed:", message);
    return { success: false, error: message };
  }
}

/** Validates a US phone number format. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/**
 * Generic SMS sender (alias for sendSmsBriefing, used by phone verification).
 */
export async function sendSms(toPhone: string, message: string): Promise<SmsSendResult> {
  return sendSmsBriefing(toPhone, message);
}
