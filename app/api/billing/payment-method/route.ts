import { NextResponse } from "next/server";
import { getSpiderProfile } from "../../../../lib/session";
import { billingIsEnabled, getOrCreateStripeCustomer, getStripe } from "../../../../lib/stripe";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to manage payment methods." }, { status: 401 });
  if (!billingIsEnabled()) return NextResponse.json({ error: "Billing setup is not enabled yet." }, { status: 503 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe test mode is not configured." }, { status: 503 });

  try {
    const customer = await getOrCreateStripeCustomer(stripe, user);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer,
      payment_method_types: ["card"],
      client_reference_id: user.id,
      metadata: { discordId: user.id, purpose: "save_payment_method" },
      success_url: new URL("/dashboard/settings?tab=billing&payment_method=added", origin).toString(),
      cancel_url: new URL("/dashboard/settings?tab=billing&payment_method=cancelled", origin).toString(),
    });
    if (!session.url) return NextResponse.json({ error: "Stripe did not return a setup URL." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe setup session creation failed:", error);
    return NextResponse.json({ error: "Could not open secure card setup. Please try again later." }, { status: 502 });
  }
}
