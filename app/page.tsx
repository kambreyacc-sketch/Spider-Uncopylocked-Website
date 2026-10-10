import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Boxes, Check, Code2, Crown, Download, Gamepad2, Gem, Github, LockKeyhole, MessageCircle, Shield, ShieldCheck, ShoppingBag, Sparkles, Users, Zap } from "lucide-react";

const iconUrl = "data:image/webp;base64,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";

const features = [
  { icon: Bot, title: "Spider AI", tag: "AERO+", text: "Plan, generate, and debug Roblox Luau scripts—with a path toward a connected Studio plugin." },
  { icon: Boxes, title: "Resource vault", tag: "MEMBERS", text: "A structured library for approved scripts, models, tutorials, and creator drops." },
  { icon: Gamepad2, title: "Game showcase", tag: "COMMUNITY", text: "A home for your games, updates, trailers, and official Roblox links." },
  { icon: ShoppingBag, title: "Shop & marketplace", tag: "CREATORS", text: "Keep the creator marketplace as one destination inside the wider Spider platform." },
];

const tiers = [
  { name: "VIP", label: "COMMUNITY ACCESS", price: "Roblox pass", description: "Unlock the designated VIP section after ownership is verified.", items: ["VIP-only website area", "Eligible community resources", "Roblox game-pass verification"], action: "View Roblox VIP pass", href: "https://www.roblox.com/game-pass/1759776349/VIP-SPIDER-UNCOPYLOCKED", featured: false },
  { name: "Aero", label: "CREATOR MEMBERSHIP", price: "Coming soon", description: "A membership tier for exclusive creator resources and member perks.", items: ["Aero resource collection", "Member dashboard access", "New drops and release notes"], action: "Explore Aero", href: "#membership", featured: false },
  { name: "Aero+", label: "ADVANCED TOOLKIT", price: "Coming soon", description: "The top tier planned for Spider AI and advanced creator tools.", items: ["Aero benefits", "AI scripting assistant", "Future Studio plugin access"], action: "Explore Aero+", href: "#spider-ai", featured: true },
];

export const metadata = {
  title: "Spider Uncopylocked — Build Beyond the Game",
  description: "The Spider Uncopylocked creator platform: community, resources, memberships, and AI scripting tools.",
};

export default function HomePage() {
  return <main className="spx">
    <header className="spx-nav">
      <Link href="/" className="spx-brand"><span className="spx-logo"><img src={iconUrl} alt="" /></span><span>SPIDER <b>UNCOPYLOCKED</b><small>THE CREATOR PLATFORM</small></span></Link>
      <nav className="spx-nav-links"><a href="#platform">Platform</a><a href="#membership">Memberships</a><a href="#games">Games</a><Link href="/marketplace">Marketplace</Link></nav>
      <div className="spx-nav-actions"><Link href="/api/auth/discord/login" className="spx-login"><MessageCircle size={15}/> Sign in with Discord <ArrowUpRight size={14}/></Link></div>
    </header>

    <section className="spx-hero">
      <div className="spx-hero-grid" />
      <div className="spx-hero-copy">
        <div className="spx-eyebrow"><span className="spx-live" /> A COMMUNITY FOR ROBLOX CREATORS <span className="spx-eyebrow-line" /></div>
        <h1>Build beyond<br/>the <em>game.</em></h1>
        <p className="spx-hero-desc">Your home for Roblox development, exclusive resources, creator memberships, and AI-powered scripting. One community. More ways to create.</p>
        <div className="spx-hero-actions"><a className="spx-btn spx-btn-primary" href="#platform">Explore the platform <ArrowRight size={16}/></a><Link className="spx-btn spx-btn-ghost" href="/api/auth/discord/login"><MessageCircle size={16}/> Join with Discord</Link></div>
        <div className="spx-hero-meta"><span><ShieldCheck size={15}/> Member-gated resources</span><span><Code2 size={15}/> Roblox-first tools</span><span><Users size={15}/> Community-led</span></div>
      </div>
      <div className="spx-hero-visual">
        <div className="spx-orbit spx-orbit-a"/><div className="spx-orbit spx-orbit-b"/><div className="spx-orbit spx-orbit-c"/>
        <div className="spx-core"><div className="spx-core-glow"/><img src={iconUrl} alt="Spider Uncopylocked logo"/><span>CREATE WITHOUT LIMITS</span></div>
        <div className="spx-float spx-float-top"><span className="spx-float-icon"><Sparkles size={17}/></span><span><b>Spider AI</b><small>Script smarter</small></span><span className="spx-mini-pill">AERO+</span></div>
        <div className="spx-float spx-float-bottom"><span className="spx-float-icon"><LockKeyhole size={17}/></span><span><b>Member vault</b><small>Access by entitlement</small></span><Shield size={15}/></div>
        <div className="spx-visual-caption">SPIDER PLATFORM / 001</div>
      </div>
      <a className="spx-scroll" href="#platform"><ArrowDownRight size={15}/> SCROLL TO EXPLORE</a>
    </section>

    <section className="spx-marquee" aria-label="Platform features"><div>ROBLOX DEVELOPMENT <i>✳</i> COMMUNITY <i>✳</i> CREATOR RESOURCES <i>✳</i> AI SCRIPTING <i>✳</i> ROBLOX DEVELOPMENT <i>✳</i> COMMUNITY <i>✳</i> CREATOR RESOURCES <i>✳</i> AI SCRIPTING <i>✳</i></div></section>

    <section className="spx-section spx-about" id="platform">
      <div className="spx-section-heading"><div><span className="spx-kicker">01 / THE PLATFORM</span><h2>Not just a marketplace.<br/><em>A creator ecosystem.</em></h2></div><p>Spider Uncopylocked brings your community, resources, memberships, and development tools together. The marketplace stays available—but it is one part of the bigger platform.</p></div>
      <div className="spx-feature-grid">{features.map((f, i) => <article className={"spx-feature spx-feature-"+i} key={f.title}><div className="spx-feature-top"><span className="spx-feature-icon"><f.icon size={21}/></span><span>{f.tag}</span></div><h3>{f.title}</h3><p>{f.text}</p><a href={f.title === "Spider AI" ? "#spider-ai" : f.title === "Game showcase" ? "#games" : f.title === "Resource vault" ? "#resources" : "/marketplace"}>{f.title === "Shop & marketplace" ? "Browse listings" : "Explore feature"} <ArrowUpRight size={14}/></a><div className="spx-feature-index">0{i + 1}</div></article>)}</div>
    </section>

    <section className="spx-ai-section" id="spider-ai">
      <div className="spx-ai-copy"><span className="spx-kicker">02 / YOUR DEVELOPMENT COPILOT</span><h2>Meet <em>Spider AI.</em></h2><p>Describe the system you want in plain English. The planned assistant will help draft Luau, explain scripts, and troubleshoot errors—then connect that workflow to Roblox Studio through a plugin.</p><div className="spx-ai-points"><span><Check size={15}/> Luau code generation and explanations</span><span><Check size={15}/> Debugging and iterative improvements</span><span><Check size={15}/> Studio plugin connection planned</span></div><a className="spx-btn spx-btn-primary" href="#membership">Included with Aero+ <ArrowRight size={16}/></a></div>
      <div className="spx-editor"><div className="spx-editor-top"><div className="spx-window-dots"><i/><i/><i/></div><span>SpiderAI / SprintController.luau</span><span className="spx-editor-state">CONCEPT PREVIEW</span></div><div className="spx-editor-body"><div className="spx-editor-line"><span>01</span><code><i>-- Spider AI script preview</i></code></div><div className="spx-editor-line"><span>02</span><code><b>local</b> Players = game:GetService(<em>"Players"</em>)</code></div><div className="spx-editor-line"><span>03</span><code><b>local</b> sprintEnabled = <strong>false</strong></code></div><div className="spx-editor-line"><span>04</span><code><i>-- Your prompt becomes a reviewed draft</i></code></div><div className="spx-editor-line"><span>05</span><code><b>local function</b> setSprinting(enabled)</code></div><div className="spx-editor-line"><span>06</span><code>&nbsp;&nbsp;sprintEnabled = enabled</code></div><div className="spx-editor-line"><span>07</span><code><b>end</b></code></div><div className="spx-prompt"><Sparkles size={15}/><span>Make a sprint system with stamina…</span><span className="spx-prompt-send"><ArrowUpRight size={15}/></span></div></div><div className="spx-editor-footer"><span><span className="spx-editor-dot"/> Example UI only</span><span>Luau / Roblox Studio</span></div></div>
    </section>

    <section className="spx-section spx-membership" id="membership">
      <div className="spx-section-heading"><div><span className="spx-kicker">03 / ACCESS YOUR WAY</span><h2>Unlock your <em>next level.</em></h2></div><p>Membership tiers will unlock features from the server-side, so access is tied to verified entitlements—not just a hidden button.</p></div>
      <div className="spx-tier-grid">{tiers.map(t => <article className={"spx-tier "+(t.featured ? "spx-tier-featured" : "")} key={t.name}><div className="spx-tier-top"><span>{t.label}</span>{t.featured ? <span className="spx-tier-featured-label"><Sparkles size={12}/> MOST ADVANCED</span> : null}</div><h3>{t.name}</h3><div className="spx-tier-price">{t.price}</div><p>{t.description}</p><ul>{t.items.map(x => <li key={x}><Check size={14}/>{x}</li>)}</ul><a className={t.featured ? "spx-btn spx-btn-primary" : "spx-btn spx-btn-ghost"} href={t.href}>{t.action} <ArrowRight size={15}/></a></article>)}</div>
      <p className="spx-small-note"><LockKeyhole size={13}/> Aero and Aero+ checkout and entitlement verification are not live yet in this test design.</p>
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
      <div className="spx-community-card"><div className="spx-community-emblem"><img src={iconUrl} alt="Spider Uncopylocked"/></div><span className="spx-kicker">SPIDER UNCOPYLOCKED</span><h3>One hub. Every part of the creator journey.</h3><p>Community, resources, tools, and a place to share what you're building.</p><a href="#platform">Explore the platform <ArrowRight size={15}/></a></div>
    </section>

    <section className="spx-shop-cta"><div className="spx-shop-icon"><ShoppingBag size={22}/></div><div><span className="spx-kicker">07 / SHOP & MARKETPLACE</span><h2>Find resources. Sell your creations.</h2><p>The marketplace remains a section of Spider Uncopylocked—not the whole website.</p></div><div className="spx-shop-actions"><Link className="spx-btn spx-btn-primary" href="/marketplace">Browse marketplace <ArrowRight size={15}/></Link><Link className="spx-btn spx-btn-ghost" href="/sell">Creator tools <ArrowUpRight size={15}/></Link></div></section>

    <footer className="spx-footer"><Link href="/" className="spx-brand"><span className="spx-logo"><img src={iconUrl} alt=""/></span><span>SPIDER <b>UNCOPYLOCKED</b><small>THE CREATOR PLATFORM</small></span></Link><span>BUILD BEYOND THE GAME.</span><div><Link href="/marketplace">Marketplace</Link><Link href="/sell">Creator tools</Link><Link href="/api/auth/discord/login">Discord login</Link></div><small>© 2026 Spider Uncopylocked · Test redesign</small></footer>
  </main>;
}
