import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ChevronRight, ImagePlus, ShieldCheck } from "lucide-react";
import SellerForm from "./seller-form";

export const metadata = {
  title: "Create listing | Spider Uncopylocked",
  description: "Prepare a Roblox game or UGC group listing on Spider Uncopylocked.",
};



export default function SellPage() {
  return <main className="sell-page">
    <header className="sell-topbar">
      <Link href="/marketplace" className="sell-brand"><img className="market-brand-mark" src="https://media.discordapp.net/attachments/1515309294332149770/1558762264838799420/image_1.webp?ex=6acc9dfc&is=6acb4c7c&hm=9ec0868ab9a9ce2893e6e8d10b29a0851329696c435496ec6036f852c3d3a4e6&=&format=webp" alt="" /><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link>
      <div className="sell-top-links"><Link href="/marketplace">Marketplace</Link><Link href="/marketplace#browse">Browse listings</Link><Link href="/api/auth/discord/login" className="sell-connect">Sign in with Discord <ArrowUpRight size={14}/></Link></div>
    </header>
    <div className="sell-shell">
      <Link href="/marketplace" className="sell-back"><ArrowLeft size={15}/> Back to marketplace</Link>
      <section className="sell-heading"><div><span className="sell-eyebrow">SELLER DASHBOARD / NEW LISTING</span><h1>Create a listing</h1><p>Add the details buyers need to evaluate your Roblox experience or UGC group.</p></div><div className="sell-step-count">NEW LISTING <b>·</b> DRAFT</div></section>
      <div className="sell-progress"><span /></div>
      <div className="sell-layout">
        <SellerForm />
        <aside className="sell-side">
          <div className="sell-side-card"><div className="sell-side-icon"><ShieldCheck size={19}/></div><h3>Before you publish</h3><ul><li><CheckCircle2 size={15}/> You must own or be authorized to sell the experience</li><li><CheckCircle2 size={15}/> Use an image you have permission to upload</li><li><CheckCircle2 size={15}/> Listing details and price should be accurate</li></ul></div>
          <div className="sell-side-card sell-side-muted"><h3>Listing preview</h3><p>Your thumbnail and details will appear here as you fill out the form.</p><div className="sell-preview-sample"><ImagePlus size={21}/><span>Thumbnail preview</span></div></div>
        </aside>
      </div>
    </div>
  </main>;
}
