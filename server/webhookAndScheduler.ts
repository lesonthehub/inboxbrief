/**
 * InboxBrief — Stripe Webhook Handler + SMS Cron Scheduler
 *
 * Webhook: /api/stripe/webhook
 * Scheduler: runs every minute, checks user schedules, triggers briefings
 */

import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { subscriptions, users } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { runBriefingPipeline } from "./briefingPipeline";
import { PLANS } from "./plans";

// ── Stripe Setup ──────────────────────────────────────────────────────────────

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

// ── Webhook Registration ──────────────────────────────────────────────────────

export function registerStripeWebhook(app: Express) {
  // MUST use raw body before json middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      if (!stripe) {
        console.warn("[Webhook] Stripe not configured");
        return res.json({ received: true });
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret ?? "");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Webhook] Signature verification failed:", message);
        return res.status(400).json({ error: `Webhook Error: ${message}` });
      }

      // Test event passthrough
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Event: ${event.type} (${event.id})`);

      try {
        await handleStripeEvent(event, stripe);
      } catch (err) {
        console.error("[Webhook] Handler error:", err);
      }

      return res.json({ received: true });
    }
  );
}

async function handleStripeEvent(event: Stripe.Event, stripe: Stripe) {
  const db = await getDb();
  if (!db) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id ?? "0");
      if (!userId) break;

      const subId = session.subscription as string;
      if (!subId) break;

      const stripeSub = await stripe.subscriptions.retrieve(subId);
      const priceId = stripeSub.items.data[0]?.price.id ?? "";
      const plan = getPlanByPriceId(priceId);

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subId,
        plan: plan ?? "pro",
        status: "active",
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      }).onDuplicateKeyUpdate({
        set: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subId,
          plan: plan ?? "pro",
          status: "active",
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
      });

      // Set default schedule times based on plan for new subscribers
      const defaultScheduleMap: Record<string, { scheduleType: string; scheduleTimes: string }> = {
        solo:       { scheduleType: "custom", scheduleTimes: "08:00" },
        trial:      { scheduleType: "custom", scheduleTimes: "08:00" },
        pro:        { scheduleType: "custom", scheduleTimes: "08:00,13:00" },
        business:   { scheduleType: "custom", scheduleTimes: "08:00,12:00,17:00" },
        enterprise: { scheduleType: "custom", scheduleTimes: "08:00,12:00,17:00" },
      };
      const planKey = (plan ?? "pro") as string;
      const defaultSched = defaultScheduleMap[planKey] ?? defaultScheduleMap.pro;
      // Only set default if user has no schedule yet (scheduleType is null or 'manual')
      const [existingUser] = await db.select({ scheduleType: users.scheduleType }).from(users).where(eq(users.id, userId)).limit(1);
      if (existingUser && (!existingUser.scheduleType || existingUser.scheduleType === "manual")) {
        await db.update(users).set({
          scheduleType: defaultSched.scheduleType,
          scheduleTimes: defaultSched.scheduleTimes,
        }).where(eq(users.id, userId));
        console.log(`[Webhook] Set default schedule for user ${userId} on plan ${planKey}: ${defaultSched.scheduleTimes}`);
      }

      console.log(`[Webhook] Subscription activated for user ${userId} on plan ${plan}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const existing = await db.select().from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, customerId)).limit(1);

      if (existing.length === 0) break;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = getPlanByPriceId(priceId);

      await db.update(subscriptions)
        .set({
          plan: plan ?? existing[0].plan,
          status: sub.status as "active" | "canceled" | "past_due" | "trialing" | "paused",
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        .where(eq(subscriptions.stripeCustomerId, customerId));

      console.log(`[Webhook] Subscription updated for customer ${customerId}: ${sub.status}`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await db.update(subscriptions)
        .set({ status: "canceled" })
        .where(eq(subscriptions.stripeCustomerId, customerId));

      console.log(`[Webhook] Subscription canceled for customer ${customerId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await db.update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.stripeCustomerId, customerId));

      console.log(`[Webhook] Payment failed for customer ${customerId}`);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await db.update(subscriptions)
        .set({ status: "active" })
        .where(eq(subscriptions.stripeCustomerId, customerId));

      console.log(`[Webhook] Invoice paid for customer ${customerId}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
}

function getPlanByPriceId(priceId: string): "starter" | "pro" | "business" | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) {
      return key as "starter" | "pro" | "business";
    }
  }
  return null;
}

// ── SMS Cron Scheduler ────────────────────────────────────────────────────────

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startSmsScheduler() {
  if (schedulerInterval) return;

  console.log("[Scheduler] SMS briefing scheduler started");

  // Run every minute
  schedulerInterval = setInterval(async () => {
    try {
      await runScheduledBriefings();
    } catch (err) {
      console.error("[Scheduler] Error:", err);
    }
  }, 60 * 1000);
}

async function runScheduledBriefings() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Only run at the top of each hour (minute 0) to avoid excessive API calls
  if (currentMinute !== 0) return;

  // Get all users with active subscriptions and non-manual schedules
  const activeUsers = await db
    .select({
      userId: users.id,
      scheduleType: users.scheduleType,
      scheduleTimes: users.scheduleTimes,
      timezone: users.timezone,
    })
    .from(users)
    .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
      )
    );

  for (const user of activeUsers) {
    if (!user.scheduleType || user.scheduleType === "manual") continue;

    const shouldRun = checkIfShouldRun(user.scheduleType, user.scheduleTimes, user.timezone, now);
    if (!shouldRun) continue;

    console.log(`[Scheduler] Triggering briefing for user ${user.userId} (${user.scheduleType})`);

    // Fire and forget — don't await to avoid blocking the scheduler
    runBriefingPipeline(user.userId, "scheduled").catch((err) => {
      console.error(`[Scheduler] Briefing failed for user ${user.userId}:`, err);
    });
  }
}

function checkIfShouldRun(
  scheduleType: string,
  scheduleTimes: string | null,
  timezone: string | null,
  now: Date
): boolean {
  const tz = timezone ?? "America/Chicago";

  // Get current hour in user's timezone
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(now)
  );

  switch (scheduleType) {
    case "daily_morning":
      return localHour === 8;
    case "daily_evening":
      return localHour === 18;
    case "twice_daily":
      return localHour === 8 || localHour === 17;
    case "custom": {
      if (!scheduleTimes) return false;
      const times = scheduleTimes.split(",").map((t) => t.trim());
      return times.some((t) => {
        const [h] = t.split(":").map(Number);
        return h === localHour;
      });
    }
    default:
      return false;
  }
}

export function stopSmsScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] SMS briefing scheduler stopped");
  }
}
