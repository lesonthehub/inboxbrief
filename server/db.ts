import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, emailAccounts, briefingLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSubscription(userId: number, data: Partial<typeof subscriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getSubscriptionByUserId(userId);
  if (existing) {
    await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({ userId, plan: "trial", status: "trialing", ...data });
  }
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Email Accounts ───────────────────────────────────────────────────────────

export async function getEmailAccountsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailAccounts).where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.isActive, true)));
}

export async function insertEmailAccount(data: typeof emailAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailAccounts).values(data);
}

export async function updateEmailAccount(id: number, data: Partial<typeof emailAccounts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailAccounts).set({ ...data, updatedAt: new Date() }).where(eq(emailAccounts.id, id));
}

export async function deactivateEmailAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailAccounts).set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, userId)));
}

// ─── Briefing Logs ────────────────────────────────────────────────────────────

export async function getBriefingLogsByUserId(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(briefingLogs)
    .where(eq(briefingLogs.userId, userId))
    .orderBy(desc(briefingLogs.createdAt))
    .limit(limit);
}

// ─── Admin Query Helpers ────────────────────────────────────────────────────

export async function getAllUsersAdmin(limit = 200, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      phoneVerified: users.phoneVerified,
      businessType: users.businessType,
      onboardingComplete: users.onboardingComplete,
      trialStartedAt: users.trialStartedAt,
      trialEndsAt: users.trialEndsAt,
      trialUsed: users.trialUsed,
      referralCode: users.referralCode,
      referralCredits: users.referralCredits,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      loginMethod: users.loginMethod,
      isActive: users.isActive,
      suspendedAt: users.suspendedAt,
      suspendedReason: users.suspendedReason,
      adminNotes: users.adminNotes,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn))
    .limit(limit)
    .offset(offset);
}

export async function getAdminUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}

export async function getUserWithSubscriptionAdmin(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return null;
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const accounts = await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
  const briefings = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(briefingLogs)
    .where(eq(briefingLogs.userId, userId));
  return {
    user: user[0],
    subscription: sub[0] ?? null,
    emailAccounts: accounts,
    totalBriefings: Number(briefings[0]?.count ?? 0),
  };
}
