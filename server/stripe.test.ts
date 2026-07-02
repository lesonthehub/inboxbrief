/**
 * Vitest tests for Stripe product configuration.
 * Validates that price IDs are set and map correctly to plans.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";

// Set the price IDs before importing the module
beforeAll(() => {
  vi.stubEnv("STRIPE_PRICE_SOLO", process.env.STRIPE_PRICE_SOLO ?? "price_solo_test_placeholder");
  vi.stubEnv("STRIPE_PRICE_PRO", process.env.STRIPE_PRICE_PRO ?? "price_pro_test_placeholder");
  vi.stubEnv("STRIPE_PRICE_BUSINESS", process.env.STRIPE_PRICE_BUSINESS ?? "price_business_test_placeholder");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");
});

describe("Stripe price ID configuration", () => {
  it("returns the correct price ID for solo plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("solo");
    expect(priceId).not.toBeNull();
    expect(priceId!.startsWith("price_")).toBe(true);
  });

  it("returns the correct price ID for pro plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("pro");
    expect(priceId).not.toBeNull();
    expect(priceId!.startsWith("price_")).toBe(true);
  });

  it("returns the correct price ID for business plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("business");
    expect(priceId).not.toBeNull();
    expect(priceId!.startsWith("price_")).toBe(true);
  });

  it("maps solo price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    const soloId = process.env.STRIPE_PRICE_SOLO!;
    expect(getPlanFromPriceId(soloId)).toBe("solo");
  });

  it("maps pro price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    const proId = process.env.STRIPE_PRICE_PRO!;
    expect(getPlanFromPriceId(proId)).toBe("pro");
  });

  it("maps business price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    const bizId = process.env.STRIPE_PRICE_BUSINESS!;
    expect(getPlanFromPriceId(bizId)).toBe("business");
  });

  it("returns null for unknown price ID", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    expect(getPlanFromPriceId("price_unknown_123")).toBeNull();
  });

  it("all 3 price IDs are non-null and start with price_", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const plans = ["solo", "pro", "business"] as const;
    for (const plan of plans) {
      const id = getPriceIdForPlan(plan);
      expect(id).not.toBeNull();
      expect(id!.startsWith("price_")).toBe(true);
    }
  });
});
