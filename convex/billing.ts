import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertBillingSecret(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) {
    throw new Error("Unauthorized billing service request.");
  }
}

const subscriptionValidator = v.object({
  stripeSubscriptionId: v.string(),
  stripeCustomerId: v.string(),
  discordId: v.optional(v.string()),
  planKey: v.string(),
  priceId: v.optional(v.string()),
  status: v.string(),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.boolean(),
});

const invoiceValidator = v.object({
  stripeInvoiceId: v.string(),
  stripeCustomerId: v.string(),
  discordId: v.optional(v.string()),
  invoiceNumber: v.optional(v.string()),
  status: v.string(),
  currency: v.string(),
  amountDue: v.number(),
  amountPaid: v.number(),
  createdAt: v.number(),
  invoicePdfUrl: v.optional(v.string()),
  hostedInvoiceUrl: v.optional(v.string()),
  subscriptionId: v.optional(v.string()),
});

export const getCustomer = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    return await ctx.db.query("billingCustomers")
      .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
      .unique();
  },
});

export const saveCustomer = mutation({
  args: {
    adminSecret: v.string(),
    discordId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    const byDiscord = await ctx.db.query("billingCustomers")
      .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
      .unique();
    const byStripe = await ctx.db.query("billingCustomers")
      .withIndex("by_stripeCustomerId", q => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();

    if (byStripe && byStripe.discordId !== args.discordId) {
      throw new Error("Stripe customer is already linked to another account.");
    }
    if (byDiscord && byDiscord.stripeCustomerId !== args.stripeCustomerId) {
      throw new Error("This Discord account already has a different Stripe customer.");
    }
    const now = Date.now();
    if (byDiscord) {
      await ctx.db.patch(byDiscord._id, { updatedAt: now });
      return { success: true, stripeCustomerId: byDiscord.stripeCustomerId };
    }
    await ctx.db.insert("billingCustomers", {
      discordId: args.discordId,
      stripeCustomerId: args.stripeCustomerId,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, stripeCustomerId: args.stripeCustomerId };
  },
});

/**
 * Called only by the verified Stripe webhook route. Event deduplication and
 * billing-state updates happen in one Convex mutation, so Stripe retries are safe.
 */
export const recordStripeWebhook = mutation({
  args: {
    adminSecret: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    customer: v.optional(v.object({ discordId: v.string(), stripeCustomerId: v.string() })),
    subscription: v.optional(subscriptionValidator),
    invoice: v.optional(invoiceValidator),
  },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    const duplicate = await ctx.db.query("billingWebhookEvents")
      .withIndex("by_eventId", q => q.eq("eventId", args.eventId))
      .unique();
    if (duplicate) return { success: true, duplicate: true };

    if (args.customer) {
      const byDiscord = await ctx.db.query("billingCustomers")
        .withIndex("by_discordId", q => q.eq("discordId", args.customer!.discordId))
        .unique();
      const byStripe = await ctx.db.query("billingCustomers")
        .withIndex("by_stripeCustomerId", q => q.eq("stripeCustomerId", args.customer!.stripeCustomerId))
        .unique();
      if (byStripe && byStripe.discordId !== args.customer.discordId) {
        throw new Error("Stripe customer mapping conflict.");
      }
      if (byDiscord && byDiscord.stripeCustomerId !== args.customer.stripeCustomerId) {
        throw new Error("Discord customer mapping conflict.");
      }
      if (!byDiscord) {
        await ctx.db.insert("billingCustomers", {
          discordId: args.customer.discordId,
          stripeCustomerId: args.customer.stripeCustomerId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    const customerId = args.subscription?.stripeCustomerId ?? args.invoice?.stripeCustomerId ?? args.customer?.stripeCustomerId;
    const mapping = customerId
      ? await ctx.db.query("billingCustomers")
          .withIndex("by_stripeCustomerId", q => q.eq("stripeCustomerId", customerId))
          .unique()
      : null;
    const discordId = args.subscription?.discordId ?? args.invoice?.discordId ?? args.customer?.discordId ?? mapping?.discordId;

    if (args.subscription && discordId) {
      const existing = await ctx.db.query("billingSubscriptions")
        .withIndex("by_stripeSubscriptionId", q => q.eq("stripeSubscriptionId", args.subscription!.stripeSubscriptionId))
        .unique();
      const value = {
        discordId,
        stripeCustomerId: args.subscription.stripeCustomerId,
        stripeSubscriptionId: args.subscription.stripeSubscriptionId,
        planKey: args.subscription.planKey,
        ...(args.subscription.priceId ? { priceId: args.subscription.priceId } : {}),
        status: args.subscription.status,
        ...(typeof args.subscription.currentPeriodEnd === "number" ? { currentPeriodEnd: args.subscription.currentPeriodEnd } : {}),
        cancelAtPeriodEnd: args.subscription.cancelAtPeriodEnd,
        updatedAt: Date.now(),
      };
      if (existing) await ctx.db.patch(existing._id, value);
      else await ctx.db.insert("billingSubscriptions", { ...value, createdAt: Date.now() });
    }

    if (args.invoice && discordId) {
      const existing = await ctx.db.query("billingInvoices")
        .withIndex("by_stripeInvoiceId", q => q.eq("stripeInvoiceId", args.invoice!.stripeInvoiceId))
        .unique();
      const value = {
        discordId,
        stripeCustomerId: args.invoice.stripeCustomerId,
        stripeInvoiceId: args.invoice.stripeInvoiceId,
        ...(args.invoice.invoiceNumber ? { invoiceNumber: args.invoice.invoiceNumber } : {}),
        status: args.invoice.status,
        currency: args.invoice.currency,
        amountDue: args.invoice.amountDue,
        amountPaid: args.invoice.amountPaid,
        createdAt: args.invoice.createdAt,
        ...(args.invoice.invoicePdfUrl ? { invoicePdfUrl: args.invoice.invoicePdfUrl } : {}),
        ...(args.invoice.hostedInvoiceUrl ? { hostedInvoiceUrl: args.invoice.hostedInvoiceUrl } : {}),
        ...(args.invoice.subscriptionId ? { subscriptionId: args.invoice.subscriptionId } : {}),
      };
      if (existing) await ctx.db.patch(existing._id, value);
      else await ctx.db.insert("billingInvoices", value);
    }

    await ctx.db.insert("billingWebhookEvents", {
      eventId: args.eventId,
      type: args.eventType,
      processedAt: Date.now(),
    });
    return { success: true, duplicate: false };
  },
});

export const listAccountBilling = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    const [customer, subscriptions, invoices] = await Promise.all([
      ctx.db.query("billingCustomers")
        .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
        .unique(),
      ctx.db.query("billingSubscriptions")
        .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
        .order("desc").take(20),
      ctx.db.query("billingInvoices")
        .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
        .order("desc").take(25),
    ]);
    return {
      customer: customer ? { stripeCustomerId: customer.stripeCustomerId } : null,
      subscriptions: subscriptions.map(({ _id, _creationTime, ...item }) => item),
      invoices: invoices.map(({ _id, _creationTime, ...item }) => item),
    };
  },
});

export const listForAdmin = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    const [customers, subscriptions, invoices, events] = await Promise.all([
      ctx.db.query("billingCustomers").order("desc").take(300),
      ctx.db.query("billingSubscriptions").order("desc").take(500),
      ctx.db.query("billingInvoices").order("desc").take(500),
      ctx.db.query("billingWebhookEvents").order("desc").take(100),
    ]);
    return {
      customers: customers.map(({ _id, _creationTime, ...customer }) => customer),
      subscriptions: subscriptions.map(({ _id, _creationTime, ...subscription }) => subscription),
      invoices: invoices.map(({ _id, _creationTime, ...invoice }) => invoice),
      recentWebhookEvents: events.map(({ _id, _creationTime, ...event }) => event),
    };
  },
});


export const getEntitlement = query({
  args: { adminSecret: v.string(), discordId: v.string() },
  handler: async (ctx, args) => {
    assertBillingSecret(args.adminSecret);
    const subscriptions = await ctx.db.query("billingSubscriptions")
      .withIndex("by_discordId", q => q.eq("discordId", args.discordId))
      .order("desc").take(50);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const active = subscriptions.find(sub =>
      (sub.status === "active" || sub.status === "trialing") &&
      (sub.currentPeriodEnd === undefined || sub.currentPeriodEnd > nowSeconds)
    );
    return {
      premium: !!active,
      planKey: active?.planKey ?? "free",
      status: active?.status ?? "free",
      renewalDate: active?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: active?.cancelAtPeriodEnd ?? false,
    };
  },
});
