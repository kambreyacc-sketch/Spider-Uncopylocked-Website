import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import { Activity, BadgeCheck, BarChart3, Check, ChevronRight, CircleDollarSign, Crown, Eye, LockKeyhole, MessageSquare, Palette, ShieldCheck, Sparkles, UsersRound, Zap } from "lucide-react";
import { getSpiderProfile } from "../../lib/session";
import { billingIsReady, getStripe } from "../../lib/stripe";
import { getSpiderProEntitlement } from "../../lib/pro-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spider Pro | Creator Membership", description: "Explore Spider Pro benefits and check your current membership." };

const benefits = [
  { icon: Eye, title: "Featured creator placement", detail: "More visibility in discovery once promoted placement is enabled." },
  { icon: BarChart3, title: "Advanced creator analytics", detail: "Deeper profile and portfolio insights based on real recorded activity." },
  { icon: Palette, title: "Expanded profile customization", detail: "More ways to present your work, specialties, and portfolio." },
  { icon: Zap, title: "Creator workflow tools", detail: "Saved lists, profile controls, and productivity features as they ship." },
  { icon: CircleDollarSign, title: "Seller tools and fee options", detail: "Seller benefits only after marketplace payments and fee rules are verified." },
  { icon: ShieldCheck, title: "Membership controls", detail: "Transparent membership status, renewal date, and billing history." },
];

export default async function ProPage() {
  const profile = await getSpiderProfile();
  const entitlement = await getSpiderProEntitlement(profile);
  const entitlementAvailable = !!profile && entitlement.status !== "unavailable";
  const checkoutConfigured = billingIsReady(getStripe()) && !!process.env.STRIPE_PRICE_PREMIUM_MONTHLY && !!process.env.STRIPE_PRICE_PREMIUM_YEARLY;
  const endDate = entitlement.renewalDate ? new Date(entitlement.renewalDate * 1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : null;

  return <main className="market-shell pro-page">
    <SpiderSidebar />
    <section className="market-content pro-content">
      <header className="pro-page-header">
        <div><span className="spider-eyebrow">SPIDER / CREATOR MEMBERSHIP</span><h1>Make your work <span>stand out.</span></h1><p>Spider Pro is being prepared for creators who want stronger discovery, useful insights, and a more complete portfolio workspace.</p></div>
        <div className={"pro-status-chip"+(entitlement.premium?" is-active":"")}>{entitlement.premium?<BadgeCheck size={15}/>:<Crown size={15}/>} {entitlement.premium?"PRO ACTIVE":"PRO PREVIEW"}</div>
      </header>
      {entitlement.premium ? <section className="pro-preview-banner"><div className="pro-preview-symbol"><BadgeCheck size={22}/></div><div><strong>Spider Pro membership is active</strong><p>Plan: {entitlement.planKey} · Status: {entitlement.status}{endDate?" · Current period ends "+endDate:""}{entitlement.cancelAtPeriodEnd?" · Cancellation scheduled":""}</p></div><Link className="pro-secondary-button" href="/dashboard/settings?tab=billing">Manage billing <ChevronRight size={15}/></Link></section> :
        <section className="pro-preview-banner"><div className="pro-preview-symbol"><Sparkles size={22}/></div><div><strong>Membership features preview</strong><p>Paid activation remains disabled until prices, checkout, the database connection, and verified Stripe webhooks are configured.</p></div><span className="pro-setup-state"><LockKeyhole size={14}/> Purchases disabled</span></section>}
      <div className="pro-plan-grid">
        <article className="pro-plan-card"><div className="pro-plan-heading"><span className="pro-plan-icon"><UsersRound size={20}/></span><span className="pro-plan-label">START HERE</span></div><h2>Free</h2><p className="pro-plan-intro">Build your portfolio and get discovered.</p><div className="pro-plan-price">$0 <small>forever</small></div><ul>{["Creator directory profile","Portfolio, game and social links","Browse developers, jobs and studios","Submit resources and listings","Core account and safety tools"].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul><Link href={profile?"/settings":"/api/auth/discord/login"} className="pro-secondary-button">{profile?"Manage your account":"Sign in with Discord"} <ChevronRight size={15}/></Link></article>
        <article className="pro-plan-card pro-premium-card"><div className="pro-plan-heading"><span className="pro-plan-icon"><Crown size={20}/></span><span className="pro-plan-label">FOR SERIOUS CREATORS</span><span className="pro-coming-chip">IN PREPARATION</span></div><h2>Spider Pro</h2><p className="pro-plan-intro">More ways to showcase your work and understand your audience.</p><div className="pro-plan-price pro-price-pending">Pricing to be confirmed <small>Monthly and annual options planned</small></div><ul>{["Featured placement options","Advanced profile and portfolio analytics","Expanded profile customization","Creator workflow and shortlist tools","Seller benefits after checkout is enabled"].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul><button className="pro-primary-button" disabled title={checkoutConfigured?"Checkout still needs explicit launch approval.":"Stripe prices and webhook configuration are not ready."}><LockKeyhole size={15}/> Purchases not enabled yet</button><p className="pro-button-note">No charge can be started from this preview. Pricing and benefits will be finalized before activation.</p></article>
      </div>
      <section className="pro-benefits-section"><span className="pro-eyebrow">MEMBERSHIP ROADMAP</span><h2>Useful features, not empty badges.</h2><p className="pro-section-description">Planned benefit areas. A feature will only be advertised as active once its underlying tracking and permissions work.</p><div className="pro-benefits-grid">{benefits.map(({icon:Icon,title,detail},i)=><article className="pro-benefit-card" key={title}><div className="pro-benefit-top"><span className="pro-benefit-icon"><Icon size={18}/></span><span className="pro-benefit-index">{String(i+1).padStart(2,"0")}</span></div><h3>{title}</h3><p>{detail}</p><span className="pro-benefit-state"><span/> Planned feature</span></article>)}</div></section>
      {!profile&&<div className="pro-signin-footnote">Sign in with Discord to check a linked membership. <Link href="/api/auth/discord/login">Sign in <ChevronRight size={13}/></Link></div>}
      {profile&&!entitlementAvailable&&<div className="pro-signin-footnote"><Activity size={15}/> Membership status could not be checked. No paid access is assumed; try again later.</div>}
      <section className="pro-faq-strip"><span className="pro-faq-icon"><MessageSquare size={18}/></span><div><strong>What happens to VIP?</strong><p>VIP remains separate and uses your Roblox game-pass verification. Spider Pro is a separate website membership.</p></div><Link href="/vip">View VIP access <ChevronRight size={14}/></Link></section>
    </section>
  </main>;
}
