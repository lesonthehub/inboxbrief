/**
 * InboxBrief Subscription Plans
 * Tier-based email volume limits and Stripe price configuration.
 */

export type PlanId = "trial" | "starter" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // USD per month (0 = free trial)
  priceLabel: string;
  emailLimit: number; // Max emails read per briefing (-1 = unlimited)
  smsPerDay: number; // Max SMS briefings per day
  features: string[];
  stripePriceId: string | null; // Set via env or hardcoded after Stripe product creation
  trialDays: number;
  highlighted: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    name: "Free Trial",
    price: 0,
    priceLabel: "Free for 7 days",
    emailLimit: -1, // Business-tier access during trial
    smsPerDay: 10,
    features: [
      "Full Business-tier access for 7 days",
      "Unlimited emails per briefing",
      "Up to 10 SMS briefings/day",
      "Gmail & Outlook integration",
      "AI priority classification",
      "Custom SMS schedule",
      "AES-256-GCM encryption",
    ],
    stripePriceId: null,
    trialDays: 7,
    highlighted: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 9,
    priceLabel: "$9/month",
    emailLimit: 50,
    smsPerDay: 3,
    features: [
      "Up to 50 emails per briefing",
      "Up to 3 SMS briefings/day",
      "Gmail integration",
      "AI priority classification",
      "Manual & daily schedule",
      "AES-256-GCM encryption",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
    trialDays: 0,
    highlighted: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    priceLabel: "$19/month",
    emailLimit: 200,
    smsPerDay: 6,
    features: [
      "Up to 200 emails per briefing",
      "Up to 6 SMS briefings/day",
      "Gmail & Outlook integration",
      "AI priority classification",
      "Custom SMS schedule (up to 3 times/day)",
      "AES-256-GCM encryption",
      "Briefing history log",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    trialDays: 0,
    highlighted: true,
  },
  business: {
    id: "business",
    name: "Business",
    price: 39,
    priceLabel: "$39/month",
    emailLimit: -1,
    smsPerDay: 10,
    features: [
      "Unlimited emails per briefing",
      "Up to 10 SMS briefings/day",
      "Gmail & Outlook integration",
      "AI priority classification",
      "Custom SMS schedule (up to 6 times/day)",
      "AES-256-GCM encryption",
      "Full briefing history & analytics",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
    trialDays: 0,
    highlighted: false,
  },
};

/** Returns the email limit for a given plan. -1 means unlimited. */
export function getEmailLimit(plan: PlanId): number {
  return PLANS[plan].emailLimit;
}

/** Returns true if the subscription status allows triggering a briefing. */
export function isSubscriptionActive(status: string): boolean {
  return ["active", "trialing"].includes(status);
}

/** Returns the plan from a Stripe price ID. */
export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId === priceId) return plan.id;
  }
  return null;
}
