"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, CalendarClock, CheckCircle2, CircleAlert, CreditCard, ExternalLink, LoaderCircle, LockKeyhole, Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type CardInfo = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };
type Invoice = { id: string; number: string; status: string; currency: string; amountDue: number; amountPaid: number; createdAt: number; pdfUrl?: string; hostedUrl?: string };
type BillingData = {
  billingEnabled: boolean;
  configured: boolean;
  user: { id: string; displayName: string; avatar: string };
  plan: { name: string; status: string; renewalDate: number | null; cancelAtPeriodEnd: boolean };
  paymentMethods: CardInfo[];
  invoices: Invoice[];
  priceAvailability: { monthly: boolean; yearly: boolean };
  message?: string;
};
type Props = { user: { id: string; displayName: string; avatar: string } };

function money(amount: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amount / 100); }
  catch { return (amount / 100).toFixed(2) + " " + currency.toUpperCase(); }
}
function date(timestamp: number | null | undefined) {
  if (!timestamp) return "Not scheduled";
  return new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function prettyStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BillingSettingsClient({ user }: Props) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/overview", { cache: "no-store" });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Could not load billing details.");
      setData(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load billing details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") setNotice("You returned from Checkout. Subscription access updates only after a verified Stripe webhook confirms the status.");
    else if (params.get("checkout") === "cancelled") setNotice("Checkout was cancelled. No subscription was activated by this return.");
    else if (params.get("payment_method") === "added") setNotice("Card setup finished. Refreshing the payment methods attached to your Stripe customer.");
    if (params.has("checkout") || params.has("payment_method")) {
      params.delete("checkout");
      params.delete("payment_method");
      const suffix = params.toString() ? "?" + params.toString() : "";
      window.history.replaceState({}, "", window.location.pathname + suffix);
    }
  }, [refresh]);

  async function goToStripe(endpoint: string, label: string, body?: unknown) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not open Stripe.");
      if (typeof result.url !== "string" || !result.url.startsWith("https://")) throw new Error("Stripe did not return a secure hosted URL.");
      window.location.assign(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open Stripe.");
      setBusy("");
    }
  }

  const canManage = !!data?.configured && !!data?.billingEnabled;
  const monthlyReady = !!data?.priceAvailability.monthly && canManage;
  const yearlyReady = !!data?.priceAvailability.yearly && canManage;

  return (
    <div className="billing-content">
      <div className="billing-tabs" role="tablist" aria-label="Settings tabs">
        <span>Account</span><span className="selected" role="tab" aria-selected="true">Billing</span>
      </div>

      {error && <div className="billing-alert error" role="alert"><CircleAlert size={17} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="billing-alert success" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

      <div className="billing-section-title"><h2>Your plan</h2><span className="billing-subtle">For {user.displayName}</span></div>
      <section className="billing-plan-card">
        <div className="billing-plan-symbol"><Sparkles size={21} /></div>
        <div className="billing-plan-details">
          <div className="billing-plan-title"><h3>{loading ? "Loading plan…" : data?.plan.name || "Free"}</h3><span className={"billing-status " + (data?.plan.status === "active" || data?.plan.status === "trialing" ? "active" : "")}>{loading ? "Checking" : prettyStatus(data?.plan.status || "free")}</span></div>
          <p>{data?.plan.status === "active" || data?.plan.status === "trialing" ? data.plan.cancelAtPeriodEnd ? "Your subscription is set to cancel at the end of the current period." : "Your premium membership is active." : "You are currently on the free plan. No paid plan is active."}</p>
          <small>{data?.plan.renewalDate ? (data.plan.cancelAtPeriodEnd ? "Access ends " : "Next renewal ") + date(data.plan.renewalDate) : "No renewal scheduled"}</small>
        </div>
        <div className="billing-plan-actions">
          <button className="billing-secondary-button" onClick={() => void goToStripe("/api/billing/portal", "portal")} disabled={!canManage || !data?.configured || busy !== "" || !(data?.paymentMethods.length || data?.plan.status !== "free")}>
            {busy === "portal" ? <LoaderCircle size={15} className="spin" /> : <ExternalLink size={15} />} Manage subscription
          </button>
        </div>
      </section>

      <div className="billing-section-title"><h2>Premium plans</h2><span className="billing-subtle">Monthly or yearly</span></div>
      <section className="billing-premium-card">
        <div className="billing-premium-icon"><Sparkles size={20} /></div>
        <div className="billing-premium-copy"><span className="billing-kicker">SPIDER PREMIUM</span><h3>More for your creator workflow</h3><p>Choose a paid membership after the owner configures the official recurring plan price. The site will not invent a price.</p><div className="billing-plan-checks"><span><CheckCircle2 size={14}/> Monthly or yearly renewal</span><span><CheckCircle2 size={14}/> Manage or cancel from Stripe</span><span><CheckCircle2 size={14}/> Receipts and invoice history</span></div></div>
        <div className="billing-premium-actions">
          <button className="billing-primary-button" onClick={() => void goToStripe("/api/billing/checkout", "monthly", { interval: "monthly" })} disabled={!monthlyReady || busy !== ""}>{busy === "monthly" ? <LoaderCircle size={15} className="spin"/> : <ArrowUpRight size={15}/>} Choose monthly</button>
          <button className="billing-secondary-button" onClick={() => void goToStripe("/api/billing/checkout", "yearly", { interval: "yearly" })} disabled={!yearlyReady || busy !== ""}>{busy === "yearly" ? <LoaderCircle size={15} className="spin"/> : <ArrowUpRight size={15}/>} Choose yearly</button>
          {!monthlyReady && !yearlyReady && <small>Not available yet — waiting for Stripe test mode and owner-approved Price IDs.</small>}
        </div>
      </section>

      <div className="billing-grid">
        <section className="billing-panel">
          <div className="billing-panel-heading"><div><h2>Payment methods</h2><p>Only safe card details are shown here.</p></div><CreditCard size={19}/></div>
          {loading ? <div className="billing-skeleton"><span/><span/></div> : data?.paymentMethods.length ? (
            <div className="billing-card-list">{data.paymentMethods.map(card => <div className="billing-saved-card" key={card.id}><div className="billing-card-mark"><CreditCard size={18}/></div><div className="billing-card-details"><b>{card.brand.toUpperCase()} ···· {card.last4}</b><small>Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}</small></div>{card.isDefault && <span className="billing-default-pill">Default</span>}</div>)}</div>
          ) : <div className="billing-empty"><CreditCard size={25}/><b>No saved cards</b><p>Add a card securely through Stripe Checkout. Full card details never pass through Spider's server.</p></div>}
          <button className="billing-secondary-button full-width" onClick={() => void goToStripe("/api/billing/payment-method", "setup")} disabled={!canManage || busy !== ""}>
            {busy === "setup" ? <LoaderCircle size={15} className="spin"/> : <Plus size={15}/>} Add payment method
          </button>
          <p className="billing-quiet-note"><LockKeyhole size={13}/> Card updates, removal, and default-card selection are handled in Stripe's secure portal.</p>
        </section>

        <section className="billing-panel">
          <div className="billing-panel-heading"><div><h2>Billing information</h2><p>Keep your account and renewals in order.</p></div><CalendarClock size={19}/></div>
          <div className="billing-detail-row"><span>Subscription status</span><b>{loading ? "Loading…" : prettyStatus(data?.plan.status || "free")}</b></div>
          <div className="billing-detail-row"><span>Next renewal</span><b>{loading ? "Loading…" : date(data?.plan.renewalDate)}</b></div>
          <div className="billing-detail-row"><span>Payment provider</span><b>Stripe {data?.configured ? "connected" : "not configured"}</b></div>
          <div className="billing-detail-row"><span>Account</span><b>{user.displayName}</b></div>
          <button className="billing-secondary-button full-width" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/> Refresh billing details</button>
          {data?.message && <p className="billing-quiet-note"><CircleAlert size={13}/>{data.message}</p>}
        </section>
      </div>

      <section className="billing-panel billing-invoices-panel">
        <div className="billing-panel-heading"><div><h2>Billing history</h2><p>Completed charges and available receipts from Stripe.</p></div><ArrowDownToLine size={19}/></div>
        {loading ? <div className="billing-skeleton"><span/><span/><span/></div> : data?.invoices.length ? (
          <div className="billing-invoice-list">
            {data.invoices.map(invoice => <div key={invoice.id} className="billing-invoice-row">
              <div className="billing-invoice-icon"><ArrowDownToLine size={16}/></div>
              <div className="billing-invoice-title"><b>{invoice.number || invoice.id}</b><small>{date(invoice.createdAt * 1000)}</small></div>
              <span className={"billing-status " + (invoice.status === "paid" ? "active" : "")}>{prettyStatus(invoice.status || "unknown")}</span>
              <b className="billing-invoice-amount">{money(invoice.amountPaid || invoice.amountDue || 0, invoice.currency || "usd")}</b>
              {invoice.pdfUrl || invoice.hostedUrl ? <a className="billing-invoice-download" href={invoice.pdfUrl || invoice.hostedUrl} target="_blank" rel="noreferrer">Receipt <ExternalLink size={14}/></a> : <span className="billing-no-receipt">Unavailable</span>}
            </div>)}
          </div>
        ) : <div className="billing-empty billing-empty-invoices"><ArrowDownToLine size={25}/><b>No billing history yet</b><p>Invoices and receipts will appear here after Stripe records billing events. No sample transactions are displayed.</p></div>}
      </section>
      <p className="billing-legal-note"><ShieldCheck size={14}/> Premium access is activated or changed only by verified server-side Stripe webhook events—not by returning to a success page.</p>
    </div>
  );
}
