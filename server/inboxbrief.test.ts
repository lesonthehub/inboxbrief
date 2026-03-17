/**
 * InboxBrief Core Tests
 * Tests for encryption, plans, auth, and subscription logic.
 */

// Set ENCRYPTION_KEY before any module-level code runs
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { describe, it, expect } from "vitest";
import { encrypt, decrypt, safeDecrypt } from "./encryption";
import { getEmailLimit, isSubscriptionActive, getPlanByPriceId, PLANS } from "./plans";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";
import { COOKIE_NAME } from "../shared/const";

// ─── Encryption Tests ─────────────────────────────────────────────────────────

describe("AES-256-GCM Encryption", () => {
  it("encrypts and decrypts a string correctly", () => {
    const plaintext = "High Priority: Client inquiry from Johnson & Co.";
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext.split(":")).toHaveLength(3);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "Same message";
    const ct1 = encrypt(plaintext);
    const ct2 = encrypt(plaintext);
    expect(ct1).not.toBe(ct2);
  });

  it("safeDecrypt returns null for invalid ciphertext", () => {
    const result = safeDecrypt("not:valid:ciphertext");
    expect(result).toBeNull();
  });

  it("safeDecrypt returns null for empty string", () => {
    const result = safeDecrypt("");
    expect(result).toBeNull();
  });

  it("safeDecrypt returns null for null input", () => {
    const result = safeDecrypt(null);
    expect(result).toBeNull();
  });

  it("safeDecrypt returns decrypted text for valid ciphertext", () => {
    const text = "Test briefing summary — 3 HP emails";
    const encrypted = encrypt(text);
    expect(safeDecrypt(encrypted)).toBe(text);
  });

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("original message");
    const parts = ciphertext.split(":");
    // Tamper with ciphertext portion
    parts[2] = "deadbeef".repeat(8);
    const tampered = parts.join(":");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("encrypts empty string without error", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("encrypts unicode characters correctly", () => {
    const text = "Briefing: 📧 3 emails — López & Müller inquiry";
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });
});

// ─── Plans / Tier Logic Tests ─────────────────────────────────────────────────

describe("Subscription Plans", () => {
  it("solo plan has email limit of 25", () => {
    expect(getEmailLimit("solo")).toBe(25);
  });

  it("pro plan has email limit of 75", () => {
    expect(getEmailLimit("pro")).toBe(75);
  });

  it("business plan has email limit of 150", () => {
    expect(getEmailLimit("business")).toBe(150);
  });

  it("enterprise plan has unlimited emails (-1)", () => {
    expect(getEmailLimit("enterprise")).toBe(-1);
  });

  it("trial plan has unlimited emails (-1)", () => {
    expect(getEmailLimit("trial")).toBe(-1);
  });

  it("isSubscriptionActive returns true for active status", () => {
    expect(isSubscriptionActive("active")).toBe(true);
  });

  it("isSubscriptionActive returns true for trialing status", () => {
    expect(isSubscriptionActive("trialing")).toBe(true);
  });

  it("isSubscriptionActive returns false for canceled status", () => {
    expect(isSubscriptionActive("canceled")).toBe(false);
  });

  it("isSubscriptionActive returns false for past_due status", () => {
    expect(isSubscriptionActive("past_due")).toBe(false);
  });

  it("isSubscriptionActive returns false for incomplete status", () => {
    expect(isSubscriptionActive("incomplete")).toBe(false);
  });

  it("all plans have required fields", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.id).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(typeof plan.emailLimit).toBe("number");
      // smsPerDay can be -1 for unlimited (enterprise/trial)
      expect(typeof plan.smsPerDay).toBe("number");
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("getPlanByPriceId returns null for unknown price ID", () => {
    expect(getPlanByPriceId("price_unknown_xyz")).toBeNull();
  });

  it("trial plan is free (price 0)", () => {
    expect(PLANS.trial.price).toBe(0);
  });

  it("solo plan costs $9/month", () => {
    expect(PLANS.solo.price).toBe(9);
  });

  it("pro plan costs $19/month", () => {
    expect(PLANS.pro.price).toBe(19);
  });

  it("business plan costs $39/month", () => {
    expect(PLANS.business.price).toBe(39);
  });

  it("business plan has more SMS/day than solo", () => {
    expect(PLANS.business.smsPerDay).toBeGreaterThan(PLANS.solo.smsPerDay);
  });

  it("trial plan gives unlimited email access", () => {
    expect(PLANS.trial.emailLimit).toBe(-1);
  });
});

// ─── Auth Router Tests ────────────────────────────────────────────────────────

function createMockContext(user?: User | null): {
  ctx: TrpcContext;
  clearedCookies: { name: string; options: Record<string, unknown> }[];
} {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const ctx: TrpcContext = {
    user: user ?? null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

const MOCK_USER: User = {
  id: 1,
  openId: "test-open-id-16star",
  email: "lesterantoine@16starcollective.com",
  name: "Lester Antoine",
  loginMethod: "manus",
  role: "user",
  phone: "+15550001234",
  businessType: "Consulting",
  emailVolume: "50_200",
  primaryGoal: "lead_tracking",
  onboardingComplete: true,
  scheduleType: "daily_morning",
  scheduleTimes: "08:00",
  timezone: "America/Chicago",
  trialStartedAt: new Date(),
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  trialUsed: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createMockContext(MOCK_USER);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("works for unauthenticated users too", async () => {
    const { ctx, clearedCookies } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const { ctx } = createMockContext(MOCK_USER);
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("lesterantoine@16starcollective.com");
  });
});

// ─── Subscription Plans Endpoint ─────────────────────────────────────────────

describe("subscription.getPlans", () => {
  it("returns all 4 paid plans publicly", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    expect(plans).toHaveLength(4);
    const ids = plans.map((p) => p.id);
    expect(ids).toContain("solo");
    expect(ids).toContain("pro");
    expect(ids).toContain("business");
    expect(ids).toContain("enterprise");
  });

  it("all returned plans have price info", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    for (const plan of plans) {
      expect(plan.priceLabel).toBeDefined();
      // smsPerDay can be -1 for unlimited (enterprise)
      expect(typeof plan.smsPerDay).toBe("number");
    }
  });
});
