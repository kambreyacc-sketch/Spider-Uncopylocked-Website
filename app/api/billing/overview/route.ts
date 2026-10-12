import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getSpiderProfile } from "../../../../lib/session";
import { billingIsEnabled, getBillingDb, getStripe } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSpiderProfile();
  if (!user) return NextResponse.json({ error: "Sign in with Discord to view billing." }, { status: 401 });

  const enabled = billingIsEnabled();
  const db = getBillingDb();
  const stripe = getStripe();
  let stored = { customer: null as { stripeCustomerId: string } | null, subscriptions: [] as any[], invoices: [] as any[] };

  if (db) {
    try {
      stored = await db.client.query(api.billing.listAccountBilling, {
        adminSecret: db.secret,
        discordId: user.id,
      }) as typeof stored;
    } catch (error) {
      console.error("Billing overview database query failed:", error);
      return NextResponse.json({ error: "Billing records are temporarily unavailable." }, { status: 502 });
    }
  }

  let paymentMethods: Array<{ id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean }> = [];
  let latestInvoices = stored.invoices;
  let liveSubscriptions: Array<{ id: string; status: string; currentPeriodEnd?: number; cancelAtPeriodEnd: boolean }> = [];

  if (stripe && stored.customer?.stripeCustomerId) {
    try {
      const customerId = stored.customer.stripeCustomerId;
      const [methods, subscriptions, invoices, customer] = await Promise.all([
        stripe.paymentMethods.list({ customer: customerId, type: "card" }),
        stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 }),
        stripe.invoices.list({ customer: customerId, limit: 12 }),
        stripe.customers.retrieve(customerId),
      ]);
      let defaultId: string | null = null;
      if (!customer.deleted) {
        const defaultMethod = customer.invoice_settings.default_payment_method;
        if (typeof defaultMethod === "string") defaultId = defaultMethod;
        else if (defaultMethod) defaultId = defaultMethod.id;
      }
      paymentMethods = methods.data.map((method) => ({
        id: method.id,
        brand: method.card?.brand || "Card",
        last4: method.card?.last4 || "••••",
        expMonth: method.card?.exp_month || 0,
        expYear: method.card?.exp_year || 0,
        isDefault: method.id === defaultId,
      }));
      liveSubscriptions = subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.items.data[0]?.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }));
      latestInvoices = invoices.data.map((invoice) => ({
        stripeInvoiceId: invoice.id,
        invoiceNumber: invoice.number || undefined,
        status: invoice.status || "draft",
        currency: invoice.currency,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        createdAt: invoice.created,
        invoicePdfUrl: invoice.invoice_pdf || undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      }));
    } catch (error) {
      console.error("Stripe billing overview fetch failed:", error);
      // Keep saved webhook records available if Stripe has a temporary API issue.
    }
  }

  const plan = liveSubscriptions.find((item) => ["active", "trialing", "past_due", "unpaid"].includes(item.status));
  return NextResponse.json({
    billingEnabled: enabled,
    configured: !!stripe && !!db,
    user: { id: user.id, displayName: user.displayName, avatar: user.avatar },
    plan: plan ? {
      name: "Premium",
      status: plan.status,
      renewalDate: plan.currentPeriodEnd ? plan.currentPeriodEnd * 1000 : null,
      cancelAtPeriodEnd: plan.cancelAtPeriodEnd,
    } : { name: "Free", status: "free", renewalDate: null, cancelAtPeriodEnd: false },
    paymentMethods,
    invoices: latestInvoices.map((invoice: any) => ({
      id: invoice.stripeInvoiceId,
      number: invoice.invoiceNumber || invoice.number || invoice.stripeInvoiceId,
      status: invoice.status,
      currency: invoice.currency,
      amountDue: invoice.amountDue,
      amountPaid: invoice.amountPaid,
      createdAt: invoice.createdAt,
      pdfUrl: invoice.invoicePdfUrl,
      hostedUrl: invoice.hostedInvoiceUrl,
    })),
    priceAvailability: {
      monthly: !!process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: !!process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
    message: !enabled
      ? "Billing is in setup mode. No charges can be started until you enable Stripe test billing."
      : !stripe || !db
        ? "Stripe billing credentials or the database service secret are not configured."
        : !process.env.STRIPE_PRICE_PREMIUM_MONTHLY && !process.env.STRIPE_PRICE_PREMIUM_YEARLY
          ? "No paid plans are configured yet. No price has been invented."
          : undefined,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
