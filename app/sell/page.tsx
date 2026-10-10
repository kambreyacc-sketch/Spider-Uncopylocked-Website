import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ChevronRight, ImagePlus, ShieldCheck } from "lucide-react";
import SellerForm from "./seller-form";

export const metadata = {
  title: "Create listing | Spider Uncopylocked",
  description: "Prepare a Roblox game or UGC group listing on Spider Uncopylocked.",
};

const serverIcon = "data:image/webp;base64,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";

export default function SellPage() {
  return <main className="sell-page">
    <header className="sell-topbar">
      <Link href="/marketplace" className="sell-brand"><img src={serverIcon} alt="Spider Uncopylocked" /><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link>
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
