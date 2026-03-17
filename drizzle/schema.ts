import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Core Users ───────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),

  // Lead-qualifying onboarding answers (updated for team-based positioning)
  phone: varchar("phone", { length: 32 }),
  businessType: varchar("businessType", { length: 128 }),
  // Q1: What best describes your role?
  userRole: mysqlEnum("userRole", ["solo_owner", "team_lead", "executive", "operations", "other"]),
  // Q2: How many people are on your team (including you)?
  teamSize: mysqlEnum("teamSize", ["just_me", "2_5", "6_15", "16_plus"]),
  // Q3: What is your biggest inbox challenge?
  inboxChallenge: mysqlEnum("inboxChallenge", ["missing_leads", "client_follow_up", "too_much_volume", "team_coordination"]),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),

  // Language preference for briefings and UI
  language: varchar("language", { length: 8 }).default("en").notNull(),

  // SMS delivery schedule — user-controlled
  scheduleType: mysqlEnum("scheduleType", ["manual", "daily_morning", "daily_evening", "twice_daily", "custom"]).default("manual").notNull(),
  // For custom: comma-separated HH:MM values e.g. "08:00,13:00,18:00"
  scheduleTimes: varchar("scheduleTimes", { length: 255 }).default("08:00"),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago"),

  // Briefing tone preferences (user-adjustable)
  toneStyle: mysqlEnum("toneStyle", ["concise", "conversational", "detailed"]).default("conversational").notNull(),
  keywordsInclude: text("keywordsInclude"), // comma-separated
  keywordsExclude: text("keywordsExclude"), // comma-separated

  // Trial tracking
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  trialUsed: boolean("trialUsed").default(false).notNull(),

  // Referral tracking
  referralCode: varchar("referralCode", { length: 16 }).unique(),
  referredByCode: varchar("referredByCode", { length: 16 }),
  referralCredits: int("referralCredits").default(0).notNull(), // credits in cents

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────
// Plans and their email limits (market-researched):
//   solo     → $9/mo   → 1 seat, 25 emails/briefing, 2 SMS/day
//   pro      → $19/mo  → 1 seat, 75 emails/briefing, 5 SMS/day
//   business → $39/mo  → up to 5 seats, 150 emails/briefing, 10 SMS/day
//   enterprise → $79/mo → unlimited seats, unlimited emails, unlimited SMS
//   trial    → free 7-day business-tier access

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  plan: mysqlEnum("plan", ["trial", "solo", "pro", "business", "enterprise"]).default("trial").notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"]).default("trialing").notNull(),
  // Team seat count (for business/enterprise plans)
  seatCount: int("seatCount").default(1).notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Team Members ─────────────────────────────────────────────────────────────
// Business/Enterprise plan owners can add team members who also receive briefings

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),   // the subscription owner
  memberId: int("memberId"),           // null until they accept invite
  inviteEmail: varchar("inviteEmail", { length: 320 }).notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }).unique(),
  status: mysqlEnum("status", ["pending", "active", "removed"]).default("pending").notNull(),
  phone: varchar("phone", { length: 32 }), // member's SMS number
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Referrals ────────────────────────────────────────────────────────────────

export const referralUses = mysqlTable("referral_uses", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),   // user who owns the code
  referredUserId: int("referredUserId").notNull(), // user who used the code
  creditAwarded: int("creditAwarded").default(0).notNull(), // cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralUse = typeof referralUses.$inferSelect;
export type InsertReferralUse = typeof referralUses.$inferInsert;

// ─── Connected Email Accounts ─────────────────────────────────────────────────

export const emailAccounts = mysqlTable("email_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["gmail", "outlook"]).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  // AES-256-GCM encrypted tokens stored as "iv:authTag:ciphertext" (hex)
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  encryptedRefreshToken: text("encryptedRefreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Incremental fetch state — Gmail historyId or Outlook deltaLink
  lastProcessedEmailId: text("lastProcessedEmailId"),
  lastFetchedAt: timestamp("lastFetchedAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

// ─── Briefing Logs ────────────────────────────────────────────────────────────

export const briefingLogs = mysqlTable("briefing_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailAccountId: int("emailAccountId"),
  emailsFetched: int("emailsFetched").default(0).notNull(),
  highPriorityCount: int("highPriorityCount").default(0).notNull(),
  generalCount: int("generalCount").default(0).notNull(),
  ignoredCount: int("ignoredCount").default(0).notNull(),
  // AES-256-GCM encrypted final summary
  encryptedSummary: text("encryptedSummary"),
  smsStatus: mysqlEnum("smsStatus", ["pending", "sent", "failed", "skipped"]).default("pending").notNull(),
  smsMessageSid: varchar("smsMessageSid", { length: 64 }),
  triggerType: mysqlEnum("triggerType", ["manual", "scheduled"]).default("manual").notNull(),
  planAtTime: mysqlEnum("planAtTime", ["trial", "solo", "pro", "business", "enterprise"]).default("trial").notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingLog = typeof briefingLogs.$inferSelect;
export type InsertBriefingLog = typeof briefingLogs.$inferInsert;

// ─── Briefing Feedback ────────────────────────────────────────────────────────
// Users rate each briefing and optionally adjust tone/keywords for future ones

export const briefingFeedback = mysqlTable("briefing_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingLogId: int("briefingLogId").notNull(),
  // 1 = poor, 5 = excellent
  rating: int("rating").notNull(),
  // What the user wants adjusted
  toneAdjustment: mysqlEnum("toneAdjustment", ["more_concise", "more_detail", "more_casual", "more_formal", "perfect"]),
  addKeywords: text("addKeywords"),     // comma-separated words to always include
  removeKeywords: text("removeKeywords"), // comma-separated words to always ignore
  freeformNote: text("freeformNote"),   // optional free-text note
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingFeedback = typeof briefingFeedback.$inferSelect;
export type InsertBriefingFeedback = typeof briefingFeedback.$inferInsert;
