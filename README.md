# Spider Uncopylocked

A creator-focused community platform for free Roblox development resources, developers, jobs, and marketplace listings.

## Current platform

- Responsive dark interface inspired by modern creator dashboards
- Existing Discord OAuth authentication and Convex database
- Resource library, creator uploads, developer listings, jobs, and marketplace routes
- Owner-only admin dashboard with developer application reviews and a protected billing overview
- Stripe Billing foundation in test-mode-first configuration: hosted subscription checkout, secure card setup, Customer Portal handoff, invoice/receipt display, verified webhooks, subscription metadata, and an authenticated billing settings screen at `/dashboard/settings?tab=billing`

## Deployment

The website is designed for Vercel. It uses its existing Discord session signing secret and Convex deployment. Integrations require server-side environment variables; never commit API secrets or expose them to browser code.

## Billing

Read [BILLING_SETUP.md](./BILLING_SETUP.md) before configuring Stripe. No plan amount or price is assumed by the application; configure recurring Price IDs you approve. Billing remains in setup mode until environment variables are configured and `STRIPE_BILLING_ENABLED=true` is explicitly set. Live Stripe keys are rejected unless a second explicit opt-in is enabled.

Creator-to-creator payments and one-time boosts/shop items are future phases. Developer payouts require Stripe Connect; they should not be mixed with recurring Premium subscriptions.
