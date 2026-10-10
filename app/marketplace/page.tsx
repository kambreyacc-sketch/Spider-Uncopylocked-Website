import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import MarketplaceBrowser from "./marketplace-browser";

export const metadata = {
  title: "Spider Uncopylocked — Roblox Marketplace",
  description: "Browse Roblox game listings and creator resources on Spider Uncopylocked.",
};

export default function MarketplacePage() {
  return <main className="marketplace-page">
    <header className="market-nav shell">
      <Link href="/marketplace" className="market-brand"><span className="market-brand-mark">S</span><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link>
      <nav><Link href="/marketplace">Marketplace</Link><Link href="/marketplace#browse">Browse Listings</Link><Link href="/sell">Sell on Spider</Link></nav>
      <div className="market-nav-actions"><Link className="market-nav-community" href="https://discord.com/" target="_blank" rel="noreferrer"><Users size={15} /> Community <ArrowUpRight size={13} /></Link><Link className="market-nav-login" href="/api/auth/roblox/login">Sign in with Roblox <ArrowUpRight size={13} /></Link></div>
    </header>
    <MarketplaceBrowser />
    <footer className="market-footer shell"><span>© 2026 SPIDER UNCOPYLOCKED</span><span><Link href="/marketplace">Marketplace</Link> · <Link href="/sell">Sell on Spider</Link></span></footer>
  </main>;
}
