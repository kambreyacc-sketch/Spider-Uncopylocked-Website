"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, Blocks, CheckCircle2, Code2, Gamepad2, Search, SlidersHorizontal, X } from "lucide-react";

type Listing = {
  id: number;
  title: string;
  category: "Game" | "Template" | "UI Kit" | "Script";
  price: number;
  seller: string;
  description: string;
  tag: string;
  color: string;
  icon: "game" | "template" | "ui" | "script";
};

const listings: Listing[] = [
  { id: 1, title: "Neon Drift — Racing Starter", category: "Template", price: 18, seller: "Spider Labs", description: "A polished racing-game starter with a garage flow, lap tracking, checkpoints, and a neon-inspired UI. Intended as a customizable foundation, not a finished live game.", tag: "STARTER KIT", color: "market-art-violet", icon: "template" },
  { id: 2, title: "Round-Based Arena Framework", category: "Script", price: 12, seller: "ByteForge", description: "A modular round manager concept with intermission, team assignment, round states, and configurable match settings.", tag: "GAME SYSTEM", color: "market-art-blue", icon: "script" },
  { id: 3, title: "Cozy Café Simulator", category: "Game", price: 240, seller: "Pixel Harbor", description: "A sample game listing concept with a cozy visual direction, progression loop, and room for custom content. Real ownership and performance verification would be required before any sale.", tag: "GAME PROJECT", color: "market-art-orange", icon: "game" },
  { id: 4, title: "Clean Tycoon UI Pack", category: "UI Kit", price: 9, seller: "MiraMakes", description: "A sample interface pack concept for cash counters, upgrade panels, settings, and responsive menu layouts.", tag: "UI COLLECTION", color: "market-art-pink", icon: "ui" },
  { id: 5, title: "Obby World Builder Kit", category: "Template", price: 25, seller: "Northstar Dev", description: "A modular obby template concept with checkpoints, stage selection, reusable obstacle patterns, and a simple progress flow.", tag: "WORLD TEMPLATE", color: "market-art-green", icon: "template" },
  { id: 6, title: "Inventory & Hotbar System", category: "Script", price: 15, seller: "ByteForge", description: "A configurable inventory system concept with item slots, hotbar selection, and a UI-ready data model.", tag: "GAME SYSTEM", color: "market-art-dark", icon: "script" },
];

const categories = ["All", "Game", "Template", "UI Kit", "Script"] as const;
type Category = typeof categories[number];

function ListingIcon({ icon }: { icon: Listing["icon"] }) {
  if (icon === "game") return <Gamepad2 size={20} />;
  if (icon === "template") return <Blocks size={20} />;
  if (icon === "script") return <Code2 size={20} />;
  return <SlidersHorizontal size={20} />;
}

export default function MarketplaceBrowser() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState<Listing | null>(null);

  const visibleListings = useMemo(() => {
    const filtered = listings.filter((listing) => {
      const categoryMatches = category === "All" || listing.category === category;
      const searchable = (listing.title + " " + listing.category + " " + listing.seller + " " + listing.description).toLowerCase();
      return categoryMatches && searchable.includes(query.trim().toLowerCase());
    });
    if (sort === "price-low") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [category, query, sort]);

  return (
    <>
      <section className="market-hero">
        <div className="market-hero-grid" aria-hidden="true" />
        <div className="market-hero-inner">
          <div className="market-breadcrumb">SPIDER / MARKETPLACE <span>—</span> DISCOVER</div>
          <div className="market-hero-row">
            <div>
              <div className="market-eyebrow"><span /> THE CREATOR ECONOMY, BUILT TOGETHER</div>
              <h1>Find your next<br /><em>great build.</em></h1>
              <p>Discover Roblox games, ready-to-customize templates, UI kits, and development systems made for creators.</p>
              <div className="market-hero-actions"><a className="market-primary" href="#browse">Browse listings <ArrowRight size={16} /></a><a className="market-secondary" href="#sell">Become a seller <ArrowDownUp size={15} /></a></div>
            </div>
            <div className="market-hero-stat">
              <div className="market-orbit"><div className="market-orbit-core"><Blocks size={36} /></div></div>
              <span className="market-stat-label">ONE PLACE TO BUILD</span>
              <strong>Games <i>×</i> Templates</strong>
              <strong>Tools <i>×</i> Creators</strong>
              <small>Sample marketplace preview · not live listings</small>
            </div>
          </div>
          <div className="market-trust-row"><span><CheckCircle2 size={15} /> Clear listing details</span><span><CheckCircle2 size={15} /> Creator-first discovery</span><span><CheckCircle2 size={15} /> Seller verification planned</span></div>
        </div>
      </section>

      <section className="market-browse shell" id="browse">
        <div className="market-section-heading">
          <div><span className="market-section-kicker">01 / DISCOVER</span><h2>The marketplace<span>.</span></h2><p>Explore the kinds of products Spider will support. These are demonstration listings while the seller system is being built.</p></div>
          <div className="market-demo-pill"><span /> PREVIEW DATA</div>
        </div>
        <div className="market-toolbar">
          <label className="market-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games, templates, scripts..." aria-label="Search marketplace listings" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
          <label className="market-sort"><ArrowDownUp size={15} /><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        </div>
        <div className="market-category-row" role="group" aria-label="Filter by category">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item === "All" ? "All listings" : item === "Game" ? "Games" : item === "Template" ? "Templates" : item === "UI Kit" ? "UI kits" : "Scripts"}<span>{item === "All" ? listings.length : listings.filter((listing) => listing.category === item).length}</span></button>)}</div>
        <div className="market-results-line"><span>SHOWING <strong>{visibleListings.length}</strong> DEMO LISTINGS</span><span>PRICES SHOWN IN USD</span></div>
        {visibleListings.length > 0 ? <div className="market-listing-grid">{visibleListings.map((listing) => <article className="market-listing-card" key={listing.id}>
          <div className={"market-listing-art " + listing.color}><div className="market-art-grid" /><div className="market-art-icon"><ListingIcon icon={listing.icon} /></div><span className="market-art-label">{listing.tag}</span><span className="market-art-number">0{listing.id}</span></div>
          <div className="market-listing-body"><div className="market-listing-meta"><span>{listing.category}</span><span>DEMO</span></div><h3>{listing.title}</h3><p>{listing.description}</p><div className="market-listing-bottom"><div><small>LISTED BY</small><strong>{listing.seller}</strong></div><div className="market-price"><small>STARTING AT</small><strong>{listing.price === 0 ? "Free" : "$" + listing.price.toFixed(2)}</strong></div></div><button className="market-view-button" type="button" onClick={() => setSelected(listing)}>View listing <ArrowRight size={15} /></button></div>
        </article>)}</div> : <div className="market-empty"><Search size={24} /><h3>No listings found</h3><p>Try a different search or category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
      </section>

      <section className="market-sell shell" id="sell"><div className="market-sell-card"><div className="market-sell-icon"><Blocks size={25} /></div><div><span className="market-section-kicker">02 / FOR CREATORS</span><h2>Made something worth sharing?</h2><p>Our next step is a seller flow where creators can submit games and digital products, set prices, add previews, and manage their listings.</p></div><div className="market-sell-right"><span className="market-coming-soon">SELLER TOOLS · COMING NEXT</span><button type="button" onClick={() => document.getElementById("sell")?.scrollIntoView({ behavior: "smooth" })}>Seller tools roadmap <ArrowRight size={15} /></button></div></div></section>

      {selected && <div className="market-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="market-modal" role="dialog" aria-modal="true" aria-labelledby="market-modal-title"><button className="market-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close listing details"><X size={18} /></button><span className="market-section-kicker">DEMO LISTING / {String(selected.id).padStart(3, "0")}</span><div className={"market-modal-art " + selected.color}><ListingIcon icon={selected.icon} /></div><div className="market-listing-meta"><span>{selected.category}</span><span>SAMPLE DATA ONLY</span></div><h2 id="market-modal-title">{selected.title}</h2><p>{selected.description}</p><div className="market-modal-detail"><div><small>SELLER</small><strong>{selected.seller}</strong></div><div><small>DISPLAY PRICE</small><strong>{selected.price === 0 ? "Free" : "$" + selected.price.toFixed(2)}</strong></div></div><div className="market-demo-notice">Purchases, seller accounts, and file delivery are not enabled yet. This preview shows how a listing detail could look.</div><button type="button" className="market-primary market-modal-action" onClick={() => setSelected(null)}>Back to marketplace <ArrowRight size={15} /></button></section></div>}
    </>
  );
}
