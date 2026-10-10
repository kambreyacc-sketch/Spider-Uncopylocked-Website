import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Blocks, Bot, Braces, Check,
  ChevronRight, CircleDot, Code2, Crown, Download, Gamepad2, Github,
  Globe2, Menu, ShieldCheck, Sparkles, Users, Zap
} from "lucide-react";

const features = [
  { icon: Blocks, tag: "RESOURCE LIBRARY", title: "Build faster. Ship smarter.", text: "A curated home for creator tools, scripts, systems, and development resources.", tone: "violet" },
  { icon: ShieldCheck, tag: "REVIEWED SUBMISSIONS", title: "Quality over clutter.", text: "Community submissions enter a review queue before anything becomes public.", tone: "blue" },
  { icon: Bot, tag: "AI WORKSPACE", title: "Your next idea starts here.", text: "A future-ready home for scripting help, debugging workflows, and creator tools.", tone: "pink" },
];
const resources = [
  { type: "SYSTEM", name: "Round & Match Framework", desc: "A modular starting point for round-based experiences.", tag: "COMING SOON", color: "purple", icon: Braces },
  { type: "TOOLKIT", name: "Creator Utility Pack", desc: "Small workflow helpers built to keep projects moving.", tag: "IN DEVELOPMENT", color: "blue", icon: Code2 },
  { type: "GUIDE", name: "Release Checklist", desc: "A practical pass through testing, polish, and launch readiness.", tag: "RESOURCE", color: "orange", icon: Check },
];
const stats = [{label:"BUILT FOR CREATORS",value:"01"},{label:"COMMUNITY FIRST",value:"24/7"},{label:"NEW TOOLS",value:"IN PROGRESS"}];

function Wordmark() {
  return <Link href="/" className="wordmark" aria-label="Spider Uncopylocked home"><span className="brand-mark"><span /></span><span>SPIDER<span className="wordmark-light"> UNCOPYLOCKED</span><small>CREATOR NETWORK</small></span></Link>;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label"><span />{children}</div>;
}

export default function Home() {
  return (
    <main>
      <div className="topline"><span><Sparkles size={13}/> THE NEXT CHAPTER OF SPIDER STUDIOS</span><span className="topline-right">CREATED FOR THE COMMUNITY <ArrowUpRight size={13}/></span></div>
      <header className="navbar shell">
        <Wordmark />
        <nav className="navlinks"><Link href="#resources">Resources</Link><Link href="#features">Explore</Link><Link href="#membership">Membership</Link><Link href="#community">Community</Link></nav>
        <div className="nav-actions"><Link className="nav-login" href="#dashboard">Sign in <ArrowUpRight size={14}/></Link><Link className="button button-small" href="#community">Join the network <ArrowRight size={15}/></Link></div>
        <button className="mobile-menu" aria-label="Open menu"><Menu size={23}/></button>
      </header>

      <section className="hero shell">
        <div className="hero-grid" aria-hidden="true"><div/><div/><div/><div/><div/><div/><div/><div/><div/><div/><div/><div/></div>
        <div className="hero-copy">
          <div className="live-pill"><span className="live-dot"/> A NEW SPACE FOR CREATORS <span className="pill-version">V.01</span></div>
          <h1>MAKE SOMETHING<br/><span>UNFORGETTABLE.</span></h1>
          <p className="hero-sub">Your next idea deserves more than a blank page. Discover resources, connect with builders, and bring your Roblox experiences to life.</p>
          <div className="hero-actions"><Link href="#resources" className="button">Explore resources <ArrowRight size={16}/></Link><Link href="#about" className="button button-ghost">Get to know us <ArrowUpRight size={16}/></Link></div>
          <div className="hero-note"><div className="avatar-stack"><span>S</span><span>U</span><span>+</span></div><p><strong>A community in the making</strong><br/>Built around the people who build.</p></div>
        </div>
        <div className="hero-art">
          <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-orbit orbit-three"/>
          <div className="art-core"><div className="core-glow"/><div className="spider-emblem"><span/><i/><b/></div><div className="core-caption">SPIDER / CREATOR NETWORK</div></div>
          <div className="float-card card-top"><span className="mini-icon violet"><Blocks size={15}/></span><div><b>RESOURCE HUB</b><small>Everything in one place</small></div><ArrowUpRight size={15}/></div>
          <div className="float-card card-bottom"><span className="mini-icon green"><CircleDot size={15}/></span><div><b>COMMUNITY-POWERED</b><small>Built with creators, for creators</small></div><span className="tiny-status"/></div>
          <div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div><div className="art-index">FIG. 001 / SPIDER SYSTEMS</div>
        </div>
        <div className="hero-rail"><span>01 — DISCOVER</span><span>02 — CREATE</span><span>03 — CONNECT</span></div>
      </section>

      <div className="ticker" aria-label="Spider creator network values"><div className="ticker-track">{Array.from({length:2}).map((_,i)=><span key={i}>MAKE IT REAL <i>✳</i> BUILD WITH PURPOSE <i>✳</i> SHARE WHAT YOU KNOW <i>✳</i> CREATE WITHOUT LIMITS <i>✳</i></span>)}</div></div>

      <section className="intro section shell" id="about">
        <div className="intro-heading"><SectionLabel>01 / THE VISION</SectionLabel><h2>A home base for<br/><em>what comes next.</em></h2></div>
        <div className="intro-copy"><p>Spider Uncopylocked is being built as a central hub for Roblox creators: a place to discover useful resources, learn from other builders, and find the tools that help turn ideas into experiences.</p><p>We’re starting with a strong foundation—then growing into a connected platform for creators, developers, and the wider Spider community.</p><Link href="#features" className="text-link">Explore the platform <ArrowDownRight size={16}/></Link></div>
      </section>

      <section className="feature-section section" id="features"><div className="shell">
        <div className="section-head"><div><SectionLabel>02 / WHAT WE’RE BUILDING</SectionLabel><h2>More than a <em>resource page.</em></h2></div><p>One evolving platform. Practical tools. A community that keeps moving.</p></div>
        <div className="feature-grid">{features.map((f,i)=><article key={f.title} className="feature-card"><div className="feature-top"><span className={"feature-icon "+f.tone}><f.icon size={20}/></span><span className="feature-num">0{i+1}</span></div><span className="eyebrow">{f.tag}</span><h3>{f.title}</h3><p>{f.text}</p><Link href="#community" className="round-arrow" aria-label={"Learn about "+f.title}><ArrowUpRight size={18}/></Link><div className="card-line"/></article>)}</div>
      </div></section>

      <section className="resource-section section shell" id="resources"><div className="section-head"><div><SectionLabel>03 / THE RESOURCE DESK</SectionLabel><h2>Tools for your <em>toolbox.</em></h2></div><span className="availability"><span className="live-dot"/> LIBRARY IN DEVELOPMENT</span></div>
        <div className="resource-layout"><div className="resource-feature"><div className="resource-visual"><div className="visual-grid"/><div className="code-window"><div className="window-top"><span/><span/><span/><small>spider / workspace</small></div><div className="code-lines"><i>01</i><span className="syntax-purple">local</span> <b>SpiderCore</b> = {}<i>02</i><span className="syntax-blue">function</span> SpiderCore.<b>Initialize</b>()<i>03</i> &nbsp;&nbsp;<span className="syntax-green">-- your next idea starts here</span><i>04</i> &nbsp;&nbsp;print(<span className="syntax-orange">"Let's build."</span>)<i>05</i><span className="syntax-blue">end</span><i>06</i><br/><i>07</i><span className="cursor-block"/></div></div><div className="visual-stamp"><Braces size={25}/><span>BUILT FOR<br/>THE BUILDERS</span></div></div><div className="resource-feature-copy"><span className="eyebrow">THE LIBRARY / 001</span><h3>A better starting point.</h3><p>Find organized resources and practical starting points for your next project, without hunting across a dozen different places.</p><Link href="#community" className="button button-dark">Stay in the loop <ArrowRight size={15}/></Link></div></div>
        <div className="resource-list">{resources.map((r,i)=><article className="resource-row" key={r.name}><div className={"resource-row-icon "+r.color}><r.icon size={19}/></div><div className="resource-info"><span>{r.type} <i> / </i> 0{i+1}</span><h3>{r.name}</h3><p>{r.desc}</p></div><span className="resource-tag">{r.tag}</span><ChevronRight size={18} className="resource-chevron"/></article>)}</div></div>
      </section>

      <section className="membership-section section" id="membership"><div className="shell membership-inner"><div className="membership-copy"><SectionLabel>04 / LEVEL UP</SectionLabel><h2>Your workflow.<br/><em>Your next level.</em></h2><p>The platform roadmap includes member features, exclusive resources, and Aero membership options. We’re building access and billing carefully so website benefits and Discord roles stay in sync.</p><div className="membership-checks"><span><Check size={15}/> Member dashboard</span><span><Check size={15}/> Exclusive resource access</span><span><Check size={15}/> Connected Discord roles</span></div><Link href="#community" className="button">Follow the rollout <ArrowRight size={15}/></Link></div><div className="membership-visual"><div className="member-orb"><div className="orb-ring ring-a"/><div className="orb-ring ring-b"/><Crown size={43}/><span>ACCESS / FUTURE</span></div><div className="member-chip chip-a"><Zap size={14}/> AERO+</div><div className="member-chip chip-b"><ShieldCheck size={14}/> VERIFIED ACCESS</div><div className="member-chip chip-c"><Download size={14}/> PRIVATE RESOURCES</div></div></div></section>

      <section className="community-section section shell" id="community"><div className="community-panel"><div className="community-background"><span/><span/><span/></div><div className="community-content"><SectionLabel>05 / FIND YOUR PEOPLE</SectionLabel><h2>The next great build<br/>starts <em>together.</em></h2><p>Meet the community, share your progress, and help shape what Spider Uncopylocked becomes.</p><div className="community-actions"><Link href="https://discord.com/" target="_blank" rel="noreferrer" className="button button-white">Find our Discord <ArrowUpRight size={15}/></Link><Link href="https://github.com/kambreyacc-sketch/Spider-Uncopylocked-Website" target="_blank" rel="noreferrer" className="button button-glass"><Github size={15}/> Follow development</Link></div></div><div className="community-symbol"><div className="community-hex"><Globe2 size={62}/></div><span>OPEN POSSIBILITIES<br/>ONE COMMUNITY</span></div></div></section>

      <footer className="footer shell"><div className="footer-main"><Wordmark/><p>Tools, resources, and community<br/>for the next generation of creators.</p><div className="footer-social"><Link href="https://github.com/kambreyacc-sketch/Spider-Uncopylocked-Website" aria-label="GitHub"><Github size={17}/></Link><Link href="https://discord.com/" aria-label="Discord"><Users size={17}/></Link></div></div><div className="footer-links"><div><span>EXPLORE</span><Link href="#resources">Resources</Link><Link href="#features">Platform</Link><Link href="#membership">Membership</Link></div><div><span>SPIDER</span><Link href="#about">Our vision</Link><Link href="#community">Community</Link><Link href="https://github.com/kambreyacc-sketch/Spider-Uncopylocked-Website">GitHub repo</Link></div><div><span>STATUS</span><p><span className="status-dot"/> Platform foundation</p><p>New platform / 2026</p><p>More features in development</p></div></div><div className="footer-bottom"><span>© 2026 SPIDER UNCOPYLOCKED. BUILT FOR CREATORS.</span><span>DESIGNED TO KEEP BUILDING <ArrowUpRight size={12}/></span></div></footer>
    </main>
  );
}
