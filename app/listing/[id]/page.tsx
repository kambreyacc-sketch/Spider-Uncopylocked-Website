"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, MessageCircle } from "lucide-react";

type Listing = {
  _id: string; title: string; type: "Game" | "UGC Group"; robloxUrl: string;
  price: number; description: string; sellerName: string; sellerRobloxId: string;
  contactDiscord?: string; contactEmail?: string; contactPhone?: string; imageUrl?: string;
};
export default function ListingPage() {
  const params = useParams<{id:string}>();
  const rows = useQuery(api.listings.publicListings, {});
  const listing = (rows as Listing[] | undefined)?.find((row) => row._id === params.id);
  if (rows === undefined) return <main className="sell-page"><div className="sell-shell"><p>Loading listing…</p></div></main>;
  if (!listing) return <main className="sell-page"><div className="sell-shell"><Link href="/marketplace" className="sell-back"><ArrowLeft size={15}/> Back to marketplace</Link><h1>Listing not found</h1><p>This listing may have been removed or is not public.</p></div></main>;
  return <main className="sell-page">
    <header className="sell-topbar"><Link href="/marketplace" className="sell-brand"><img className="market-brand-mark" src="/spider-uncopylocked-pfp.webp" alt="" /><span>SPIDER <b>UNCOPYLOCKED</b><small>CREATOR MARKETPLACE</small></span></Link><div className="sell-top-links"><Link href="/marketplace">Marketplace</Link><Link href="/sell">Sell on Spider</Link><Link href="/api/auth/discord/login" className="sell-connect">Sign in with Discord</Link></div></header>
    <div className="sell-shell">
      <Link href="/marketplace" className="sell-back"><ArrowLeft size={15}/> Back to marketplace</Link>
      <section className="sell-intro"><span className="sell-eyebrow">{listing.type === "Game" ? "ROBLOX EXPERIENCE" : "UGC GROUP"}</span><h1>{listing.title}</h1><p>Listed by @{listing.sellerName}</p></section>
      <section className="sell-form-section" style={{maxWidth:900}}>
        {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title} style={{width:"100%",maxHeight:380,objectFit:"cover",borderRadius:8,marginBottom:24}} onError={(event) => { event.currentTarget.style.display = "none"; const fallback = event.currentTarget.parentElement?.querySelector(".listing-no-preview"); if (fallback instanceof HTMLElement) fallback.hidden = false; }} /> : null}<div className="listing-no-preview" hidden><span>NO PREVIEW IMAGE</span><p>The seller has not provided a thumbnail for this listing.</p></div>
        <h2>Asking price: {listing.price.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2})}</h2>
        <p style={{whiteSpace:"pre-wrap"}}>{listing.description || "The seller hasn't added a description yet."}</p>
        <p><a href={listing.robloxUrl} target="_blank" rel="noreferrer" className="sell-fetch-thumbnail">Open Roblox listing ↗</a></p>
      </section>
      <section className="sell-form-section" style={{maxWidth:900}}>
        <h2>Contact the seller</h2><p>Use one of the contact methods the seller provided to discuss the listing. Spider does not process payments yet.</p>
        {listing.contactDiscord && <p><b>Discord:</b> {listing.contactDiscord}</p>}
        {listing.contactEmail && <p><b>Email:</b> <a href={"mailto:"+listing.contactEmail}>{listing.contactEmail}</a></p>}
        {listing.contactPhone && <p><b>Phone:</b> <a href={"tel:"+listing.contactPhone}>{listing.contactPhone}</a></p>}
        {!listing.contactDiscord && !listing.contactEmail && !listing.contactPhone && <p>No contact details are available for this listing.</p>}
        <Link href="/marketplace" className="sell-submit" style={{display:"inline-flex",marginTop:16}}><MessageCircle size={16}/> Back to marketplace</Link>
      </section>
    </div>
  </main>;
}
