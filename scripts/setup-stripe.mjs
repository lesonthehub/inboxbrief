/**
 * InboxBrief Stripe Setup Script
 * Creates the 3 subscription products and prices in Stripe,
 * then outputs the price IDs to be set as environment variables.
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌ STRIPE_SECRET_KEY not found in environment");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

const plans = [
  {
    name: "InboxBrief Starter",
    description: "Up to 50 emails per briefing, 3 SMS/day, Gmail integration",
    amount: 900, // $9.00
    envKey: "STRIPE_PRICE_STARTER",
  },
  {
    name: "InboxBrief Pro",
    description: "Up to 200 emails per briefing, 6 SMS/day, Gmail & Outlook integration",
    amount: 1900, // $19.00
    envKey: "STRIPE_PRICE_PRO",
  },
  {
    name: "InboxBrief Business",
    description: "Unlimited emails per briefing, 10 SMS/day, full features & priority support",
    amount: 3900, // $39.00
    envKey: "STRIPE_PRICE_BUSINESS",
  },
];

console.log("🚀 Setting up InboxBrief Stripe products...\n");

const results = [];

for (const plan of plans) {
  try {
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'${plan.name}'`,
    });

    let product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`✅ Product already exists: ${plan.name} (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { inboxbrief: "true" },
      });
      console.log(`✅ Created product: ${plan.name} (${product.id})`);
    }

    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
    });

    let price;
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`   ↳ Using existing price: ${price.id} ($${price.unit_amount / 100}/mo)`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { inboxbrief: "true" },
      });
      console.log(`   ↳ Created price: ${price.id} ($${price.unit_amount / 100}/mo)`);
    }

    results.push({ envKey: plan.envKey, priceId: price.id, name: plan.name });
  } catch (err) {
    console.error(`❌ Failed to create ${plan.name}:`, err.message);
    process.exit(1);
  }
}

console.log("\n📋 Price IDs to set as environment variables:");
console.log("─".repeat(60));
for (const r of results) {
  console.log(`${r.envKey}=${r.priceId}`);
}
console.log("─".repeat(60));
console.log("\n✅ Stripe setup complete!");
console.log("JSON output for programmatic use:");
console.log(JSON.stringify(results, null, 2));
