import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, Check, Code2, Crown, Download, Gamepad2, LockKeyhole, MessageCircle, Shield, ShieldCheck, ShoppingBag, Users } from "lucide-react";

const features = [
  { icon: Boxes, title: "Resource vault", tag: "MEMBERS", text: "A structured library for approved scripts, models, tutorials, and creator drops." },
  { icon: Gamepad2, title: "Game showcase", tag: "COMMUNITY", text: "A home for your games, updates, trailers, and official Roblox links." },
  { icon: ShoppingBag, title: "Shop & marketplace", tag: "CREATORS", text: "Keep the creator marketplace as one destination inside the wider Spider platform." },
];

const tiers = [
  { name: "VIP", label: "COMMUNITY ACCESS", price: "Roblox pass", description: "Unlock the designated VIP section after ownership is verified.", items: ["VIP-only website area", "Eligible community resources", "Roblox game-pass verification"], action: "View Roblox VIP pass", href: "https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED" },
  { name: "Aero", label: "CREATOR MEMBERSHIP", price: "Coming soon", description: "A membership tier for exclusive creator resources and member perks.", items: ["Aero resource collection", "Member dashboard access", "New drops and release notes"], action: "Explore Aero", href: "#membership" },
];

export const metadata = {
  title: "Spider Uncopylocked — Build Beyond the Game",
  description: "The Spider Uncopylocked creator platform: community, free templates, files, and memberships.",
};

export default function HomePage() {
  return <main className="spx">
    <header className="spx-nav">
      <Link href="/" className="spx-brand"><span className="spx-logo spx-logo-text" aria-label="Spider Uncopylocked">SU</span><span>SPIDER <b>UNCOPYLOCKED</b><small>THE CREATOR PLATFORM</small></span></Link>
      <nav className="spx-nav-links"><a href="#platform">Platform</a><a href="#membership">Memberships</a><a href="#games">Games</a><Link href="/marketplace">Marketplace</Link><Link href="/resources">Free assets</Link></nav>
      <div className="spx-nav-actions"><Link href="/api/auth/discord/login" className="spx-login"><MessageCircle size={15}/> Sign in with Discord <ArrowUpRight size={14}/></Link></div>
    </header>

    <section className="spx-hero">
      <div className="spx-hero-grid" />
      <div className="spx-hero-copy">
        <div className="spx-eyebrow"><span className="spx-live" /> A COMMUNITY FOR ROBLOX CREATORS <span className="spx-eyebrow-line" /></div>
        <h1>Build beyond<br/>the <em>game.</em></h1>
        <p className="spx-hero-desc">Your home for Roblox development, free templates and files, creator memberships, and community resources. One community. More ways to create.</p>
        <div className="spx-hero-actions"><a className="spx-btn spx-btn-primary" href="#platform">Explore the platform <ArrowRight size={16}/></a><Link className="spx-btn spx-btn-ghost" href="/api/auth/discord/login"><MessageCircle size={16}/> Join with Discord</Link></div>
        <div className="spx-hero-meta"><span><ShieldCheck size={15}/> Member-gated resources</span><span><Download size={15}/> Creator downloads</span><span><Users size={15}/> Community-led</span></div>
      </div>
      <div className="spx-hero-visual">
        <div className="spx-orbit spx-orbit-a"/><div className="spx-orbit spx-orbit-b"/><div className="spx-orbit spx-orbit-c"/>
        <div className="spx-core"><div className="spx-core-glow"/><span className="spx-emblem-text">SU</span><span>CREATE WITHOUT LIMITS</span></div>
        <div className="spx-float spx-float-top"><span className="spx-float-icon"><Download size={17}/></span><span><b>Free resources</b><small>Templates & files</small></span><span className="spx-mini-pill">FREE</span></div>
        <div className="spx-float spx-float-bottom"><span className="spx-float-icon"><LockKeyhole size={17}/></span><span><b>Member vault</b><small>Access by entitlement</small></span><Shield size={15}/></div>
        <div className="spx-visual-caption">SPIDER PLATFORM / 001</div>
      </div>
      <a className="spx-scroll" href="#platform"><ArrowDownRight size={15}/> SCROLL TO EXPLORE</a>
    </section>

    <section className="spx-marquee" aria-label="Platform features"><div>ROBLOX DEVELOPMENT <i>✳</i> COMMUNITY <i>✳</i> FREE TEMPLATES <i>✳</i> CREATOR FILES <i>✳</i> ROBLOX DEVELOPMENT <i>✳</i> COMMUNITY <i>✳</i> FREE TEMPLATES <i>✳</i> CREATOR FILES <i>✳</i></div></section>

    <section className="spx-section spx-about" id="platform">
      <div className="spx-section-heading"><div><span className="spx-kicker">01 / THE PLATFORM</span><h2>Not just a marketplace.<br/><em>A creator ecosystem.</em></h2></div><p>Spider Uncopylocked brings your community, resources, memberships, and development tools together. The marketplace stays available—but it is one part of the bigger platform.</p></div>
      <div className="spx-feature-grid">{features.map((f, i) => <article className={"spx-feature spx-feature-"+i} key={f.title}><div className="spx-feature-top"><span className="spx-feature-icon"><f.icon size={21}/></span><span>{f.tag}</span></div><h3>{f.title}</h3><p>{f.text}</p><a href={f.title === "Game showcase" ? "#games" : f.title === "Resource vault" ? "#resources" : "/marketplace"}>{f.title === "Shop & marketplace" ? "Browse listings" : "Explore feature"} <ArrowUpRight size={14}/></a><div className="spx-feature-index">0{i + 1}</div></article>)}</div>
    </section>

    <section className="spx-section spx-membership" id="membership">
      <div className="spx-section-heading"><div><span className="spx-kicker">03 / ACCESS YOUR WAY</span><h2>Unlock your <em>next level.</em></h2></div><p>Membership tiers will unlock features from the server-side, so access is tied to verified entitlements—not just a hidden button.</p></div>
      <div className="spx-tier-grid">{tiers.map(t => <article className="spx-tier" key={t.name}><div className="spx-tier-top"><span>{t.label}</span></div><h3>{t.name}</h3><div className="spx-tier-price">{t.price}</div><p>{t.description}</p><ul>{t.items.map(x => <li key={x}><Check size={14}/>{x}</li>)}</ul><a className={"spx-btn spx-btn-ghost"} href={t.href}>{t.action} <ArrowRight size={15}/></a></article>)}</div>
      <p className="spx-small-note"><LockKeyhole size={13}/> Aero checkout and entitlement verification are not live yet in this test design.</p>
    </section>

    <section className="spx-section spx-resources" id="resources">
      <div className="spx-section-heading"><div><span className="spx-kicker">04 / THE RESOURCE VAULT</span><h2>Made by creators.<br/><em>Ready to build with.</em></h2></div><p>Leakers and approved contributors will be able to publish properly formatted resources, with access controlled by role and membership.</p></div>
      <div className="spx-resource-layout"><div className="spx-resource-main"><div className="spx-resource-icon"><Download size={23}/></div><span className="spx-resource-tag">PLANNED RESOURCE LIBRARY</span><h3>One organized home for your files.</h3><p>Scripts, models, tutorials, and other authorized development resources—each with a description, version, category, and access level.</p><div className="spx-resource-chips"><span>PUBLIC</span><span>VIP</span><span>AERO</span><span>AERO+</span></div></div><div className="spx-resource-side"><article><span><Code2 size={18}/></span><div><b>Luau scripts</b><small>Code, modules, and systems</small></div><span className="spx-lock-tag">ACCESS CONTROL</span></article><article><span><Boxes size={18}/></span><div><b>Models & assets</b><small>Approved project resources</small></div><span className="spx-lock-tag">ACCESS CONTROL</span></article><article><span><ShieldCheck size={18}/></span><div><b>Verified uploads</b><small>Moderation and version history</small></div><span className="spx-lock-tag">PLANNED</span></article></div></div>
    </section>

    <section className="spx-section spx-games" id="games">
      <div className="spx-section-heading"><div><span className="spx-kicker">05 / BUILT IN THE COMMUNITY</span><h2>Games worth <em>showing off.</em></h2></div><p>A dedicated space for your games and community projects. Real projects only—no invented player counts or fake activity.</p></div>
      <div className="spx-games-empty"><div className="spx-game-symbol"><Gamepad2 size={25}/></div><div><span className="spx-kicker">YOUR GAME SHOWCASE</span><h3>Your featured games go here.</h3><p>Add each game's name, thumbnail, description, Roblox link, and updates when you're ready.</p></div><Link className="spx-btn spx-btn-ghost" href="/marketplace">Visit marketplace <ArrowUpRight size={15}/></Link></div>
    </section>

    <section className="spx-community">
      <div className="spx-community-copy"><span className="spx-kicker">06 / THE PEOPLE BEHIND SPIDER</span><h2>Built around the <em>community.</em></h2><p>Introduce yourself, share the story behind Spider Uncopylocked, and feature the real staff members who help run the server.</p><div className="spx-staff-grid"><article><span><Crown size={17}/></span><b>Owner</b><small>Platform owner</small></article><article><span><Shield size={17}/></span><b>Co-Owner</b><small>Community leadership</small></article><article><span><Users size={17}/></span><b>Management</b><small>Operations & team</small></article><article><span><ShieldCheck size={17}/></span><b>Staff team</b><small>Admins & contributors</small></article></div><p className="spx-small-note">Role cards are placeholders for your actual Discord-linked staff—no staff identities are invented.</p></div>
      <div className="spx-community-card"><div className="spx-community-emblem"><span className="spx-emblem-text">SU</span></div><span className="spx-kicker">SPIDER UNCOPYLOCKED</span><h3>One hub. Every part of the creator journey.</h3><p>Community, resources, tools, and a place to share what you're building.</p><a href="#platform">Explore the platform <ArrowRight size={15}/></a></div>
    </section>

    <section className="spx-shop-cta"><div className="spx-shop-icon"><ShoppingBag size={22}/></div><div><span className="spx-kicker">07 / SHOP & MARKETPLACE</span><h2>Find resources. Sell your creations.</h2><p>The marketplace remains a section of Spider Uncopylocked—not the whole website.</p></div><div className="spx-shop-actions"><Link className="spx-btn spx-btn-primary" href="/marketplace">Browse marketplace <ArrowRight size={15}/></Link><Link className="spx-btn spx-btn-ghost" href="/resources/upload">Upload free asset <ArrowUpRight size={15}/></Link></div></section>

    <footer className="spx-footer"><Link href="/" className="spx-brand"><span className="spx-logo spx-logo-text">SU</span><span>SPIDER <b>UNCOPYLOCKED</b><small>THE CREATOR PLATFORM</small></span></Link><span>BUILD BEYOND THE GAME.</span><div><Link href="/marketplace">Marketplace</Link><Link href="/resources/upload">Upload free asset</Link><Link href="/api/auth/discord/login">Discord login</Link></div><small>© 2026 Spider Uncopylocked · Test redesign</small></footer>
  </main>;
}
