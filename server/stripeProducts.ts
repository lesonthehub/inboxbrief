/**
 * Stripe Product & Price Configuration
 * Create these products once in your Stripe dashboard, then set the price IDs as env vars.
 * STRIPE_PRICE_SOLO, STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS, STRIPE_PRICE_ENTERPRISE
 */
import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

export type StripePlanId = "solo" | "pro" | "business" | "enterprise";

export interface CheckoutSessionParams {
  userId: number;
  userEmail: string;
  userName: string;
  plan: StripePlanId;
  origin: string; // window.location.origin from frontend
}

/** Creates a Stripe Checkout Session for a subscription. */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<string> {
  const stripe = getStripe();
  const priceId = getPriceIdForPlan(params.plan);

  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${params.plan}. Set STRIPE_PRICE_${params.plan.toUpperCase()} env var.`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: params.userEmail,
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        user_id: params.userId.toString(),
        plan: params.plan,
      },
    },
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      plan: params.plan,
    },
    success_url: `${params.origin}/dashboard?subscription=success&plan=${params.plan}`,
    cancel_url: `${params.origin}/pricing?canceled=true`,
  });

  return session.url!;
}

/** Creates a Stripe Customer Portal session for managing subscriptions. */
export async function createPortalSession(stripeCustomerId: string, origin: string): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });
  return session.url;
}

export function getPriceIdForPlan(plan: StripePlanId): string | null {
  const map: Record<string, string | undefined> = {
    solo: process.env.STRIPE_PRICE_SOLO ?? process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[plan] ?? null;
}

export function getPlanFromPriceId(priceId: string): StripePlanId | null {
  const solo = process.env.STRIPE_PRICE_SOLO ?? process.env.STRIPE_PRICE_STARTER;
  const pro = process.env.STRIPE_PRICE_PRO;
  const business = process.env.STRIPE_PRICE_BUSINESS;
  const enterprise = process.env.STRIPE_PRICE_ENTERPRISE;
  if (priceId === solo) return "solo";
  if (priceId === pro) return "pro";
  if (priceId === business) return "business";
  if (priceId === enterprise) return "enterprise";
  return null;
}
