/**
 * Creates the Enterprise ($79/month) Stripe price if it doesn't exist.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

async function main() {
  // Check if Enterprise product already exists
  const products = await stripe.products.list({ limit: 20 });
  let enterpriseProduct = products.data.find(p => p.name === "InboxBrief Enterprise");

  if (!enterpriseProduct) {
    enterpriseProduct = await stripe.products.create({
      name: "InboxBrief Enterprise",
      description: "Unlimited emails, unlimited SMS, unlimited team members. Full-scale briefing for growing organizations.",
      metadata: { plan: "enterprise" },
    });
    console.log("Created Enterprise product:", enterpriseProduct.id);
  } else {
    console.log("Enterprise product already exists:", enterpriseProduct.id);
  }

  // Check if price already exists for this product
  const prices = await stripe.prices.list({ product: enterpriseProduct.id, limit: 10 });
  let enterprisePrice = prices.data.find(p => p.unit_amount === 7900 && p.recurring?.interval === "month");

  if (!enterprisePrice) {
    enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 7900, // $79.00
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "enterprise" },
    });
    console.log("Created Enterprise price:", enterprisePrice.id);
  } else {
    console.log("Enterprise price already exists:", enterprisePrice.id);
  }

  console.log("\n✅ Enterprise price ID:", enterprisePrice.id);
  console.log("Set this as STRIPE_PRICE_ENTERPRISE in your secrets.");
}

main().catch(console.error);
