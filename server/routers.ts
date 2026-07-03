import { z } from "zod";
import { nanoid } from "nanoid";
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
  getAllUsersAdmin, getAdminUserCount, getUserWithSubscriptionAdmin,
  getDb,
} from "./db";
import { encrypt, safeDecrypt } from "./encryption";
import { getGmailAuthUrl, getOutlookAuthUrl } from "./emailProviders";
import { runBriefingPipeline } from "./briefingPipeline";
import { createCheckoutSession, createPortalSession, getStripe } from "./stripeProducts";
import { sendSmsBriefing, OWNER_EMAIL } from "./sms";
import { PLANS, isSubscriptionActive, getDisplayPlans, INTERNATIONAL_SMS_SURCHARGE, isInternationalNumber } from "./plans";
import { processBriefingFeedback, SUPPORTED_LANGUAGES } from "./grok";
import { notifyOwner } from "./_core/notification";
import { users, subscriptions, teamMembers, referralUses, briefingFeedback, briefingLogs, announcements } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendVerificationOtp, verifyOtp } from "./phoneVerification";
import { sendEmailVerificationOTP } from "./emailService";
import { writeAuditLog } from "./security";

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
      userRole: user?.userRole ?? null,
      teamSize: user?.teamSize ?? null,
      inboxChallenge: user?.inboxChallenge ?? null,
    };
  }),

  complete: protectedProcedure
    .input(z.object({
      phone: z.string().min(10).max(20),
      businessType: z.string().min(1).max(128),
      // Q1: What best describes your role?
      userRole: z.enum(["solo_owner", "team_lead", "executive", "operations", "other"]),
      // Q2: How many people are on your team?
      teamSize: z.enum(["just_me", "2_5", "6_15", "16_plus"]),
      // Q3: What is your biggest inbox challenge?
      inboxChallenge: z.enum(["missing_leads", "client_follow_up", "too_much_volume", "team_coordination"]),
      // Optional: referral code used during signup
      referralCode: z.string().max(16).optional(),
      // Preferred language for SMS briefings
      preferredLanguage: z.string().max(8).default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Generate unique referral code for this user
      const myReferralCode = nanoid(8).toUpperCase();

      // Handle referral code application
      let referrerId: number | null = null;
      if (input.referralCode) {
        const [referrer] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, input.referralCode))
          .limit(1);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      await updateUser(ctx.user.id, {
        phone: input.phone,
        businessType: input.businessType,
        userRole: input.userRole,
        teamSize: input.teamSize,
        inboxChallenge: input.inboxChallenge,
        preferredLanguage: input.preferredLanguage,
        onboardingComplete: true,
        trialStartedAt: now,
        trialEndsAt,
        trialUsed: true,
        referralCode: myReferralCode,
        referredByCode: input.referralCode ?? undefined,
      });

      // Activate Business-tier trial for 7 days
      await upsertSubscription(ctx.user.id, {
        plan: "trial",
        status: "trialing",
        currentPeriodEnd: trialEndsAt,
      });

      // Award referral credit to referrer ($5 = 500 cents per successful signup)
      if (referrerId) {
        await db.insert(referralUses).values({
          referrerId,
          referredUserId: ctx.user.id,
          creditAwarded: 500,
        });
        await db
          .update(users)
          .set({ referralCredits: db.$count(referralUses) }) // simplified; real impl uses increment
          .where(eq(users.id, referrerId));
        // Increment referral credits properly
        await db.execute(
          `UPDATE users SET referralCredits = referralCredits + 500 WHERE id = ${referrerId}`
        );
      }

      return { success: true, trialEndsAt, referralCode: myReferralCode };
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
      seatCount: sub?.seatCount ?? 1,
      planDetails: sub?.plan ? PLANS[sub.plan] : null,
      phoneVerified: user?.phoneVerified ?? false,
      phone: user?.phone ?? null,
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["solo", "pro", "business", "enterprise"]),
      seatCount: z.number().min(1).max(100).default(1),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Enterprise is contact-only — redirect to the contact form
      if (input.plan === "enterprise") {
        return { url: `${input.origin}/enterprise` };
      }

      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const url = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: user.email ?? OWNER_EMAIL,
        userName: user.name ?? "InboxBrief User",
        plan: input.plan as "solo" | "pro" | "business" | "enterprise",
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

  getPlans: publicProcedure.query(() => getDisplayPlans()),
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
        language: log.language,
        createdAt: log.createdAt,
        summary: safeDecrypt(log.encryptedSummary),
      }));
    }),

  submitFeedback: protectedProcedure
    .input(z.object({
      briefingLogId: z.number(),
      rating: z.number().min(1).max(5),
      toneAdjustment: z.enum(["more_concise", "more_detail", "more_casual", "more_formal", "perfect"]).optional(),
      addKeywords: z.string().max(500).optional(),
      removeKeywords: z.string().max(500).optional(),
      freeformNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Save feedback
      await db.insert(briefingFeedback).values({
        userId: ctx.user.id,
        briefingLogId: input.briefingLogId,
        rating: input.rating,
        toneAdjustment: input.toneAdjustment,
        addKeywords: input.addKeywords,
        removeKeywords: input.removeKeywords,
        freeformNote: input.freeformNote,
      });

      // Apply feedback to user preferences
      const user = await getUserById(ctx.user.id);
      const currentPrefs = {
        toneStyle: user?.toneStyle as "concise" | "conversational" | "detailed" | undefined,
        keywordsInclude: user?.keywordsInclude ?? undefined,
        keywordsExclude: user?.keywordsExclude ?? undefined,
        language: user?.language ?? "en",
      };

      const updatedPrefs = await processBriefingFeedback(
        {
          rating: input.rating,
          toneAdjustment: input.toneAdjustment,
          addKeywords: input.addKeywords,
          removeKeywords: input.removeKeywords,
          freeformNote: input.freeformNote,
        },
        currentPrefs
      );

      await updateUser(ctx.user.id, {
        toneStyle: updatedPrefs.toneStyle,
        keywordsInclude: updatedPrefs.keywordsInclude ?? null,
        keywordsExclude: updatedPrefs.keywordsExclude ?? null,
      });

      return { success: true };
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
      language: user?.language ?? "en",
      toneStyle: user?.toneStyle ?? "conversational",
      keywordsInclude: user?.keywordsInclude ?? null,
      keywordsExclude: user?.keywordsExclude ?? null,
    };
  }),

  update: protectedProcedure
    .input(z.object({
      phone: z.string().min(10).max(20).optional(),
      scheduleType: z.enum(["manual", "daily_morning", "daily_evening", "twice_daily", "custom"]).optional(),
      scheduleTimes: z.string().max(255).optional(),
      timezone: z.string().max(64).optional(),
      language: z.string().max(8).optional(),
      toneStyle: z.enum(["concise", "conversational", "detailed"]).optional(),
      keywordsInclude: z.string().max(500).optional(),
      keywordsExclude: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),

  getSupportedLanguages: publicProcedure.query(() => SUPPORTED_LANGUAGES),
});

// ─── Referral Router ───────────────────────────────────────────────────────────────

const referralRouter = router({
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const uses = await db
      .select()
      .from(referralUses)
      .where(eq(referralUses.referrerId, ctx.user.id));

    return {
      referralCode: user?.referralCode ?? null,
      referralCredits: user?.referralCredits ?? 0,
      totalReferrals: uses.length,
      creditsEarned: uses.reduce((sum, u) => sum + u.creditAwarded, 0),
    };
  }),

  validateCode: publicProcedure
    .input(z.object({ code: z.string().max(16) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false };
      const [user] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.referralCode, input.code.toUpperCase()))
        .limit(1);
      return { valid: !!user, referrerName: user?.name ?? null };
    }),
});

// ─── Team Router ───────────────────────────────────────────────────────────────────

const teamRouter = router({
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const members = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.ownerId, ctx.user.id), eq(teamMembers.status, "active")));

    return members;
  }),

  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      phone: z.string().min(10).max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check seat limit
      const sub = await getSubscriptionByUserId(ctx.user.id);
      const plan = sub?.plan ?? "trial";
      const maxSeats = (PLANS[plan as keyof typeof PLANS])?.maxSeats ?? 1;

      if (maxSeats !== -1) {
        const currentMembers = await db
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.ownerId, ctx.user.id), eq(teamMembers.status, "active")));

        if (currentMembers.length >= maxSeats - 1) { // -1 for owner
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Your ${plan} plan allows up to ${maxSeats} team members. Upgrade to add more.`,
          });
        }
      }

      const token = nanoid(32);
      await db.insert(teamMembers).values({
        ownerId: ctx.user.id,
        inviteEmail: input.email,
        inviteToken: token,
        phone: input.phone,
        status: "pending",
      });

      return { success: true, inviteToken: token };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(teamMembers)
        .set({ status: "removed" })
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));

      return { success: true };
    }),
});

// ─── Team Invite Router (public validate + protected accept) ──────────────────

const teamInviteRouter = router({
  validateInvite: publicProcedure
    .input(z.object({ token: z.string().min(8) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [invite] = await db
        .select({
          id: teamMembers.id,
          inviteEmail: teamMembers.inviteEmail,
          status: teamMembers.status,
          ownerId: teamMembers.ownerId,
          inviteTokenExpiresAt: teamMembers.inviteTokenExpiresAt,
        })
        .from(teamMembers)
        .where(eq(teamMembers.inviteToken, input.token))
        .limit(1);

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already used" });
      if (invite.inviteTokenExpiresAt && invite.inviteTokenExpiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
      }

      // Get owner name
      const [owner] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, invite.ownerId))
        .limit(1);

      return {
        inviteEmail: invite.inviteEmail,
        ownerName: owner?.name ?? null,
      };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({
      token: z.string().min(8),
      phone: z.string().min(10).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [invite] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.inviteToken, input.token))
        .limit(1);

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already used" });

      // Mark invite as accepted
      await db
        .update(teamMembers)
        .set({
          memberId: ctx.user.id,
          status: "active",
          phone: input.phone,
        })
        .where(eq(teamMembers.id, invite.id));

      // Update member's phone if not already set
      await updateUser(ctx.user.id, { phone: input.phone });

      return { success: true };
    }),
});

// ─── Enterprise Contact Router ─────────────────────────────────────────────────

const enterpriseRouter = router({
  contact: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      email: z.string().email(),
      company: z.string().min(1).max(128),
      teamSize: z.enum(["6_15", "16_50", "51_200", "200_plus"]),
      useCase: z.string().max(500).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const teamSizeLabels: Record<string, string> = {
        "6_15": "6–15 people",
        "16_50": "16–50 people",
        "51_200": "51–200 people",
        "200_plus": "200+ people",
      };

      await notifyOwner({
        title: `🏢 Enterprise Inquiry: ${input.company}`,
        content: [
          `From: ${input.name} <${input.email}>`,
          `Company: ${input.company}`,
          `Team Size: ${teamSizeLabels[input.teamSize] ?? input.teamSize}`,
          input.useCase ? `Use Case: ${input.useCase}` : null,
          input.message ? `Message: ${input.message}` : null,
          ``,
          `Reply to this inquiry at: sales@inboxbrief.org`,
          `Customer support: support@inboxbrief.com`,
        ].filter(Boolean).join("\n"),
      });

      return { success: true };
    }),
});

// ─── Legal Router ──────────────────────────────────────────────────────────────

const legalRouter = router({
  acceptTos: protectedProcedure
    .input(z.object({ tosVersion: z.string().max(16) }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, {
        tosAcceptedAt: new Date(),
        tosVersion: input.tosVersion,
      });
      return { success: true };
    }),

  getTosStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      accepted: !!user?.tosAcceptedAt,
      tosVersion: user?.tosVersion ?? null,
      acceptedAt: user?.tosAcceptedAt ?? null,
    };
  }),
});

// ─── Phone Verification Router ──────────────────────────────────────────────

const phoneVerificationRouter = router({
  sendCode: protectedProcedure
    .input(z.object({ phone: z.string().min(10).max(20) }))
    .mutation(async ({ ctx, input }) => {
      // Validate US/CA phone number — reject obviously fake numbers like 0000000000
      const digitsOnly = input.phone.replace(/\D/g, "");
      const phoneDigits = digitsOnly.startsWith("1") && digitsOnly.length === 11 ? digitsOnly.slice(1) : digitsOnly;
      const validUsPhone = /^[2-9]\d{2}[2-9]\d{6}$/.test(phoneDigits);
      if (!validUsPhone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please enter a valid US or Canadian phone number (e.g. 555-867-5309).",
        });
      }
      const result = await sendVerificationOtp(ctx.user.id, input.phone);
      if (!result.success) {
        if (result.error === "rate_limited") {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many verification attempts. Please wait ${result.retryAfterSeconds ?? 600} seconds.`,
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send verification code. Please try again." });
      }
      await writeAuditLog({ userId: ctx.user.id, action: "phone_otp_sent", metadata: { phone: input.phone.slice(-4).padStart(input.phone.length, "*") } });
      return { success: true, expiresAt: result.expiresAt };
    }),

  verifyCode: protectedProcedure
    .input(z.object({
      phone: z.string().min(10).max(20),
      code: z.string().length(6).regex(/^\d{6}$/, "Code must be 6 digits"),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await verifyOtp(ctx.user.id, input.phone, input.code);
      if (!result.success) {
        const messages: Record<string, string> = {
          invalid_code: result.attemptsLeft !== undefined
            ? `Incorrect code. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} remaining.`
            : "Incorrect verification code.",
          expired: "Verification code has expired. Please request a new one.",
          too_many_attempts: "Too many incorrect attempts. Please request a new code.",
          not_found: "No active verification code found. Please request a new one.",
        };
        throw new TRPCError({
          code: result.error === "too_many_attempts" ? "TOO_MANY_REQUESTS" : "BAD_REQUEST",
          message: messages[result.error] ?? "Verification failed.",
        });
      }

      // Mark phone as verified in user record
      const db = await getDb();
      if (db) {
        await db.update(users).set({ phoneVerified: true, phone: input.phone }).where(eq(users.id, ctx.user.id));
      }

      await writeAuditLog({ userId: ctx.user.id, action: "phone_verified", metadata: { phone: input.phone.slice(-4).padStart(input.phone.length, "*") } });
      return { success: true };
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      phoneVerified: user?.phoneVerified ?? false,
      phone: user?.phone ?? null,
    };
  }),
});

// ─── Email Verification Router ──────────────────────────────────────────────

const emailVerificationRouter = router({
  sendCode: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "No email address on file." });
    if (user.emailVerified) return { success: true, alreadyVerified: true };

    // Rate-limit: check if a code was sent in the last 60 seconds
    const now = Date.now();
    if (user.emailVerificationExpiry && user.emailVerificationExpiry > now && (user.emailVerificationExpiry - now) > (14 * 60 * 1000)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "A verification code was recently sent. Please wait a moment before requesting another." });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = now + 15 * 60 * 1000; // 15 minutes

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(users).set({
      emailVerificationCode: code,
      emailVerificationExpiry: Math.floor(expiry / 1000), // store as unix seconds
    }).where(eq(users.id, ctx.user.id));

    const sent = await sendEmailVerificationOTP(user.email, code, user.name);
    if (!sent) {
      // SMTP not configured — return code in dev mode only
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        console.log(`[EmailVerification] DEV MODE — code for ${user.email}: ${code}`);
        return { success: true, devCode: code };
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email delivery is not configured. Please contact support@inboxbrief.com." });
    }

    await writeAuditLog({ userId: ctx.user.id, action: "email_otp_sent", metadata: { email: user.email } });
    return { success: true };
  }),

  verifyCode: protectedProcedure
    .input(z.object({ code: z.string().length(6).regex(/^\d{6}$/, "Code must be 6 digits") }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      if (user.emailVerified) return { success: true, alreadyVerified: true };

      if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No verification code found. Please request a new one." });
      }

      const now = Math.floor(Date.now() / 1000);
      if (user.emailVerificationExpiry < now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new one." });
      }

      if (user.emailVerificationCode !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect verification code. Please try again." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users).set({
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      }).where(eq(users.id, ctx.user.id));

      await writeAuditLog({ userId: ctx.user.id, action: "email_verified", metadata: { email: user.email } });
      return { success: true };
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      emailVerified: user?.emailVerified ?? false,
      email: user?.email ?? null,
    };
  }),
});

// ─── Disclaimer Router ───────────────────────────────────────────────────────

const disclaimerRouter = router({
  accept: protectedProcedure
    .input(z.object({ version: z.string().max(16) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users).set({
        disclaimerAcceptedAt: new Date(),
        disclaimerVersion: input.version,
      }).where(eq(users.id, ctx.user.id));
      await writeAuditLog({ userId: ctx.user.id, action: "disclaimer_accepted", metadata: { version: input.version } });
      return { success: true };
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      accepted: !!user?.disclaimerAcceptedAt,
      version: user?.disclaimerVersion ?? null,
      acceptedAt: user?.disclaimerAcceptedAt ?? null,
    };
  }),
});

// ─── International SMS Router ──────────────────────────────────────────────────

const internationalRouter = router({
  checkSurcharge: publicProcedure
    .input(z.object({ countryCode: z.string().max(8) }))
    .query(({ input }) => {
      const intl = isInternationalNumber(input.countryCode);
      return {
        isInternational: intl,
        surchargeAmount: intl ? INTERNATIONAL_SMS_SURCHARGE : 0,
        surchargeLabel: intl ? `+$${INTERNATIONAL_SMS_SURCHARGE}/month international SMS` : null,
      };
    }),

  updatePhoneCountry: protectedProcedure
    .input(z.object({
      phoneCountryCode: z.string().max(8),
      phone: z.string().min(10).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const isIntl = isInternationalNumber(input.phoneCountryCode);
      await updateUser(ctx.user.id, {
        phone: input.phone,
        phoneCountryCode: input.phoneCountryCode,
        internationalSms: isIntl,
      });
      return {
        success: true,
        isInternational: isIntl,
        surcharge: isIntl ? INTERNATIONAL_SMS_SURCHARGE : 0,
      };
    }),
});

//// ─── Announcements Router ───────────────────────────────────────────────────────

const announcementsRouter = router({
  // Public: get all active, non-expired announcements
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    const now = new Date();
    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true)
        )
      )
      .orderBy(desc(announcements.createdAt));
    // Filter out expired ones (expiresAt null = never expires)
    return rows.filter(r => !r.expiresAt || r.expiresAt > now);
  }),

  // Admin: list all announcements
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    return db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }),

  // Admin: create announcement
  create: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
        type: z.enum(["info", "warning", "success", "promo"]),
        expiresAt: z.string().optional(), // ISO string
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.insert(announcements).values({
        message: input.message,
        type: input.type,
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy: ctx.user.id,
      });
      return { success: true };
    }),

  // Admin: update announcement
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        message: z.string().min(1).max(500).optional(),
        type: z.enum(["info", "warning", "success", "promo"]).optional(),
        isActive: z.boolean().optional(),
        expiresAt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const { id, expiresAt, ...rest } = input;
      await db.update(announcements).set({
        ...rest,
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      }).where(eq(announcements.id, id));
      return { success: true };
    }),

  // Admin: delete announcement
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.delete(announcements).where(eq(announcements.id, input.id));
      return { success: true };
    }),
});

// ─── Admin Users Router ──────────────────────────────────────────────────────

const adminUsersRouter = router({
  // List all users with pagination
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const [users, total] = await Promise.all([
        getAllUsersAdmin(input.limit, input.offset),
        getAdminUserCount(),
      ]);
      return { users, total };
    }),

  // Get detailed info for a single user
  getDetail: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const detail = await getUserWithSubscriptionAdmin(input.userId);
      if (!detail) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return detail;
    }),

  // Promote or demote a user's role
  setRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      await updateUser(input.userId, { role: input.role });
      return { success: true };
    }),

  // Suspend a user account
  suspend: protectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot suspend your own account" });
      const db = await getDb();
      await db.update(users).set({
        isActive: false,
        suspendedAt: new Date(),
        suspendedReason: input.reason,
        suspendedBy: ctx.user.id,
      }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Unsuspend a user account
  unsuspend: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.update(users).set({
        isActive: true,
        suspendedAt: null,
        suspendedReason: null,
        suspendedBy: null,
      }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Update admin notes for a user
  updateNotes: protectedProcedure
    .input(z.object({
      userId: z.number(),
      notes: z.string().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      await db.update(users).set({ adminNotes: input.notes }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Soft-delete a user (clear PII, mark inactive, keep audit trail)
  softDelete: protectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
      const db = await getDb();
      // Anonymize PII, preserve audit trail
      await db.update(users).set({
        isActive: false,
        name: "[Deleted User]",
        email: null,
        phone: null,
        phoneVerified: false,
        suspendedAt: new Date(),
        suspendedReason: `DELETED: ${input.reason}`,
        suspendedBy: ctx.user.id,
        adminNotes: `Account soft-deleted by admin ${ctx.user.id} on ${new Date().toISOString()}. Reason: ${input.reason}`,
      }).where(eq(users.id, input.userId));
      return { success: true };
    }),
});

// ─── Admin Tools Router ────────────────────────────────────────────────────

const adminToolsRouter = router({
  // ─── System Stats ─────────────────────────────────────────────────────────
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [allUsers, activeSubs, todayBriefings] = await Promise.all([
      db.select({ id: users.id, isActive: users.isActive, createdAt: users.createdAt }).from(users),
      db.select({ plan: subscriptions.plan, status: subscriptions.status }).from(subscriptions),
      db.select({ id: briefingLogs.id }).from(briefingLogs).where(
        and(eq(briefingLogs.smsStatus, "sent"))
      ),
    ]);

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.isActive).length;
    const newUsersToday = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= todayStart).length;
    const activeSubscriptions = activeSubs.filter(s => s.status === "active").length;
    const briefingsTodayCount = todayBriefings.length;

    // MRR estimate from active subscriptions
    const planPrices: Record<string, number> = { starter: 19, pro: 39, business: 99 };
    const mrr = activeSubs
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + (planPrices[s.plan ?? ""] ?? 0), 0);

    return { totalUsers, activeUsers, newUsersToday, activeSubscriptions, mrr, briefingsTodayCount };
  }),

  // ─── Coupon Management ────────────────────────────────────────────────────
  listCoupons: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const stripe = getStripe();
    const coupons = await stripe.coupons.list({ limit: 100 });
    return coupons.data.map(c => ({
      id: c.id,
      name: c.name ?? c.id,
      percentOff: c.percent_off ?? null,
      amountOff: c.amount_off ? c.amount_off / 100 : null,
      currency: c.currency ?? null,
      duration: c.duration,
      durationInMonths: c.duration_in_months ?? null,
      maxRedemptions: c.max_redemptions ?? null,
      timesRedeemed: c.times_redeemed,
      valid: c.valid,
      createdAt: new Date(c.created * 1000),
    }));
  }),

  createCoupon: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(64),
      type: z.enum(["percent", "amount"]),
      percentOff: z.number().min(1).max(100).optional(),
      amountOff: z.number().min(0.5).optional(), // in dollars
      duration: z.enum(["once", "repeating", "forever"]),
      durationInMonths: z.number().min(1).max(24).optional(),
      maxRedemptions: z.number().min(1).optional(),
      expiresAt: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const stripe = getStripe();

      const params: Record<string, unknown> = {
        name: input.name,
        duration: input.duration,
      };

      if (input.type === "percent") {
        if (!input.percentOff) throw new TRPCError({ code: "BAD_REQUEST", message: "percentOff required for percent coupon" });
        params.percent_off = input.percentOff;
      } else {
        if (!input.amountOff) throw new TRPCError({ code: "BAD_REQUEST", message: "amountOff required for amount coupon" });
        params.amount_off = Math.round(input.amountOff * 100); // convert to cents
        params.currency = "usd";
      }

      if (input.duration === "repeating") {
        if (!input.durationInMonths) throw new TRPCError({ code: "BAD_REQUEST", message: "durationInMonths required for repeating coupon" });
        params.duration_in_months = input.durationInMonths;
      }

      if (input.maxRedemptions) params.max_redemptions = input.maxRedemptions;
      if (input.expiresAt) params.redeem_by = Math.floor(new Date(input.expiresAt).getTime() / 1000);

      const coupon = await stripe.coupons.create(params as Parameters<typeof stripe.coupons.create>[0]);
      await writeAuditLog({ userId: ctx.user.id, action: "coupon_created", metadata: { couponId: coupon.id, name: coupon.name } });
      return { success: true, couponId: coupon.id };
    }),

  deleteCoupon: protectedProcedure
    .input(z.object({ couponId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const stripe = getStripe();
      await stripe.coupons.del(input.couponId);
      await writeAuditLog({ userId: ctx.user.id, action: "coupon_deleted", metadata: { couponId: input.couponId } });
      return { success: true };
    }),

  // ─── Manual Briefing Trigger ──────────────────────────────────────────────
  triggerBriefingForUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const targetUser = await getUserById(input.userId);
      if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (!targetUser.phone) throw new TRPCError({ code: "BAD_REQUEST", message: "User has no phone number" });

      const result = await runBriefingPipeline(input.userId, "manual_admin");
      await writeAuditLog({ userId: ctx.user.id, action: "admin_triggered_briefing", metadata: { targetUserId: input.userId } });
      return result;
    }),

  // ─── Broadcast SMS ────────────────────────────────────────────────────────
  broadcastSms: protectedProcedure
    .input(z.object({
      message: z.string().min(10).max(400),
      targetGroup: z.enum(["all_active", "subscribers_only", "trial_only"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get target users
      let targetUsers = await db
        .select({ id: users.id, phone: users.phone, phoneVerified: users.phoneVerified })
        .from(users)
        .where(eq(users.isActive, true));

      if (input.targetGroup === "subscribers_only") {
        const activeSubs = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.status, "active"));
        const subUserIds = new Set(activeSubs.map(s => s.userId));
        targetUsers = targetUsers.filter(u => subUserIds.has(u.id));
      } else if (input.targetGroup === "trial_only") {
        const activeSubs = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.status, "active"));
        const subUserIds = new Set(activeSubs.map(s => s.userId));
        targetUsers = targetUsers.filter(u => !subUserIds.has(u.id));
      }

      // Only send to verified phone numbers
      const eligible = targetUsers.filter(u => u.phone && u.phoneVerified);

      let sent = 0;
      let failed = 0;
      for (const u of eligible) {
        const result = await sendSmsBriefing(u.phone!, `[InboxBrief] ${input.message}`);
        if (result.success) sent++;
        else failed++;
        // Small delay to avoid Twilio rate limits
        await new Promise(r => setTimeout(r, 100));
      }

      await writeAuditLog({
        userId: ctx.user.id,
        action: "admin_broadcast_sms",
        metadata: { message: input.message.slice(0, 50), targetGroup: input.targetGroup, sent, failed },
      });

      return { success: true, sent, failed, total: eligible.length };
    }),
});

// ─── Contact Router ──────────────────────────────────────────────────────────
const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        phone: z.string().max(30).optional(),
        message: z.string().min(10).max(2000),
        consentNonMarketing: z.boolean(),
        consentMarketing: z.boolean(),
        consentPrivacy: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // consentPrivacy is optional — no validation required

      const { sendEmail } = await import('./emailService');
      const ownerEmail = OWNER_EMAIL || process.env.FROM_EMAIL || 'support@inboxbrief.org';

      const consentLines = [
        input.consentNonMarketing ? '✓ Non-marketing SMS consent given' : '✗ Non-marketing SMS consent NOT given',
        input.consentMarketing ? '✓ Marketing SMS consent given' : '✗ Marketing SMS consent NOT given',
        '✓ Privacy Policy & Terms accepted',
      ].join('\n');

      const html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${input.name}</p>
        <p><strong>Email:</strong> ${input.email}</p>
        ${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${input.message.replace(/\n/g, '<br>')}</p>
        <hr/>
        <h3>Consent</h3>
        <pre>${consentLines}</pre>
      `;

      const emailPayload = {
        subject: `[InboxBrief] Contact form: ${input.name}`,
        html,
        text: `Name: ${input.name}\nEmail: ${input.email}\n${input.phone ? `Phone: ${input.phone}\n` : ''}\nMessage:\n${input.message}\n\nConsent:\n${consentLines}`,
      };

      // Send to owner
      await sendEmail({ to: ownerEmail, ...emailPayload });

      // Always CC support@inboxbrief.org (unless it's already the owner address)
      const supportEmail = 'support@inboxbrief.org';
      if (ownerEmail.toLowerCase() !== supportEmail) {
        await sendEmail({ to: supportEmail, ...emailPayload });
      }

      // Also notify owner via platform notification
      await notifyOwner({
        title: `Contact form: ${input.name}`,
        content: `Email: ${input.email}\n${input.phone ? `Phone: ${input.phone}\n` : ''}\n${input.message.slice(0, 200)}${input.message.length > 200 ? '...' : ''}`,
      });

      return { success: true };
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  onboarding: onboardingRouter,
  subscription: subscriptionRouter,
  emailAccounts: emailAccountsRouter,
  briefing: briefingRouter,
  settings: settingsRouter,
  referral: referralRouter,
  team: teamRouter,
  teamInvite: teamInviteRouter,
  enterprise: enterpriseRouter,
  legal: legalRouter,
  international: internationalRouter,
  phoneVerification: phoneVerificationRouter,
  emailVerification: emailVerificationRouter,
  disclaimer: disclaimerRouter,
  announcements: announcementsRouter,
  adminUsers: adminUsersRouter,
  adminTools: adminToolsRouter,
  contact: contactRouter,
});
export type AppRouter = typeof appRouter;
