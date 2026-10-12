import Link from "next/link";
import { CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";
import { getSpiderProfile } from "../../../lib/session";
import SpiderSidebar from "../../components/SpiderSidebar";
import BillingSettingsClient from "./billing-client";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const user = await getSpiderProfile();
  return (
    <main className="billing-layout">
      <SpiderSidebar />
      <section className="billing-main">
        <div className="billing-breadcrumb"><Link href="/"><ArrowLeft size={14} /> Spider Uncopylocked</Link><span>/</span><span>Settings</span><span>/</span><strong>Billing</strong></div>
        <header className="billing-page-heading">
          <div className="billing-heading-icon"><CreditCard size={21} /></div>
          <div><span className="billing-kicker">ACCOUNT / BILLING</span><h1>Billing &amp; Payment Methods</h1><p>Manage your plan, cards, subscription renewals, and receipts.</p></div>
        </header>
        {!user ? (
          <section className="billing-signin-card">
            <ShieldCheck size={26} />
            <h2>Sign in to view your billing</h2>
            <p>Your billing details are tied to your authenticated Discord account.</p>
            <Link href="/api/auth/discord/login" className="billing-primary-button">Sign in with Discord</Link>
          </section>
        ) : (
          <BillingSettingsClient user={{ id: user.id, displayName: user.displayName, avatar: user.avatar }} />
        )}
        <footer className="billing-footer"><ShieldCheck size={15} /><span>Payments are processed by Stripe. Spider Uncopylocked does not store your full card number or CVC.</span></footer>
      </section>
    </main>
  );
}
