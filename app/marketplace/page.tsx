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
      <Link href="/marketplace" className="market-brand"><img className="market-brand-image" src="https://cdn.discordapp.com/icons/1411733652257374242/deec7fa3d9dc59fb5fa76a21fec3c6fb.webp?size=256" alt="" /><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link>
      <nav><Link href="/marketplace">Marketplace</Link><Link href="/marketplace#browse">Browse Listings</Link><Link href="/sell">Sell on Spider</Link></nav>
      <div className="market-nav-actions"><Link className="market-nav-community" href="https://discord.com/" target="_blank" rel="noreferrer"><Users size={15} /> Community <ArrowUpRight size={13} /></Link><Link className="market-nav-login" href="/api/auth/roblox/login">Sign in with Roblox <ArrowUpRight size={13} /></Link></div>
    </header>
    <MarketplaceBrowser />
    <footer className="market-footer shell"><span>© 2026 SPIDER UNCOPYLOCKED</span><span className="market-footer-links"><Link href="/marketplace">Marketplace</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/guidelines">Guidelines</Link><Link href="/fees">Fees</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><a href="mailto:spiderstudios137483@gmail.com">Support</a></span></footer>
  </main>;
}
