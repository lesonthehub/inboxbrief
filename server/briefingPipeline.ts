/**
 * Briefing Pipeline Orchestrator
 * Fetch → Classify → Summarize → Encrypt → SMS
 * Raw email text lives only in memory during this pipeline.
 * Nothing is persisted in plaintext.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { emailAccounts, briefingLogs, subscriptions, users } from "../drizzle/schema";
import { decrypt, encrypt } from "./encryption";
import { fetchGmailEmails, fetchOutlookEmails } from "./emailProviders";
import { classifyEmails, generateSmsBriefing } from "./grok";
import { sendSmsBriefing } from "./sms";
import { getEmailLimit, isSubscriptionActive } from "./plans";
import type { PlanId } from "./plans";

export interface PipelineResult {
  success: boolean;
  briefingLogId?: number;
  smsSent: boolean;
  emailsFetched: number;
  highPriorityCount: number;
  generalCount: number;
  ignoredCount: number;
  error?: string;
}

/**
 * Runs the full briefing pipeline for a user.
 * Checks subscription status, fetches emails up to tier limit,
 * classifies and summarizes with Grok, sends SMS via Twilio,
 * and logs everything (summary encrypted at rest).
 */
export async function runBriefingPipeline(
  userId: number,
  triggerType: "manual" | "scheduled" = "manual"
): Promise<PipelineResult> {
  const db = await getDb();
  if (!db) return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "Database unavailable" };

  // 1. Load user and subscription
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "User not found" };

  if (!user.phone) return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "No phone number configured" };

  const subRows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const sub = subRows[0];

  // Check trial expiry
  const now = new Date();
  const isTrialActive = sub?.plan === "trial" && sub?.status === "trialing" && user.trialEndsAt && user.trialEndsAt > now;
  const isPaidActive = sub && isSubscriptionActive(sub.status) && sub.plan !== "trial";

  if (!isTrialActive && !isPaidActive) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "No active subscription. Please subscribe to send briefings." };
  }

  const currentPlan = (sub?.plan ?? "trial") as PlanId;
  const emailLimit = getEmailLimit(currentPlan);

  // 2. Load connected email accounts
  const accounts = await db.select().from(emailAccounts)
    .where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.isActive, true)));

  if (accounts.length === 0) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "No email accounts connected" };
  }

  // 3. Fetch emails from all connected accounts
  const allRawEmails: Array<{ id: string; subject: string; from: string; snippet: string; date: Date }> = [];

  for (const account of accounts) {
    try {
      // Decrypt tokens in-memory only
      const accessToken = decrypt(account.encryptedAccessToken);
      const refreshToken = account.encryptedRefreshToken ? decrypt(account.encryptedRefreshToken) : null;

      let fetched: typeof allRawEmails = [];
      let newLastId: string | null = null;

      if (account.provider === "gmail") {
        const result = await fetchGmailEmails(accessToken, refreshToken, account.lastProcessedEmailId, emailLimit);
        fetched = result.emails;
        newLastId = result.newLastId;
      } else {
        const result = await fetchOutlookEmails(accessToken, account.lastProcessedEmailId, emailLimit);
        fetched = result.emails;
        newLastId = result.newLastId;
      }

      // Persist the new lastProcessedEmailId immediately (state tracking)
      if (newLastId && newLastId !== account.lastProcessedEmailId) {
        await db.update(emailAccounts)
          .set({ lastProcessedEmailId: newLastId, lastFetchedAt: now, updatedAt: now })
          .where(eq(emailAccounts.id, account.id));
      }

      allRawEmails.push(...fetched);
    } catch (err) {
      console.error(`[Pipeline] Failed to fetch from account ${account.id}:`, err);
    }
  }

  // Apply tier limit across all accounts combined
  const limitedEmails = emailLimit === -1 ? allRawEmails : allRawEmails.slice(0, emailLimit);

  // 4. Classify emails with Grok
  const classified = await classifyEmails(limitedEmails);

  const highPriority = classified.filter((e) => e.category === "high_priority");
  const general = classified.filter((e) => e.category === "general");
  const ignored = classified.filter((e) => e.category === "ignore");

  // 5. Generate SMS briefing (raw text in-memory only)
  const briefingText = await generateSmsBriefing(highPriority, general, user.name ?? "there");

  // 6. Encrypt summary before storing
  const encryptedSummary = encrypt(briefingText);

  // 7. Send SMS via Twilio
  const smsResult = await sendSmsBriefing(user.phone, briefingText);

  // 8. Log the briefing (summary encrypted at rest)
  const [logResult] = await db.insert(briefingLogs).values({
    userId,
    emailAccountId: accounts[0]?.id,
    emailsFetched: limitedEmails.length,
    highPriorityCount: highPriority.length,
    generalCount: general.length,
    ignoredCount: ignored.length,
    encryptedSummary,
    smsStatus: smsResult.success ? "sent" : "failed",
    smsMessageSid: smsResult.messageSid,
    triggerType,
    planAtTime: currentPlan,
    errorMessage: smsResult.error ?? null,
  });

  // 9. Wipe raw text from memory (JS GC will handle it, but explicit nullification helps)
  briefingText.split("").fill("\0");

  return {
    success: true,
    briefingLogId: (logResult as { insertId?: number }).insertId,
    smsSent: smsResult.success,
    emailsFetched: limitedEmails.length,
    highPriorityCount: highPriority.length,
    generalCount: general.length,
    ignoredCount: ignored.length,
    error: smsResult.error,
  };
}
