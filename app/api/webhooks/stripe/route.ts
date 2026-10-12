import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getBillingDb, getStripe } from "../../../../lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripeId(value: any): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value.id === "string") return value.id;
  return undefined;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = getBillingDb();
  if (!stripe || !webhookSecret || !db) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let customer: { discordId: string; stripeCustomerId: string } | undefined;
  let subscription: {
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    discordId?: string;
    planKey: string;
    priceId?: string;
    status: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd: boolean;
  } | undefined;
  let invoice: {
    stripeInvoiceId: string;
    stripeCustomerId: string;
    discordId?: string;
    invoiceNumber?: string;
    status: string;
    currency: string;
    amountDue: number;
    amountPaid: number;
    createdAt: number;
    invoicePdfUrl?: string;
    hostedInvoiceUrl?: string;
    subscriptionId?: string;
  } | undefined;

  const object: any = event.data.object;
  if (event.type.startsWith("customer.subscription.")) {
    const customerId = stripeId(object.customer);
    if (customerId) {
      const price = object.items?.data?.[0]?.price;
      subscription = {
        stripeSubscriptionId: object.id,
        stripeCustomerId: customerId,
        ...(typeof object.metadata?.discordId === "string" ? { discordId: object.metadata.discordId } : {}),
        planKey: typeof object.metadata?.planKey === "string" ? object.metadata.planKey : "premium",
        ...(typeof price?.id === "string" ? { priceId: price.id } : {}),
        status: typeof object.status === "string" ? object.status : "unknown",
        ...(typeof object.items?.data?.[0]?.current_period_end === "number"
          ? { currentPeriodEnd: object.items.data[0].current_period_end }
          : {}),
        cancelAtPeriodEnd: object.cancel_at_period_end === true,
      };
    }
  }

  if (event.type.startsWith("invoice.")) {
    const customerId = stripeId(object.customer);
    if (customerId) {
      const parentSub = object.parent?.subscription_details?.subscription;
      const subscriptionId = stripeId(object.subscription) || stripeId(parentSub);
      invoice = {
        stripeInvoiceId: object.id,
        stripeCustomerId: customerId,
        ...(typeof object.metadata?.discordId === "string" ? { discordId: object.metadata.discordId } : {}),
        ...(typeof object.number === "string" ? { invoiceNumber: object.number } : {}),
        status: typeof object.status === "string" ? object.status : event.type.split(".").pop() || "unknown",
        currency: typeof object.currency === "string" ? object.currency : "usd",
        amountDue: Number(object.amount_due || 0),
        amountPaid: Number(object.amount_paid || 0),
        createdAt: typeof object.created === "number" ? object.created : Math.floor(Date.now() / 1000),
        ...(typeof object.invoice_pdf === "string" ? { invoicePdfUrl: object.invoice_pdf } : {}),
        ...(typeof object.hosted_invoice_url === "string" ? { hostedInvoiceUrl: object.hosted_invoice_url } : {}),
        ...(subscriptionId ? { subscriptionId } : {}),
      };
    }
  }

  // Setup-mode checkout sessions are reflected by live Stripe payment methods
  // in the account page; they intentionally do not grant any plan entitlement.
  try {
    const result = await db.client.mutation(api.billing.recordStripeWebhook, {
      adminSecret: db.secret,
      eventId: event.id,
      eventType: event.type,
      ...(customer ? { customer } : {}),
      ...(subscription ? { subscription } : {}),
      ...(invoice ? { invoice } : {}),
    });
    return NextResponse.json({ received: true, duplicate: !!(result as any)?.duplicate });
  } catch (error) {
    console.error("Stripe webhook persistence failed for event " + event.id + ":", error);
    // A non-2xx response tells Stripe to retry rather than silently lose the update.
    return NextResponse.json({ error: "Webhook persistence failed." }, { status: 500 });
  }
}
