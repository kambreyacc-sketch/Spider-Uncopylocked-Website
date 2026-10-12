# Billing integration setup

Spider Uncopylocked uses the existing Discord OAuth session and Convex database. Stripe is used only from server-side route handlers; browser code never receives a Stripe secret key. This implementation defaults to Stripe **test mode** and shows no invented amounts.

## 1. Vercel environment variables

Open the Spider Uncopylocked Vercel project → **Settings → Environment Variables**. Add the following values to the environments you plan to test (usually Preview first):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://spider-uncopylocked-website.vercel.app` (replace with the canonical site URL if it changes) |
| `STRIPE_SECRET_KEY` | Stripe **test-mode** secret key starting with `sk_test_` |
| `STRIPE_WEBHOOK_SECRET` | Test-mode webhook endpoint signing secret starting with `whsec_` |
| `STRIPE_BILLING_ENABLED` | Keep `false` or unset during configuration; set to `true` only after the end-to-end test checklist below passes |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | A monthly recurring Price ID you create and approve in Stripe (starts with `price_`) |
| `STRIPE_PRICE_PREMIUM_YEARLY` | A yearly recurring Price ID you create and approve in Stripe (starts with `price_`) |
| `STRIPE_LIVE_PAYMENTS_ENABLED` | Keep unset or `false`. Live keys are refused unless this is explicitly `true`. |

Do not put Stripe secret keys in `NEXT_PUBLIC_*` variables, source code, issues, or chat. The Price IDs are not secrets, but keep monthly and yearly IDs separate. You can configure just one interval at first. Do not configure a live key or live Price IDs for testing.

The Vercel server uses `CONVEX_ADMIN_API_SECRET`. The matching Convex environment variable is `ADMIN_API_SECRET`. Set the **same private value** in the Convex deployment connected to this website. The Convex secret is also used by the existing protected developer-application API. If this secret is not configured correctly, both billing metadata sync and developer application reviews will return service errors.

## 2. Create test plans in Stripe

In Stripe Dashboard, switch to **Test mode**. Create a product such as **Spider Premium**. Add one recurring monthly price and, if you want it, one recurring yearly price. Copy each Price ID into the matching Vercel variable above. The website deliberately does not pick a price or decide your plan benefits for you.

## 3. Configure the Stripe Customer Portal

In Stripe Dashboard **Test mode → Billing → Customer portal**, enable the billing portal and configure the features you want users to manage. Enable payment-method management, default-card selection, and subscription cancellation/updates as appropriate. The website redirects to Stripe's hosted portal for card update, removal, default-card selection, and subscription management.

## 4. Configure the verified webhook

Create a **test-mode** webhook destination with URL:

`https://spider-uncopylocked-website.vercel.app/api/webhooks/stripe`

Subscribe to at least:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.finalized`
- `invoice.voided`
- `invoice.marked_uncollectible`

Copy the endpoint's signing secret to `STRIPE_WEBHOOK_SECRET`. The endpoint verifies Stripe's signature against the raw request body and records event IDs idempotently; failed persistence returns a retryable error. Do not use a secret from Stripe CLI for the deployed endpoint—the CLI's signing secret is for events forwarded by that CLI process.

After setting environment variables, redeploy the site and make sure the matching Convex deployment has the schema and functions from this repo deployed.

## 5. Test mode checklist before enabling billing

Use Stripe's official test cards and verify each workflow with the Stripe Dashboard and webhook delivery page:

1. Add a card in hosted setup Checkout; confirm only brand, last four digits, and expiry are shown on Spider.
2. Set another default payment method, update a card, and remove a card through the hosted Customer Portal.
3. Complete a monthly test subscription; confirm subscription data arrives from a signed webhook and is saved to Convex.
4. Repeat for yearly if that plan is configured.
5. Trigger a declined/failed renewal test; check that the subscription status and invoice change through webhook events.
6. Cancel a subscription immediately and at period end; verify the resulting status and end date.
7. Replay a webhook; verify the stored event ID prevents duplicate invoice/subscription records.
8. Send an invalid signature; verify the endpoint rejects it.
9. Open a success URL directly without paying; verify that it does **not** create an active subscription.
10. Confirm `/api/admin/billing` is forbidden unless signed in as the authorized Spider administrator.

Only after these checks pass should test billing be enabled with `STRIPE_BILLING_ENABLED=true`. Keep the Stripe account and secret key in test mode. Live charges are a separate deliberate launch step, requiring a live key, the explicit `STRIPE_LIVE_PAYMENTS_ENABLED=true` opt-in, approved live recurring prices, and a live webhook signing secret.

## Architecture and future phases

- **Now: Premium membership.** Recurring monthly/yearly subscriptions, hosted Checkout, payment-method setup, Customer Portal management, webhook-synced subscription/invoice metadata, authenticated billing settings, and a protected admin view.
- **Later: boosts and shop items.** Implement as one-time Checkout purchases with a server-verified purchase ledger and explicit product/boost entitlements; do not pretend these are subscriptions.
- **Later: paying developers.** Use Stripe Connect with connected-account onboarding and verified payouts/payments. A buyer paying a creator is a marketplace funds flow with additional onboarding, dispute, refunds, and compliance requirements; it is not the same as charging a recurring Spider Premium membership. Do not route creator funds through the site's subscription product.

The protected endpoint `GET /api/billing/entitlement` derives premium status from the subscription state written by signed webhooks. Premium-only pages and APIs must check that server-side entitlement before returning premium resources; never trust a query parameter, local storage, a client-only badge, or a Checkout success redirect for authorization.

## References

- [Stripe Checkout](https://docs.stripe.com/payments/checkout)
- [Stripe Billing subscriptions](https://docs.stripe.com/billing/subscriptions/overview)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
- [Stripe Customer Portal](https://docs.stripe.com/customer-management)
- [Stripe Connect](https://docs.stripe.com/connect)
