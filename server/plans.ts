/**
 * InboxBrief Subscription Plans
 *
 * Market research basis (2025):
 * - Average professional receives ~121 emails/day; ~40% are actionable
 * - Solo proprietors: ~30-50 relevant emails/day after spam filtering
 * - Small teams (2-5): ~75-150 relevant emails/day across inboxes
 * - Growing teams (6-15): ~150-300 relevant emails/day
 * - Enterprise (16+): 300+ relevant emails/day, multiple inboxes
 *
 * Competitor benchmarks: Superhuman $30/user, Fyxer $30-50/user, SaneBox $7-36/user
 * InboxBrief differentiator: SMS delivery + E2EE + no-inbox-login UX
 */

export type PlanId = "trial" | "solo" | "pro" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;           // USD per month (0 = free trial)
  priceLabel: string;
  pricePerSeat?: string;   // shown for team plans
  emailLimit: number;      // Max emails read per briefing (-1 = unlimited)
  smsPerDay: number;       // Max SMS briefings per day
  maxSeats: number;        // Max team members (-1 = unlimited)
  features: string[];
  stripePriceId: string | null;
  trialDays: number;
  highlighted: boolean;
  badge?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    name: "Free Trial",
    price: 0,
    priceLabel: "Free for 7 days",
    emailLimit: -1,
    smsPerDay: 10,
    maxSeats: 1,
    features: [
      "Full Business-tier access for 7 days",
      "Unlimited emails per briefing",
      "Up to 10 SMS briefings/day",
      "Gmail & Outlook integration",
      "Smart priority filtering",
      "Custom SMS schedule",
      "AES-256-GCM encryption",
    ],
    stripePriceId: null,
    trialDays: 7,
    highlighted: false,
  },
  solo: {
    id: "solo",
    name: "Solo",
    price: 9,
    priceLabel: "$9/month",
    emailLimit: 25,        // ~25 actionable emails/day for solo proprietors
    smsPerDay: 2,
    maxSeats: 1,
    features: [
      "Up to 25 emails per briefing",
      "2 SMS briefings/day",
      "Gmail integration",
      "Smart priority filtering",
      "Manual & scheduled delivery",
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
    emailLimit: 75,        // ~75 actionable emails/day for active professionals
    smsPerDay: 5,
    maxSeats: 1,
    features: [
      "Up to 75 emails per briefing",
      "5 SMS briefings/day",
      "Gmail & Outlook integration",
      "Smart priority filtering",
      "Custom SMS schedule",
      "Briefing history & feedback",
      "AES-256-GCM encryption",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    trialDays: 0,
    highlighted: true,
    badge: "Most Popular",
  },
  business: {
    id: "business",
    name: "Business",
    price: 39,
    priceLabel: "$39/month",
    pricePerSeat: "Up to 5 team members",
    emailLimit: 150,       // ~150 emails/day across a small team
    smsPerDay: 10,
    maxSeats: 5,
    features: [
      "Up to 150 emails per briefing",
      "10 SMS briefings/day",
      "Up to 5 team members",
      "Gmail & Outlook integration",
      "Smart priority filtering",
      "Custom SMS schedule per member",
      "Team briefing dashboard",
      "Briefing history & feedback",
      "AES-256-GCM encryption",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
    trialDays: 0,
    highlighted: false,
    badge: "Best for Teams",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 79,
    priceLabel: "$79/month",
    pricePerSeat: "Unlimited team members",
    emailLimit: -1,        // Unlimited
    smsPerDay: -1,         // Unlimited
    maxSeats: -1,          // Unlimited
    features: [
      "Unlimited emails per briefing",
      "Unlimited SMS briefings/day",
      "Unlimited team members",
      "Gmail & Outlook integration",
      "Smart priority filtering",
      "Custom SMS schedule per member",
      "Team briefing dashboard",
      "Full briefing history & analytics",
      "AES-256-GCM encryption",
      "Dedicated support",
      "Custom onboarding",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    trialDays: 0,
    highlighted: false,
    badge: "Unlimited",
  },
};

/** Returns the email limit for a given plan. -1 means unlimited. */
export function getEmailLimit(plan: PlanId): number {
  return PLANS[plan].emailLimit;
}

/** Returns the SMS per day limit. -1 means unlimited. */
export function getSmsLimit(plan: PlanId): number {
  return PLANS[plan].smsPerDay;
}

/** Returns the max seat count. -1 means unlimited. */
export function getMaxSeats(plan: PlanId): number {
  return PLANS[plan].maxSeats;
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

/** Returns plans suitable for display on the pricing page (excludes trial). */
export function getDisplayPlans(): Plan[] {
  return ["solo", "pro", "business", "enterprise"].map(id => PLANS[id as PlanId]);
}
