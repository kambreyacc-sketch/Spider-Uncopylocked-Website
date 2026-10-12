import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { billingIsEnabled, getBillingDb, getStripe, stripeWebhookIsConfigured } from "../../../../lib/stripe";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to manage billing." }, { status: 401 });
  if (!billingIsEnabled()) return NextResponse.json({ error: "Billing is not enabled yet." }, { status: 503 });
  if (!stripeWebhookIsConfigured()) return NextResponse.json({ error: "Verified Stripe webhook setup is required before subscription management is enabled." }, { status: 503 });
  const stripe = getStripe();
  const db = getBillingDb();
  if (!stripe || !db) return NextResponse.json({ error: "Billing has not been fully configured." }, { status: 503 });

  try {
    const customer = await db.client.query(api.billing.getCustomer, {
      adminSecret: db.secret,
      discordId: user.id,
    }) as { stripeCustomerId?: string } | null;
    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe billing profile exists yet. Add a payment method or select a plan first." }, { status: 404 });
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: new URL("/dashboard/settings?tab=billing", origin).toString(),
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal session creation failed:", error);
    return NextResponse.json({ error: "The billing portal is unavailable. Check the Stripe Customer Portal settings." }, { status: 502 });
  }
}
