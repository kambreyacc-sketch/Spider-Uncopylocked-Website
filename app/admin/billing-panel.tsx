"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

type Data = {
  customers: Array<{ discordId: string; stripeCustomerId: string; createdAt: number }>;
  subscriptions: Array<{ discordId: string; stripeSubscriptionId: string; planKey: string; status: string; currentPeriodEnd?: number; cancelAtPeriodEnd: boolean }>;
  invoices: Array<{ discordId: string; stripeInvoiceId: string; status: string; currency: string; amountPaid: number; createdAt: number; invoiceNumber?: string }>;
  recentWebhookEvents: Array<{ eventId: string; type: string; processedAt: number }>;
};
const displayDate = (value?: number) => value ? new Date(value > 1000000000000 ? value : value * 1000).toLocaleString() : "—";
const money = (amount: number, currency: string) => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() }).format(amount / 100); } catch { return (amount / 100).toFixed(2); } };

export default function BillingAdminPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/billing", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to fetch billing records.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to fetch billing records."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const activeCount = data?.subscriptions.filter(sub => sub.status === "active" || sub.status === "trialing").length || 0;
  return <div className="billing-admin-content">
    <div className="billing-admin-head"><div><span className="admin-kicker">OWNER ONLY / STRIPE METADATA</span><h2>Billing overview</h2><p>Account mappings, subscription statuses, invoice references, and webhook processing. No full card details or payment credentials are stored here.</p></div><button onClick={() => void load()} disabled={loading} className="billing-secondary-button"><RefreshCw size={15}/> Refresh</button></div>
    {error && <div className="billing-alert error"><AlertTriangle size={17}/>{error}</div>}
    <div className="billing-admin-stats">
      <article><CreditCard size={19}/><small>Linked customers</small><strong>{loading ? "—" : data?.customers.length || 0}</strong></article>
      <article><CheckCircle2 size={19}/><small>Active subscriptions</small><strong>{loading ? "—" : activeCount}</strong></article>
      <article><ShieldCheck size={19}/><small>Invoice records</small><strong>{loading ? "—" : data?.invoices.length || 0}</strong></article>
    </div>
    <section className="billing-admin-table-wrap"><div className="billing-admin-table-title"><h3>Subscriptions</h3><span>Most recent 500</span></div>
      {data?.subscriptions.length ? <div className="billing-admin-table-scroll"><table><thead><tr><th>Discord account ID</th><th>Plan</th><th>Status</th><th>Renewal / end</th><th>Stripe reference</th></tr></thead><tbody>{data.subscriptions.map(sub => <tr key={sub.stripeSubscriptionId}><td>{sub.discordId}</td><td>{sub.planKey}</td><td><span className={"billing-status " + (sub.status === "active" || sub.status === "trialing" ? "active" : "")}>{sub.status}</span>{sub.cancelAtPeriodEnd && <small className="billing-admin-subline">Cancels at period end</small>}</td><td>{displayDate(sub.currentPeriodEnd)}</td><td className="billing-mono">{sub.stripeSubscriptionId}</td></tr>)}</tbody></table></div> : <p className="billing-admin-empty">{loading ? "Loading billing records…" : "No subscription webhooks have been processed yet."}</p>}
    </section>
    <section className="billing-admin-table-wrap"><div className="billing-admin-table-title"><h3>Invoices</h3><span>Most recent 500</span></div>
      {data?.invoices.length ? <div className="billing-admin-table-scroll"><table><thead><tr><th>Discord account ID</th><th>Invoice</th><th>Status</th><th>Paid</th><th>Created</th></tr></thead><tbody>{data.invoices.map(invoice => <tr key={invoice.stripeInvoiceId}><td>{invoice.discordId}</td><td>{invoice.invoiceNumber || invoice.stripeInvoiceId}</td><td>{invoice.status}</td><td>{money(invoice.amountPaid, invoice.currency)}</td><td>{displayDate(invoice.createdAt)}</td></tr>)}</tbody></table></div> : <p className="billing-admin-empty">{loading ? "Loading invoice records…" : "No invoice webhook records yet."}</p>}
    </section>
    <section className="billing-admin-table-wrap"><div className="billing-admin-table-title"><h3>Recent webhook events</h3><span>Most recent 100</span></div>
      {data?.recentWebhookEvents.length ? <div className="billing-admin-table-scroll"><table><thead><tr><th>Event</th><th>Event ID</th><th>Processed</th></tr></thead><tbody>{data.recentWebhookEvents.map(event => <tr key={event.eventId}><td>{event.type}</td><td className="billing-mono">{event.eventId}</td><td>{displayDate(event.processedAt)}</td></tr>)}</tbody></table></div> : <p className="billing-admin-empty">{loading ? "Loading webhook events…" : "No webhook events recorded yet."}</p>}
    </section>
    <p className="billing-legal-note"><ShieldCheck size={14}/> This view requires the existing Spider administrator Discord ID check and server-side billing secret. Payment credentials are not visible to administrators.</p>
  </div>;
}
