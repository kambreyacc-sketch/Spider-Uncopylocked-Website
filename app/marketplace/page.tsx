import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

function DiscordMark() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M19.7 5.3A18.8 18.8 0 0 0 15.1 3.9l-.6 1.2a17.2 17.2 0 0 0-5 0l-.6-1.2a18.8 18.8 0 0 0-4.6 1.4C1.4 9.6.6 13.8 1 18a18.8 18.8 0 0 0 5.7 2.9l1.2-1.9-1.9-.9.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4-1.9.9 1.2 1.9a18.8 18.8 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.7-12.7ZM8.8 15.4c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.4 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"/></svg>; }
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
      <div className="market-nav-actions"><Link className="market-nav-community" href="https://discord.com/" target="_blank" rel="noreferrer"><Users size={15} /> Community <ArrowUpRight size={13} /></Link><Link className="market-nav-login" href="/api/auth/discord/login"><DiscordMark /> <span>Continue with Discord</span></Link></div>
    </header>
    <MarketplaceBrowser />
    <footer className="market-footer shell"><span>© 2026 SPIDER UNCOPYLOCKED</span><span className="market-footer-links"><Link href="/marketplace">Marketplace</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/guidelines">Guidelines</Link><Link href="/fees">Fees</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><a href="mailto:spiderstudios137483@gmail.com">Support</a></span></footer>
  </main>;
}
