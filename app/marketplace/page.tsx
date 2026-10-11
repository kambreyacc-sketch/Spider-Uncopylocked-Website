import Link from "next/link";
import MarketplaceBrowser from "./marketplace-browser";
import { ArrowUpRight, UploadCloud } from "lucide-react";

export const metadata = {
  title: "Spider Uncopylocked — Game Marketplace",
  description: "Browse Roblox experiences and creator listings on Spider Uncopylocked.",
};

export default function MarketplacePage() {
  return <main className="spider-home marketplace-home">
    <header className="spider-nav">
      <Link href="/" className="spider-wordmark"><img className="spider-logo" src="https://media.discordapp.net/attachments/1515309294332149770/1558762264838799420/image_1.webp?ex=6acc9dfc&is=6acb4c7c&hm=9ec0868ab9a9ce2893e6e8d10b29a0851329696c435496ec6036f852c3d3a4e6&=&format=webp" alt="Spider Uncopylocked" /><span>SPIDER <b>UNCOPYLOCKED</b><small>FREE CREATOR RESOURCES</small></span></Link>
      <nav><Link href="/#assets">Assets & Templates</Link><Link className="spider-current-nav" href="/marketplace">Game Marketplace</Link><Link href="/settings">Settings</Link></nav>
      <div className="spider-nav-actions"><Link href="/resources/upload" className="spider-upload-nav"><UploadCloud size={16}/> Upload asset</Link><Link href="/api/auth/discord/login" className="spider-signin">Sign in with Discord <ArrowUpRight size={14}/></Link></div>
    </header>
    <section className="marketplace-intro"><span className="spider-eyebrow">SPIDER / GAME MARKETPLACE</span><h1>Games and creator listings.</h1><p>Browse Roblox experiences, discover creators, and explore listings — all in the same Spider workspace.</p></section>
    <MarketplaceBrowser />
    <footer className="spider-footer"><span>© 2026 SPIDER UNCOPYLOCKED</span><span>One home for creator resources and game listings</span><span><Link href="/">Resources</Link><Link href="/guidelines">Guidelines</Link><Link href="/contact">Support</Link></span></footer>
  </main>;
}
