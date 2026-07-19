/**
 * Briefing Pipeline Orchestrator
 * Fetch → Classify → Summarize → Encrypt → SMS
 *
 * Trial rules:
 *   - Max 2 briefings/day during trial
 *   - End-of-trial nudge SMS sent on day 5 and day 6 of 7-day trial
 *   - First over-limit: free grace briefing + upgrade nudge SMS
 *   - Second+ over-limit: hard block with upgrade link
 *
 * Security: Raw email text lives only in memory during this pipeline.
 * Nothing is persisted in plaintext.
 */
import { eq, and, gte, count } from "drizzle-orm";
import { getDb } from "./db";
import { emailAccounts, briefingLogs, subscriptions, users } from "../drizzle/schema";
import { decrypt, encrypt } from "./encryption";
import { fetchGmailEmails, fetchOutlookEmails } from "./emailProviders";
import { classifyEmails, generateSmsBriefing } from "./grok";
import { sendSmsBriefing } from "./sms";
import { getEmailLimit, isSubscriptionActive, getManualBriefingLimit, planAllowsOutlook, PLANS } from "./plans";
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
  trialWarning?: string;
  upgradePrompted?: boolean;
}

const TRIAL_DAILY_LIMIT = 2;
const PRICING_URL = "https://inboxbrief.org/pricing";

/**
 * Count briefings sent today for a user.
 */
async function countBriefingsToday(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ cnt: count() })
    .from(briefingLogs)
    .where(and(eq(briefingLogs.userId, userId), gte(briefingLogs.createdAt, startOfDay)));
  return Number(rows[0]?.cnt ?? 0);
}

/**
 * Send a trial-ending nudge SMS if within the last 2 days of trial.
 * Uses boolean flags (trialNudge5Sent, trialNudge6Sent) to prevent duplicate nudges.
 */
async function maybeSendTrialNudge(
  user: { id: number; phone: string; trialEndsAt: Date | null; trialNudge5Sent?: boolean; trialNudge6Sent?: boolean; name?: string | null },
  upgradeUrl: string
): Promise<void> {
  if (!user.trialEndsAt || !user.phone) return;

  const now = new Date();
  const msLeft = user.trialEndsAt.getTime() - now.getTime();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);

  // Only nudge in the last 2 days
  if (daysLeft > 2 || daysLeft <= 0) return;

  const daysLeftRounded = Math.ceil(daysLeft);
  const db = await getDb();

  if (daysLeftRounded <= 1 && !user.trialNudge6Sent) {
    const nudgeMsg = `⏰ InboxBrief: Your free trial ends tomorrow! Don't lose your daily briefings. Subscribe now to keep the flow going: ${upgradeUrl}`;
    await sendSmsBriefing(user.phone, nudgeMsg);
    if (db) await db.update(users).set({ trialNudge6Sent: true }).where(eq(users.id, user.id));
  } else if (daysLeftRounded === 2 && !user.trialNudge5Sent) {
    const nudgeMsg = `⏰ InboxBrief: Your free trial ends in 2 days. Lock in your plan now and never miss a key email: ${upgradeUrl}`;
    await sendSmsBriefing(user.phone, nudgeMsg);
    if (db) await db.update(users).set({ trialNudge5Sent: true }).where(eq(users.id, user.id));
  }
}

/**
 * Runs the full briefing pipeline for a user.
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

  // ── Account suspension gate ───────────────────────────────────────
  // allowBriefingWhileSuspended lets owners/admins keep briefings running for
  // suspended accounts (e.g. demo/test accounts used for verification recordings)
  const briefingOverride = !!(user as any).allowBriefingWhileSuspended;
  if (!user.isActive && !briefingOverride) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "Account suspended. Please contact support@inboxbrief.com." };
  }

  // ── Phone verification gate ──────────────────────────────────────────────
  if (!user.phoneVerified) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "Phone number not verified. Please verify your phone number in Settings before sending briefings." };
  }

  const subRows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const sub = subRows[0];

  const now = new Date();
  const isTrialActive = sub?.plan === "trial" && sub?.status === "trialing" && user.trialEndsAt && user.trialEndsAt > now;
  const isPaidActive = sub && isSubscriptionActive(sub.status) && sub.plan !== "trial";

  // ── Service grant bypass (owner-granted free access) ────────────────────────
  const { serviceGrants } = await import("../drizzle/schema");
  const { and: _and, eq: _eq } = await import("drizzle-orm");
  const [activeGrant] = await db.select().from(serviceGrants)
    .where(_and(_eq(serviceGrants.userId, userId), _eq(serviceGrants.isActive, true)))
    .limit(1);
  const hasServiceGrant = !!activeGrant && (!activeGrant.expiresAt || activeGrant.expiresAt > now);

  // ── Test account bypass ──────────────────────────────────────────────────────
  const isTestAccount = !!(user as any).isTestAccount;

  if (!isTrialActive && !isPaidActive && !hasServiceGrant && !isTestAccount) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "No active subscription. Please subscribe to send briefings." };
  }

  // Effective plan: service grant > test account (business) > paid plan > trial
  const grantPlan = hasServiceGrant ? activeGrant.plan : isTestAccount ? "business" : null;
  const currentPlan = (grantPlan ?? sub?.plan ?? "trial") as PlanId;
  const emailLimit = getEmailLimit(currentPlan);

  // ── Trial daily limit enforcement ────────────────────────────────────────
  let isGraceBriefing = false;
  let upgradePrompted = false;

  // Owner is never subject to grace limits
  const isOwner = user.role === "owner";

  if (isTrialActive) {
    const todayCount = await countBriefingsToday(userId);

    if (todayCount >= TRIAL_DAILY_LIMIT) {
      if (isOwner) {
        // Owner always gets through — no grace tracking
      } else {
        // Check if grace briefing is available this week (once per 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const graceAvailableThisWeek = !user.lastGraceBriefingAt || user.lastGraceBriefingAt < sevenDaysAgo;

        if (graceAvailableThisWeek) {
          // Give one free briefing this week
          isGraceBriefing = true;
          upgradePrompted = true;
          await db.update(users).set({ graceBriefingUsed: true, lastGraceBriefingAt: new Date() }).where(eq(users.id, userId));
        } else {
          // Hard block — grace already used this week
          await sendSmsBriefing(
            user.phone,
            `📬 InboxBrief: You've reached your daily limit of ${TRIAL_DAILY_LIMIT} briefings on the free trial. Upgrade to keep the flow going: ${PRICING_URL}`
          );
          return {
            success: false,
            smsSent: false,
            emailsFetched: 0,
            highPriorityCount: 0,
            generalCount: 0,
            ignoredCount: 0,
            error: `Daily trial limit of ${TRIAL_DAILY_LIMIT} briefings reached. Upgrade your plan to continue.`,
            upgradePrompted: true,
          };
        }
      }
    }

    // Send trial-ending nudge if within last 2 days
    await maybeSendTrialNudge(
      { id: user.id, phone: user.phone, trialEndsAt: user.trialEndsAt ?? null, trialNudge5Sent: user.trialNudge5Sent, trialNudge6Sent: user.trialNudge6Sent, name: user.name },
      PRICING_URL
    );
  }

  // ── Manual briefing limit (Pro/Business = 2/day, Solo = 0, Enterprise = unlimited) ──
  if (triggerType === "manual" && isPaidActive) {
    const manualLimit = getManualBriefingLimit(currentPlan);
    if (manualLimit === 0) {
      return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0,
        error: "Manual briefings are not available on the Solo plan. Please set up a scheduled briefing in Settings." };
    }
    if (manualLimit > 0) {
      const today = new Date().toISOString().slice(0, 10);
      let manualCount = 0;
      if (user.manualBriefingsDate === today) {
        manualCount = user.manualBriefingsToday ?? 0;
      }
      if (manualCount >= manualLimit) {
        return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0,
          error: `You've used all ${manualLimit} manual briefings allowed today on the ${currentPlan} plan. Scheduled briefings will continue as normal.` };
      }
      await db.update(users).set({
        manualBriefingsToday: manualCount + 1,
        manualBriefingsDate: today,
      }).where(eq(users.id, userId));
    }
  }

  // ── Paid plan: over-limit check ───────────────────────────────────────────
  if (isPaidActive && emailLimit !== -1) {
    const todayCount = await countBriefingsToday(userId);
    const dailyBriefingLimit = PLANS[currentPlan]?.smsPerDay ?? 3;

    if (todayCount >= dailyBriefingLimit) {
      if (isOwner) {
        // Owner always gets through
      } else {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const graceAvailableThisWeek = !user.lastGraceBriefingAt || user.lastGraceBriefingAt < sevenDaysAgo;

        if (graceAvailableThisWeek) {
          isGraceBriefing = true;
          upgradePrompted = true;
          await db.update(users).set({ graceBriefingUsed: true, lastGraceBriefingAt: new Date() }).where(eq(users.id, userId));
        } else {
          await sendSmsBriefing(
            user.phone,
            `📬 InboxBrief: You've hit your daily briefing limit. Upgrade to a higher plan for more: ${PRICING_URL}`
          );
          return {
            success: false,
            smsSent: false,
            emailsFetched: 0,
            highPriorityCount: 0,
            generalCount: 0,
            ignoredCount: 0,
            error: "Daily briefing limit reached. Upgrade your plan for more briefings.",
            upgradePrompted: true,
          };
        }
      }
    }
  }

  // 2. Load connected email accounts (Solo plan: Gmail only)
  const allAccounts = await db.select().from(emailAccounts)
    .where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.isActive, true)));
  const accounts = planAllowsOutlook(currentPlan)
    ? allAccounts
    : allAccounts.filter(a => a.provider === "gmail");

  if (accounts.length === 0) {
    return { success: false, smsSent: false, emailsFetched: 0, highPriorityCount: 0, generalCount: 0, ignoredCount: 0, error: "No email accounts connected" };
  }

  // 3. Fetch emails from all connected accounts
  const allRawEmails: Array<{ id: string; subject: string; from: string; snippet: string; date: Date }> = [];

  for (const account of accounts) {
    try {
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

  const limitedEmails = emailLimit === -1 ? allRawEmails : allRawEmails.slice(0, emailLimit);

  // 4. Classify with AI
  const classified = await classifyEmails(limitedEmails);
  const highPriority = classified.filter((e) => e.category === "high_priority");
  const general = classified.filter((e) => e.category === "general");
  const ignored = classified.filter((e) => e.category === "ignore");

  // 5. Generate SMS briefing (raw text in-memory only)
  const briefingText = await generateSmsBriefing(highPriority, general, user.name ?? "there");

  // 6. If this is a grace briefing, prepend the "on us" message (once per week per user)
  const userName = user.name ?? "there";
  const finalBriefingText = isGraceBriefing
    ? `You hit your limit, but we know today is busy. This one's on us. 💙\n\n${briefingText}\n\nUpgrade for unlimited: ${PRICING_URL}\n\nDo not reply. Support: support@inboxbrief.com`
    : briefingText;

  // 7. Encrypt summary before storing
  const encryptedSummary = encrypt(finalBriefingText);

  // 8. Send SMS via Twilio
  const smsResult = await sendSmsBriefing(user.phone, finalBriefingText);

  // 9. Log the briefing
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

  // 10. Wipe raw text from memory
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
    upgradePrompted,
    trialWarning: isGraceBriefing
      ? `You hit your daily limit — this briefing was on us. Upgrade to keep the flow going: ${PRICING_URL}`
      : undefined,
  };
}
