import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { SpiderProfile } from "./session";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (key.startsWith("sk_test_")) return new Stripe(key);
  if (key.startsWith("sk_live_") && process.env.STRIPE_LIVE_PAYMENTS_ENABLED === "true") {
    return new Stripe(key);
  }
  return null;
}

export function billingIsEnabled(): boolean {
  return process.env.STRIPE_BILLING_ENABLED === "true";
}

export function getBillingDb() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  const secret = process.env.CONVEX_ADMIN_API_SECRET;
  if (!url || !secret) return null;
  return { client: new ConvexHttpClient(url), secret };
}

export async function getOrCreateStripeCustomer(stripe: Stripe, user: SpiderProfile): Promise<string> {
  const db = getBillingDb();
  if (!db) throw new Error("Billing database connection is not configured.");
  const existing = await db.client.query(api.billing.getCustomer, {
    adminSecret: db.secret,
    discordId: user.id,
  }) as { stripeCustomerId?: string } | null;

  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const customer = await stripe.customers.create({
    metadata: { spiderDiscordId: user.id, platform: "Spider Uncopylocked" },
    name: user.displayName || user.username,
  }, {
    idempotencyKey: "spider-uncopylocked-customer-" + user.id,
  });
  await db.client.mutation(api.billing.saveCustomer, {
    adminSecret: db.secret,
    discordId: user.id,
    stripeCustomerId: customer.id,
  });
  return customer.id;
}
