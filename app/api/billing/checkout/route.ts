import { NextResponse } from "next/server";
import { getSpiderProfile } from "../../../../lib/session";
import { billingIsEnabled, getOrCreateStripeCustomer, getStripe } from "../../../../lib/stripe";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord before subscribing." }, { status: 401 });
  if (!billingIsEnabled()) return NextResponse.json({ error: "Billing is not enabled yet. No payments can be started." }, { status: 503 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "A Stripe test-mode secret key is required. Live payments are disabled by default." }, { status: 503 });

  let body: { interval?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const interval = body.interval === "yearly" ? "yearly" : body.interval === "monthly" ? "monthly" : null;
  if (!interval) return NextResponse.json({ error: "Select a configured billing interval." }, { status: 400 });
  const priceId = interval === "monthly"
    ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY
    : process.env.STRIPE_PRICE_PREMIUM_YEARLY;
  if (!priceId || !priceId.startsWith("price_")) {
    return NextResponse.json({ error: "That premium plan has not been configured by the site owner yet." }, { status: 503 });
  }

  try {
    const customer = await getOrCreateStripeCustomer(stripe, user);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: false,
      client_reference_id: user.id,
      metadata: { discordId: user.id, planKey: "premium", interval },
      subscription_data: { metadata: { discordId: user.id, planKey: "premium", interval } },
      success_url: new URL("/dashboard/settings?tab=billing&checkout=success", origin).toString(),
      cancel_url: new URL("/dashboard/settings?tab=billing&checkout=cancelled", origin).toString(),
    }, { idempotencyKey: "spider-checkout-" + user.id + "-" + interval + "-" + Date.now() });
    if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout creation failed:", error);
    return NextResponse.json({ error: "Checkout could not be started. Please try again later." }, { status: 502 });
  }
}
