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
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  businessType: varchar("businessType", { length: 128 }),
  userRole: mysqlEnum("userRole", ["solo_owner", "team_lead", "executive", "operations", "other"]),
  teamSize: mysqlEnum("teamSize", ["just_me", "2_5", "6_15", "16_plus"]),
  inboxChallenge: mysqlEnum("inboxChallenge", ["missing_leads", "client_follow_up", "too_much_volume", "team_coordination"]),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),

  // Language preference for briefings
  language: varchar("language", { length: 8 }).default("en").notNull(),

  // SMS delivery schedule
  scheduleType: mysqlEnum("scheduleType", ["manual", "daily_morning", "daily_evening", "twice_daily", "custom"]).default("manual").notNull(),
  scheduleTimes: varchar("scheduleTimes", { length: 255 }).default("08:00"),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago"),

  // Briefing tone preferences
  toneStyle: mysqlEnum("toneStyle", ["concise", "conversational", "detailed"]).default("conversational").notNull(),
  keywordsInclude: text("keywordsInclude"),
  keywordsExclude: text("keywordsExclude"),

  // International SMS surcharge flag
  internationalSms: boolean("internationalSms").default(false).notNull(),
  phoneCountryCode: varchar("phoneCountryCode", { length: 8 }).default("+1"),

  // Legal agreements
  tosAcceptedAt: timestamp("tosAcceptedAt"),
  tosVersion: varchar("tosVersion", { length: 16 }),
  disclaimerAcceptedAt: timestamp("disclaimerAcceptedAt"),
  disclaimerVersion: varchar("disclaimerVersion", { length: 16 }),

  // Trial tracking
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  trialUsed: boolean("trialUsed").default(false).notNull(),
  trialNudge5Sent: boolean("trialNudge5Sent").default(false).notNull(),
  trialNudge6Sent: boolean("trialNudge6Sent").default(false).notNull(),
  trialEndSent: boolean("trialEndSent").default(false).notNull(),

  // Referral tracking
  referralCode: varchar("referralCode", { length: 16 }).unique(),
  referredByCode: varchar("referredByCode", { length: 16 }),
  referralCredits: int("referralCredits").default(0).notNull(),
  creditsEarned: int("creditsEarned").default(0).notNull(),

  // Over-limit grace system
  graceBriefingUsed: boolean("graceBriefingUsed").default(false).notNull(),

  // Security: brute force protection
  failedAuthAttempts: int("failedAuthAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Phone Verifications ──────────────────────────────────────────────────────
// OTP codes for phone number verification before first SMS or on number change

export const phoneVerifications = mysqlTable("phone_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  // Stored as SHA-256 hash of the 6-digit code — never store plaintext OTP
  codeHash: varchar("codeHash", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verified: boolean("verified").default(false).notNull(),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhoneVerification = typeof phoneVerifications.$inferSelect;
export type InsertPhoneVerification = typeof phoneVerifications.$inferInsert;

// ─── Audit Log ────────────────────────────────────────────────────────────────
// Immutable record of all sensitive actions for security and compliance

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 64 }).notNull(),
  // JSON-serialized metadata (never includes tokens/secrets)
  metadata: text("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  plan: mysqlEnum("plan", ["trial", "solo", "pro", "business", "enterprise"]).default("trial").notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "incomplete", "unpaid"]).default("trialing").notNull(),
  seatCount: int("seatCount").default(1).notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Team Members ─────────────────────────────────────────────────────────────

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  memberId: int("memberId"),
  inviteEmail: varchar("inviteEmail", { length: 320 }).notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }).unique(),
  inviteTokenExpiresAt: timestamp("inviteTokenExpiresAt"),
  status: mysqlEnum("status", ["pending", "active", "removed"]).default("pending").notNull(),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Referrals ────────────────────────────────────────────────────────────────

export const referralUses = mysqlTable("referral_uses", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  creditAwarded: int("creditAwarded").default(0).notNull(),
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
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  encryptedRefreshToken: text("encryptedRefreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
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
  encryptedSummary: text("encryptedSummary"),
  smsStatus: mysqlEnum("smsStatus", ["pending", "sent", "failed", "skipped"]).default("pending").notNull(),
  smsMessageSid: varchar("smsMessageSid", { length: 64 }),
  triggerType: mysqlEnum("triggerType", ["manual", "scheduled", "grace"]).default("manual").notNull(),
  planAtTime: mysqlEnum("planAtTime", ["trial", "solo", "pro", "business", "enterprise"]).default("trial").notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingLog = typeof briefingLogs.$inferSelect;
export type InsertBriefingLog = typeof briefingLogs.$inferInsert;

// ─── Briefing Feedback ────────────────────────────────────────────────────────

export const briefingFeedback = mysqlTable("briefing_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingLogId: int("briefingLogId").notNull(),
  rating: int("rating").notNull(),
  toneAdjustment: mysqlEnum("toneAdjustment", ["more_concise", "more_detail", "more_casual", "more_formal", "perfect"]),
  addKeywords: text("addKeywords"),
  removeKeywords: text("removeKeywords"),
  freeformNote: text("freeformNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingFeedback = typeof briefingFeedback.$inferSelect;
export type InsertBriefingFeedback = typeof briefingFeedback.$inferInsert;

// ─── Announcements ────────────────────────────────────────────────────────────
// Admin-posted banners shown at the top of all pages until expiry

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "promo"]).default("info").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy").notNull(), // userId of admin who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
