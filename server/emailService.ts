/**
 * emailService.ts
 * Sends transactional emails via SMTP (Gmail App Password or any SMTP provider).
 * Falls back to console logging in development if SMTP is not configured.
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@inboxbrief.org";
const FROM_NAME = process.env.FROM_NAME ?? "InboxBrief";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    // Dev fallback — log to console
    console.log(`[Email] SMTP not configured. Would send to ${opts.to}:`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body: ${opts.text ?? opts.html}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[Email] Sent to ${opts.to}: ${opts.subject}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${opts.to}:`, err);
    return false;
  }
}

/**
 * Send an email verification OTP to the user.
 */
export async function sendEmailVerificationOTP(
  email: string,
  code: string,
  name?: string | null
): Promise<boolean> {
  const displayName = name ?? "there";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111118;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">InboxBrief</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Email Verification</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;color:#a0a0b8;font-size:14px;">Hi ${displayName},</p>
          <p style="margin:0 0 28px;color:#e0e0f0;font-size:15px;line-height:1.6;">
            Enter this verification code to confirm your email address. The code expires in <strong>15 minutes</strong>.
          </p>
          <!-- OTP Box -->
          <div style="background:#1a1a2e;border:2px solid #4f46e5;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#fff;font-family:monospace;">${code}</span>
          </div>
          <p style="margin:0 0 8px;color:#6b6b8a;font-size:12px;line-height:1.6;">
            If you did not request this code, you can safely ignore this email. Your account will not be affected.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e1e2e;text-align:center;">
          <p style="margin:0;color:#4a4a6a;font-size:11px;">
            This is an automated message from InboxBrief. Do not reply to this email.<br>
            For support: <a href="mailto:support@inboxbrief.com" style="color:#6366f1;text-decoration:none;">support@inboxbrief.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${displayName},\n\nYour InboxBrief email verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, ignore this email.\n\n— InboxBrief Team\nDo not reply to this email. For support: support@inboxbrief.com`;

  return sendEmail({
    to: email,
    subject: `${code} — Your InboxBrief Verification Code`,
    html,
    text,
  });
}
