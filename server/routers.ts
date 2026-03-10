import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserById, updateUser,
  getSubscriptionByUserId, upsertSubscription,
  getEmailAccountsByUserId, insertEmailAccount, deactivateEmailAccount,
  getBriefingLogsByUserId,
} from "./db";
import { encrypt, safeDecrypt } from "./encryption";
import { getGmailAuthUrl, getOutlookAuthUrl } from "./emailProviders";
import { runBriefingPipeline } from "./briefingPipeline";
import { createCheckoutSession, createPortalSession } from "./stripeProducts";
import { PLANS, isSubscriptionActive } from "./plans";
import { OWNER_EMAIL } from "./sms";

// ─── Auth Router ───────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Onboarding Router ──────────────────────────────────────────────────────────

const onboardingRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      onboardingComplete: user?.onboardingComplete ?? false,
      phone: user?.phone ?? null,
      businessType: user?.businessType ?? null,
      emailVolume: user?.emailVolume ?? null,
      primaryGoal: user?.primaryGoal ?? null,
    };
  }),

  complete: protectedProcedure
    .input(z.object({
      phone: z.string().min(10).max(20),
      businessType: z.string().min(1).max(128),
      emailVolume: z.enum(["under_50", "50_200", "200_500", "over_500"]),
      primaryGoal: z.enum(["lead_tracking", "client_updates", "general_inbox", "all_of_above"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await updateUser(ctx.user.id, {
        phone: input.phone,
        businessType: input.businessType,
        emailVolume: input.emailVolume,
        primaryGoal: input.primaryGoal,
        onboardingComplete: true,
        trialStartedAt: now,
        trialEndsAt,
        trialUsed: true,
      });

      // Activate Business-tier trial for 7 days
      await upsertSubscription(ctx.user.id, {
        plan: "trial",
        status: "trialing",
        currentPeriodEnd: trialEndsAt,
      });

      return { success: true, trialEndsAt };
    }),
});

// ─── Subscription Router ──────────────────────────────────────────────────────────

const subscriptionRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getSubscriptionByUserId(ctx.user.id);
    const user = await getUserById(ctx.user.id);
    const now = new Date();

    const isTrialActive = sub?.plan === "trial" && sub?.status === "trialing"
      && user?.trialEndsAt && user.trialEndsAt > now;
    const isPaidActive = sub && isSubscriptionActive(sub.status) && sub.plan !== "trial";

    return {
      plan: sub?.plan ?? null,
      status: sub?.status ?? null,
      isActive: !!(isTrialActive || isPaidActive),
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      trialEndsAt: user?.trialEndsAt ?? null,
      hasStripeSubscription: !!sub?.stripeSubscriptionId,
      planDetails: sub?.plan ? PLANS[sub.plan] : null,
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["starter", "pro", "business"]),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const url = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: user.email ?? OWNER_EMAIL,
        userName: user.name ?? "InboxBrief User",
        plan: input.plan,
        origin: input.origin,
      });

      return { url };
    }),

  createPortal: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      if (!sub?.stripeCustomerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active Stripe subscription found" });
      }
      const url = await createPortalSession(sub.stripeCustomerId, input.origin);
      return { url };
    }),

  getPlans: publicProcedure.query(() => Object.values(PLANS)),
});

// ─── Email Accounts Router ──────────────────────────────────────────────────────────

const emailAccountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await getEmailAccountsByUserId(ctx.user.id);
    return accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      emailAddress: a.emailAddress,
      lastFetchedAt: a.lastFetchedAt,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }));
  }),

  getGmailAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .query(async ({ ctx, input }) => {
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64");
      const url = getGmailAuthUrl(state);
      return { url };
    }),

  getOutlookAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .query(async ({ ctx, input }) => {
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64");
      const url = getOutlookAuthUrl(state);
      return { url };
    }),

  disconnect: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deactivateEmailAccount(input.accountId, ctx.user.id);
      return { success: true };
    }),
});

// ─── Briefing Router ───────────────────────────────────────────────────────────────

const briefingRouter = router({
  trigger: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await runBriefingPipeline(ctx.user.id, "manual");
    if (!result.success) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.error ?? "Briefing failed" });
    }
    return result;
  }),

  history: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const logs = await getBriefingLogsByUserId(ctx.user.id, input.limit);
      return logs.map((log) => ({
        id: log.id,
        emailsFetched: log.emailsFetched,
        highPriorityCount: log.highPriorityCount,
        generalCount: log.generalCount,
        ignoredCount: log.ignoredCount,
        smsStatus: log.smsStatus,
        triggerType: log.triggerType,
        planAtTime: log.planAtTime,
        createdAt: log.createdAt,
        summary: safeDecrypt(log.encryptedSummary),
      }));
    }),
});

// ─── Settings Router ───────────────────────────────────────────────────────────────

const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      phone: user?.phone ?? null,
      scheduleType: user?.scheduleType ?? "manual",
      scheduleTimes: user?.scheduleTimes ?? "08:00",
      timezone: user?.timezone ?? "America/Chicago",
    };
  }),

  update: protectedProcedure
    .input(z.object({
      phone: z.string().min(10).max(20).optional(),
      scheduleType: z.enum(["manual", "daily_morning", "daily_evening", "twice_daily", "custom"]).optional(),
      scheduleTimes: z.string().max(255).optional(),
      timezone: z.string().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  onboarding: onboardingRouter,
  subscription: subscriptionRouter,
  emailAccounts: emailAccountsRouter,
  briefing: briefingRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
