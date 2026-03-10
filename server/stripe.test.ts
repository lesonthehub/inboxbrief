/**
 * Vitest tests for Stripe product configuration.
 * Validates that price IDs are set and map correctly to plans.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";

// Set the price IDs before importing the module
beforeAll(() => {
  vi.stubEnv("STRIPE_PRICE_STARTER", "price_1T9UHRLnnUB5UAJfQkpXQwc7");
  vi.stubEnv("STRIPE_PRICE_PRO", "price_1T9UHVLnnUB5UAJfQUecAdoW");
  vi.stubEnv("STRIPE_PRICE_BUSINESS", "price_1T9UHYLnnUB5UAJfOjXQ177H");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");
});

describe("Stripe price ID configuration", () => {
  it("returns the correct price ID for starter plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("starter");
    expect(priceId).toBe("price_1T9UHRLnnUB5UAJfQkpXQwc7");
  });

  it("returns the correct price ID for pro plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("pro");
    expect(priceId).toBe("price_1T9UHVLnnUB5UAJfQUecAdoW");
  });

  it("returns the correct price ID for business plan", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const priceId = getPriceIdForPlan("business");
    expect(priceId).toBe("price_1T9UHYLnnUB5UAJfOjXQ177H");
  });

  it("maps starter price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    expect(getPlanFromPriceId("price_1T9UHRLnnUB5UAJfQkpXQwc7")).toBe("starter");
  });

  it("maps pro price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    expect(getPlanFromPriceId("price_1T9UHVLnnUB5UAJfQUecAdoW")).toBe("pro");
  });

  it("maps business price ID back to plan name", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    expect(getPlanFromPriceId("price_1T9UHYLnnUB5UAJfOjXQ177H")).toBe("business");
  });

  it("returns null for unknown price ID", async () => {
    const { getPlanFromPriceId } = await import("./stripeProducts");
    expect(getPlanFromPriceId("price_unknown_123")).toBeNull();
  });

  it("all 3 price IDs are non-null and start with price_", async () => {
    const { getPriceIdForPlan } = await import("./stripeProducts");
    const plans = ["starter", "pro", "business"] as const;
    for (const plan of plans) {
      const id = getPriceIdForPlan(plan);
      expect(id).not.toBeNull();
      expect(id!.startsWith("price_")).toBe(true);
    }
  });
});
