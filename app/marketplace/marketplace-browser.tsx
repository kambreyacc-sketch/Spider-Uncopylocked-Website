"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownUp, ArrowRight, Bookmark, Check, ChevronDown, CircleHelp, Clock3, Compass, Flame, Gamepad2, Grid2X2, Heart, LayoutDashboard, ListFilter, MessageSquare, Search, Settings, ShieldCheck, ShoppingBag, SlidersHorizontal, Tag, Users, Wallet } from "lucide-react";
import Link from "next/link";

type Listing = { id:string; title:string; seller:string; price:number; type:"Game"|"UGC Group"; updatedAt:string; image?:string; currentPlayers?:number; peakPlayers?:number; visits?:number; favorites?:number; likesPercent?:number; monthlyRevenue?:number; status:"active"|"pending" };
const listings: Listing[] = [];

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
      <Link className="rq-offer-button" href={"/listing/"+listing.id}><MessageSquare size={15}/> Make offer</Link>
      <div className="rq-listing-foot"><span><Activity size={13}/> {listing.visits ? (listing.visits/1e6).toFixed(1)+"M" : "—"} visits</span><span><Heart size={13}/> {listing.favorites?.toLocaleString() ?? "—"}</span><span><Check size={13}/> {listing.likesPercent ? listing.likesPercent+"%" : "—"}</span></div>
    </div>
  </article>;
}

export default function MarketplaceBrowser() {
  const [tab,setTab]=useState<"Games"|"UGC Groups">("Games");
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("trending");
  const [sidebar,setSidebar]=useState("Home");
  const [savedOnly,setSavedOnly]=useState(false);
  const filtered=useMemo(()=>listings.filter(l=>l.type===(tab==="Games"?"Game":"UGC Group")&&l.title.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price-low"?a.price-b.price:sort==="price-high"?b.price-a.price:0),[tab,query,sort]);
  const groups=[...navGroups];
  return <div className="rq-app">
    <aside className="rq-sidebar">
      <button className="rq-collapse" aria-label="Toggle sidebar"><span>‹</span></button>
      {groups.map(group=><div className="rq-nav-group" key={group.label}><h2>{group.label}</h2>{group.items.map(([label,key])=><Link key={key} href={key==="create"?"/sell":key==="browse"?"/marketplace#browse":"/marketplace"} onClick={()=>setSidebar(label)} className={"rq-nav-item "+(sidebar===label?"selected":"")}><Icon name={key}/>{label}</Link>)}</div>)}
      <div className="rq-nav-group"><h2>RESOURCES</h2><Link className="rq-nav-item" href="/marketplace#how-it-works"><CircleHelp size={17}/>How it works</Link></div>
      <div className="rq-sidebar-bottom"><ShieldCheck size={17}/><span>Spider buyer protection</span></div>
    </aside>
    <div className="rq-main">
      <header className="rq-topbar"><div className="rq-topbar-brand"><img className="market-brand-image" src="https://cdn.discordapp.com/icons/1411733652257374242/deec7fa3d9dc59fb5fa76a21fec3c6fb.webp?size=256" alt="" /><b>Spider Uncopylocked</b></div><nav><Link href="/marketplace#how-it-works">How it works</Link><Link href="/marketplace#fees">Fees</Link><Link href="/marketplace#faq">FAQ</Link></nav><div className="rq-topbar-actions"><button className="rq-icon-button" aria-label="Messages"><MessageSquare size={18}/></button><button className="rq-icon-button" aria-label="Notifications"><Activity size={18}/></button><Link href="/api/auth/roblox/login" className="rq-profile-link"><img className="rq-profile-image" src="https://cdn.discordapp.com/icons/1411733652257374242/deec7fa3d9dc59fb5fa76a21fec3c6fb.webp?size=256" alt="" /> Sign in <ChevronDown size={14}/></Link></div></header>
      <main className="rq-content">
        <section className="rq-welcome"><div><span className="rq-eyebrow"><Flame size={15}/> ROBLOX MARKETPLACE</span><h1>Trending Games</h1><p>Discover Roblox experiences listed by their owners.</p></div><Link href="/sell" className="rq-primary"><Tag size={15}/> Create listing</Link></section>
        <section className="rq-activity-strip"><div><span className="rq-activity-icon"><ShieldCheck size={18}/></span><span><b>Ownership checks</b><small>Listings must be verified before publishing</small></span></div><div><span className="rq-activity-icon"><MessageSquare size={18}/></span><span><b>Offers & messages</b><small>Talk with sellers on Spider</small></span></div><div><span className="rq-activity-icon"><Wallet size={18}/></span><span><b>Protected transactions</b><small>Payments activate after checkout is configured</small></span></div></section>
        <section id="browse" className="rq-browse">
          <div className="rq-section-title"><div><h2>Browse listings</h2><p>Games and UGC groups available on Spider.</p></div><Link href="/marketplace#browse">View all <ArrowRight size={15}/></Link></div>
          <div className="rq-filters"><label className="rq-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search games and listings..." aria-label="Search listings"/></label><div className="rq-tab-group"><button className={tab==="Games"?"active":""} onClick={()=>setTab("Games")}><Gamepad2 size={15}/> Games</button><button className={tab==="UGC Groups"?"active":""} onClick={()=>setTab("UGC Groups")}><Users size={15}/> UGC Groups</button></div><label className="rq-sort"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort listings"><option value="trending">Trending</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
          {filtered.length ? <div className="rq-listing-grid">{filtered.map(l=><ListingCard key={l.id} listing={l}/>)}</div> : <div className="rq-empty"><div className="rq-empty-icon"><Gamepad2 size={26}/></div><h3>No {tab==="Games"?"game":"UGC group"} listings yet</h3><p>When sellers connect Roblox and publish verified listings, they’ll appear here.</p><Link href="/sell" className="rq-primary">Create the first listing <ArrowRight size={15}/></Link></div>}
        </section>
        <section className="rq-how" id="how-it-works"><div><span className="rq-eyebrow">BUILT FOR ROBLOX CREATORS</span><h2>From listing to ownership transfer.</h2><p>Spider is being built around verified ownership, clear listing details, and a buyer/seller order flow.</p></div><div className="rq-how-steps"><article><span>01</span><b>Connect Roblox</b><p>Sign in and verify the games or groups you own.</p></article><article><span>02</span><b>Publish a listing</b><p>Choose a price, add details, and enable offers.</p></article><article><span>03</span><b>Complete the transfer</b><p>Track the sale and verify ownership before payout.</p></article></div></section>
      </main>
      <footer className="rq-footer"><span>© 2026 SPIDER UNCOPYLOCKED</span><span><Link href="/marketplace">Marketplace</Link><Link href="/sell">Sell on Spider</Link></span></footer>
    </div>
  </div>;
}
