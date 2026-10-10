"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Activity, ArrowDownUp, ArrowRight, Bookmark, Check, ChevronDown, CircleHelp, Clock3, Compass, Flame, Gamepad2, Grid2X2, Heart, LayoutDashboard, ListFilter, MessageSquare, Search, Settings, ShieldCheck, ShoppingBag, SlidersHorizontal, Tag, Users, Wallet } from "lucide-react";

function DiscordMark() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.7 5.3A18.8 18.8 0 0 0 15.1 3.9l-.6 1.2a17.2 17.2 0 0 0-5 0l-.6-1.2a18.8 18.8 0 0 0-4.6 1.4C1.4 9.6.6 13.8 1 18a18.8 18.8 0 0 0 5.7 2.9l1.2-1.9-1.9-.9.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4-1.9.9 1.2 1.9a18.8 18.8 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.7-12.7ZM8.8 15.4c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.4 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"/></svg>; }
import Link from "next/link";

type Listing = { id:string; title:string; seller:string; price:number; type:"Game"|"UGC Group"; updatedAt:string; image?:string; currentPlayers?:number; peakPlayers?:number; visits?:number; favorites?:number; likesPercent?:number; monthlyRevenue?:number; status:"active"|"pending" };
type BackendListing = { _id: string; title: string; sellerName: string; price: number; type: "Game"|"UGC Group"; createdAt: number; imageUrl?: string };


const navGroups = [
  { label:"MARKETPLACE", items:[["Home", "home"],["Browse Listings","browse"]] },
  { label:"SELLING", items:[["Seller Dashboard","seller"],["Create Listing","create"],["My Listings","mine"]] },
  { label:"YOUR ACCOUNT", items:[["Watchlist","watch"],["My Purchases","purchases"],["Settings","settings"]] },
];

function Icon({ name }: { name:string }) {
  const props={size:17,strokeWidth:1.8};
  switch(name){case"home":return <LayoutDashboard {...props}/>;case"browse":return <Grid2X2 {...props}/>;case"seller":return <Wallet {...props}/>;case"create":return <Tag {...props}/>;case"mine":return <ListFilter {...props}/>;case"watch":return <Bookmark {...props}/>;case"purchases":return <ShoppingBag {...props}/>;default:return <Settings {...props}/>}
}

function ListingCard({ listing }: { listing:Listing }) {
  return <article className="rq-listing-card">
    <div className="rq-listing-image">{listing.image ? <img src={listing.image} alt="" /> : <div className="rq-image-empty"><Gamepad2 size={36}/></div>}<span className="rq-type">{listing.type}</span><button aria-label="Add to watchlist" className="rq-save"><Bookmark size={16}/></button></div>
    <div className="rq-listing-content"><h3>{listing.title}</h3><div className="rq-seller"><span className="rq-avatar">{listing.seller.slice(0,1).toUpperCase()}</span>@{listing.seller}</div>
      <div className="rq-metrics"><span><i/> {listing.currentPlayers ?? 0} CCU</span><span>{(listing.peakPlayers ?? 0).toLocaleString()} Peak CCU</span></div>
      <div className="rq-chart" aria-hidden="true">{Array.from({length:32},(_,i)=><i key={i} style={{height:(7+((i*19+listing.title.length*7)%23))+"px"}}/>)}</div>
      <div className="rq-price-row"><div><strong>{listing.price.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}</strong><small>Current offer</small></div><div className="rq-revenue"><strong>{listing.monthlyRevenue ? "$"+listing.monthlyRevenue.toLocaleString() : "—"}</strong><small>Monthly revenue</small></div></div>
      <Link className="rq-offer-button" href={"/listing/"+listing.id}><MessageSquare size={15}/> View listing & contact seller</Link>
      <div className="rq-listing-foot"><span><Activity size={13}/> {listing.visits ? (listing.visits/1e6).toFixed(1)+"M" : "—"} visits</span><span><Heart size={13}/> {listing.favorites?.toLocaleString() ?? "—"}</span><span><Check size={13}/> {listing.likesPercent ? listing.likesPercent+"%" : "—"}</span></div>
    </div>
  </article>;
}

export default function MarketplaceBrowser() {
  const [tab,setTab]=useState<"Games"|"UGC Groups">("Games");
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("trending");
  const [sidebar,setSidebar]=useState("Home");
  const [savedOnly,setSavedOnly]=useState(false);\n  const [discordUser,setDiscordUser]=useState<{id:string;username:string;displayName:string;avatar:string}|null>(null);\n  useEffect(()=>{fetch("/api/auth/discord/me",{cache:"no-store"}).then(r=>r.json()).then(d=>setDiscordUser(d.user??null)).catch(()=>setDiscordUser(null));},[]);
  const backendListings = useQuery(api.listings.publicListings, {});
  const listings: Listing[] = (backendListings ?? []).map((row: BackendListing) => ({
    id: row._id,
    title: row.title,
    seller: row.sellerName,
    price: row.price,
    type: row.type,
    updatedAt: new Date(row.createdAt).toISOString(),
    image: row.imageUrl,
    status: "active",
  }));
  const filtered=useMemo(()=>listings.filter(l=>l.type===(tab==="Games"?"Game":"UGC Group")&&l.title.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price-low"?a.price-b.price:sort==="price-high"?b.price-a.price:0),[listings,tab,query,sort]);
  const groups=[...navGroups];
  return <div className="rq-app">
    <aside className="rq-sidebar">
      <button className="rq-collapse" aria-label="Toggle sidebar"><span>‹</span></button>
      {groups.map(group=><div className="rq-nav-group" key={group.label}><h2>{group.label}</h2>{group.items.map(([label,key])=><Link key={key} href={key==="create"?"/sell":key==="browse"?"/marketplace#browse":"/marketplace"} onClick={()=>setSidebar(label)} className={"rq-nav-item "+(sidebar===label?"selected":"")}><Icon name={key}/>{label}</Link>)}</div>)}
      <div className="rq-nav-group"><h2>RESOURCES</h2><Link className="rq-nav-item" href="/marketplace#how-it-works"><CircleHelp size={17}/>How it works</Link></div>
      <div className="rq-sidebar-bottom"><ShieldCheck size={17}/><span>Spider buyer protection</span></div>
    </aside>
    <div className="rq-main">
      <header className="rq-topbar"><div className="rq-topbar-brand"><img className="market-brand-image" src="data:image/webp;base64,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" alt="" /><b>Spider Uncopylocked</b></div><nav><Link href="/marketplace#how-it-works">How it works</Link><Link href="/marketplace#fees">Fees</Link><Link href="/marketplace#faq">FAQ</Link></nav><div className="rq-topbar-actions"><button className="rq-icon-button" aria-label="Messages"><MessageSquare size={18}/></button><button className="rq-icon-button" aria-label="Notifications"><Activity size={18}/></button>{discordUser ? <div className="rq-profile-link" title={`Discord ID: ${discordUser.id}`}><img className="rq-profile-image" src={discordUser.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"} alt="" /><span className="rq-account-label"><b>{discordUser.displayName}</b><small>@{discordUser.username} · ID {discordUser.id}</small></span><ChevronDown size={14}/></div> : <Link href="/api/auth/discord/login" className="rq-profile-link"><DiscordMark/><span>Continue with Discord</span><ChevronDown size={14}/></Link>}</div></header>
      <main className="rq-content">
        <section className="rq-welcome"><div><span className="rq-eyebrow"><Flame size={15}/> ROBLOX MARKETPLACE</span><h1>Trending Games</h1><p>Discover Roblox experiences listed by their owners.</p></div><Link href="/sell" className="rq-primary"><Tag size={15}/> Create listing</Link></section>
        <section className="rq-activity-strip"><div><span className="rq-activity-icon"><ShieldCheck size={18}/></span><span><b>Ownership checks</b><small>Listings must be verified before publishing</small></span></div><div><span className="rq-activity-icon"><MessageSquare size={18}/></span><span><b>Offers & messages</b><small>Talk with sellers on Spider</small></span></div><div><span className="rq-activity-icon"><Wallet size={18}/></span><span><b>Protected transactions</b><small>Payments activate after checkout is configured</small></span></div></section>
        <section id="browse" className="rq-browse">
          <div className="rq-section-title"><div><h2>Browse listings</h2><p>Games and UGC groups available on Spider.</p></div><Link href="/marketplace#browse">View all <ArrowRight size={15}/></Link></div>
          <div className="rq-filters"><label className="rq-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search games and listings..." aria-label="Search listings"/></label><div className="rq-tab-group"><button className={tab==="Games"?"active":""} onClick={()=>setTab("Games")}><Gamepad2 size={15}/> Games</button><button className={tab==="UGC Groups"?"active":""} onClick={()=>setTab("UGC Groups")}><Users size={15}/> UGC Groups</button></div><label className="rq-sort"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort listings"><option value="trending">Trending</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
          {filtered.length ? <div className="rq-listing-grid">{filtered.map(l=><ListingCard key={l.id} listing={l}/>)}</div> : <div className="rq-empty"><div className="rq-empty-icon"><img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Roblox_Logo.svg" alt="Roblox"/></div><h3>No {tab==="Games"?"game":"UGC group"} listings yet</h3><p>When sellers connect Roblox and publish verified listings, they’ll appear here.</p><Link href="/sell" className="rq-primary">Create the first listing <ArrowRight size={15}/></Link></div>}
        </section>
        <section className="rq-how" id="how-it-works"><div><span className="rq-eyebrow">BUILT FOR ROBLOX CREATORS</span><h2>From listing to ownership transfer.</h2><p>Spider is being built around verified ownership, clear listing details, and a buyer/seller order flow.</p></div><div className="rq-how-steps"><article><span>01</span><b>Connect Roblox</b><p>Sign in and verify the games or groups you own.</p></article><article><span>02</span><b>Publish a listing</b><p>Choose a price, add details, and enable offers.</p></article><article><span>03</span><b>Complete the transfer</b><p>Track the sale and verify ownership before payout.</p></article></div></section>
      </main>
      <footer className="rq-footer"><span>© 2026 SPIDER UNCOPYLOCKED</span><span><Link href="/marketplace">Marketplace</Link><Link href="/sell">Sell on Spider</Link></span></footer>
    </div>
  </div>;
}
