/**
 * InboxBrief Subscription Plans
 *
 * Cost basis (2025/2026 market rates):
 * - Twilio A2P 10DLC SMS (US): $0.0083 base + ~$0.003 carrier surcharge = $0.0113/SMS
 * - LLM summarization (GPT-4o-mini via OpenRouter): $0.15/1M input + $0.60/1M output tokens
 *   Per briefing: ~(emails × 300 input tokens) + 200 output tokens
 *   ≈ $0.000045 × emails + $0.00012 per briefing
 * - Gmail/Outlook API: free at our volumes
 *
 * Margin targets: 80–90% gross margin per tier
 *
 * Margin model (70% avg utilization assumed):
 *   Solo:     $9/mo  | 50 emails, 2 SMS/day, 1 seat  → COGS ~$0.80  → ~91% margin
 *   Pro:      $19/mo | 100 emails, 5 SMS/day, 1 seat  → COGS ~$2.40  → ~87% margin
 *   Business: $39/mo | 75 emails, 2 SMS/day/seat, 5 seats → COGS ~$4.14 → ~89% margin
 *   Enterprise: Custom pricing — negotiated per contract
 *
 * Note: Business tier was reduced from 150 emails/10 SMS/day to 75 emails/2 SMS/day
 * because the prior limits yielded only ~38% gross margin at full utilization.
 *
 * International SMS surcharge rationale (Twilio outbound rates):
 * - US/Canada: $0.0083/SMS (baseline)
 * - UK: $0.0420/SMS (~5× baseline)
 * - Australia/Mexico: $0.0515/SMS (~6× baseline)
 * - France: $0.0798/SMS (~10× baseline)
 * - Germany/Italy: $0.0940/SMS (~11× baseline)
 * A flat +$5/month surcharge covers costs at all tiers while remaining competitive.
 */

export type PlanId = "trial" | "solo" | "pro" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;           // USD per month (0 = free trial, -1 = contact us)
  priceLabel: string;
  pricePerSeat?: string;   // shown for team plans
  emailLimit: number;      // Max emails read per briefing (-1 = unlimited)
  smsPerDay: number;       // Max SMS briefings per day (-1 = unlimited)
  maxSeats: number;        // Max team members (-1 = unlimited)
  features: string[];
  stripePriceId: string | null;
  trialDays: number;
  highlighted: boolean;
  badge?: string;
  contactOnly?: boolean;   // Enterprise: no price listed, contact form instead
}

/** International SMS surcharge: +$5/month for non-US/Canada numbers */
export const INTERNATIONAL_SMS_SURCHARGE = 5; // USD/month

/** Country codes that do NOT incur the surcharge (US and Canada) */
export const DOMESTIC_COUNTRY_CODES = ["+1"];

export function isInternationalNumber(countryCode: string): boolean {
  return !DOMESTIC_COUNTRY_CODES.includes(countryCode);
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
    emailLimit: 50,        // Raised from 25 → 50 (margin: ~91%)
    smsPerDay: 2,
    maxSeats: 1,
    features: [
      "Up to 50 emails per briefing",
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
    emailLimit: 100,       // Raised from 75 → 100 (margin: ~87%)
    smsPerDay: 5,
    maxSeats: 1,
    features: [
      "Up to 100 emails per briefing",
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
    emailLimit: 75,        // Reduced from 150 → 75 per seat (margin: ~89%)
    smsPerDay: 2,          // Reduced from 10 → 2 per seat (prior 10×5 seats was 38% margin)
    maxSeats: 5,
    features: [
      "Up to 75 emails per briefing",
      "2 SMS briefings/day per member",
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
    price: -1,              // Contact us — no public price
    priceLabel: "Custom pricing",
    pricePerSeat: "Unlimited team members",
    emailLimit: -1,
    smsPerDay: -1,
    maxSeats: -1,
    features: [
      "Unlimited emails per briefing",
      "Unlimited SMS briefings/day",
      "Unlimited team members",
      "Gmail & Outlook integration",
      "Dedicated account manager",
      "Custom SMS schedule per member",
      "Team briefing dashboard & analytics",
      "Full briefing history",
      "AES-256-GCM encryption",
      "SLA-backed uptime",
      "Custom onboarding & training",
      "Volume pricing",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    trialDays: 0,
    highlighted: false,
    badge: "Custom",
    contactOnly: true,      // No checkout — show contact form instead
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

/**
 * Calculates the total monthly price for a user including international surcharge.
 * Returns { base, surcharge, total, isInternational }
 */
export function calculateMonthlyPrice(plan: PlanId, countryCode: string): {
  base: number;
  surcharge: number;
  total: number;
  isInternational: boolean;
} {
  const base = PLANS[plan].price;
  if (base < 0) return { base: 0, surcharge: 0, total: 0, isInternational: false };
  const intl = isInternationalNumber(countryCode);
  const surcharge = intl ? INTERNATIONAL_SMS_SURCHARGE : 0;
  return { base, surcharge, total: base + surcharge, isInternational: intl };
}
