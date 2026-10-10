import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Github, Users } from "lucide-react";
import MarketplaceBrowser from "./marketplace-browser";

export const metadata = {
  title: "Marketplace | Spider Uncopylocked",
  description: "Discover Roblox games, templates, UI kits, and development resources on Spider Uncopylocked.",
};

export default function MarketplacePage() {
  return <main className="marketplace-page">
    <header className="market-nav shell">
      <Link href="/marketplace" className="market-brand"><span className="market-brand-mark">S</span><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link>
      <nav><Link href="/marketplace">Marketplace</Link><Link href="#browse">Explore</Link><Link href="#sell">Sell on Spider</Link></nav>
      <div className="market-nav-actions"><Link href="https://github.com/kambreyacc-sketch/Spider-Uncopylocked-Website" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></Link><Link className="market-nav-community" href="https://discord.com/" target="_blank" rel="noreferrer"><Users size={15} /> Community <ArrowUpRight size={13} /></Link></div>
    </header>
    <MarketplaceBrowser />
    <footer className="market-footer shell"><Link href="/" className="market-footer-home"><ArrowLeft size={14} /> Spider Uncopylocked marketplace</Link><span>© 2026 SPIDER UNCOPYLOCKED · INDEPENDENT CREATOR PLATFORM</span></footer>
  </main>;
}
