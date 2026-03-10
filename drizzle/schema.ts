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

  // Lead-qualifying onboarding answers
  phone: varchar("phone", { length: 32 }),
  businessType: varchar("businessType", { length: 128 }),
  emailVolume: mysqlEnum("emailVolume", ["under_50", "50_200", "200_500", "over_500"]),
  primaryGoal: mysqlEnum("primaryGoal", ["lead_tracking", "client_updates", "general_inbox", "all_of_above"]),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),

  // SMS delivery schedule — user-controlled
  scheduleType: mysqlEnum("scheduleType", ["manual", "daily_morning", "daily_evening", "twice_daily", "custom"]).default("manual").notNull(),
  // For custom: comma-separated HH:MM values e.g. "08:00,13:00,18:00"
  scheduleTimes: varchar("scheduleTimes", { length: 255 }).default("08:00"),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago"),

  // Trial tracking
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  trialUsed: boolean("trialUsed").default(false).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────
// Plans and their email limits:
//   starter  → $9/mo  → 50 emails per briefing
//   pro      → $19/mo → 200 emails per briefing
//   business → $39/mo → unlimited emails per briefing
//   trial    → free 7-day business-tier access

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  plan: mysqlEnum("plan", ["trial", "starter", "pro", "business"]).default("trial").notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"]).default("trialing").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

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
  planAtTime: mysqlEnum("planAtTime", ["trial", "starter", "pro", "business"]).default("trial").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingLog = typeof briefingLogs.$inferSelect;
export type InsertBriefingLog = typeof briefingLogs.$inferInsert;
