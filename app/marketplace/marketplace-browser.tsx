"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowRight, Bookmark, Check, ChevronDown, CircleHelp, Clock3, Flame,
  Gamepad2, Grid2X2, LayoutDashboard, ListFilter, MessageSquare, Search,
  Settings, ShieldCheck, ShoppingBag, SlidersHorizontal, Tag, Users, Wallet,
} from "lucide-react";

function DiscordMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19.7 5.3A18.8 18.8 0 0 0 15.1 3.9l-.6 1.2a17.2 17.2 0 0 0-5 0l-.6-1.2a18.8 18.8 0 0 0-4.6 1.4C1.4 9.6.6 13.8 1 18a18.8 18.8 0 0 0 5.7 2.9l1.2-1.9-1.9-.9.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4-1.9.9 1.2 1.9a18.8 18.8 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.7-12.7ZM8.8 15.4c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.4 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" />
    </svg>
  );
}

type Listing = {
  id: string;
  title: string;
  seller: string;
  price: number;
  type: "Game" | "UGC Group";
  createdAt: number;
  image?: string;
};
type BackendListing = {
  _id: string;
  title: string;
  sellerName: string;
  price: number;
  type: "Game" | "UGC Group";
  createdAt: number;
  imageUrl?: string;
};

const navGroups = [
  { label: "MARKETPLACE", items: [["Home", "home"], ["Browse Listings", "browse"]] },
  { label: "SELLING", items: [["Create Listing", "create"]] },
  { label: "YOUR ACCOUNT", items: [["Watchlist", "watch"], ["Settings", "settings"]] },
] as const;

function Icon({ name }: { name: string }) {
  const props = { size: 17, strokeWidth: 1.8 };
  switch (name) {
    case "home": return <LayoutDashboard {...props} />;
    case "browse": return <Grid2X2 {...props} />;
    case "create": return <Tag {...props} />;
    case "watch": return <Bookmark {...props} />;
    default: return <Settings {...props} />;
  }
}

function ListingCard({
  listing,
  saved,
  onToggleSave,
}: {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const date = new Date(listing.createdAt);
  return (
    <article className="rq-listing-card">
      <div className="rq-listing-image">
        {listing.image ? (
          <><img src={listing.image} alt={listing.title + " preview"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; const fallback = event.currentTarget.parentElement?.querySelector(".rq-image-empty"); if (fallback instanceof HTMLElement) fallback.hidden = false; }} /><div className="rq-image-empty" hidden><Gamepad2 size={27} strokeWidth={1.5} /><span>No preview available</span></div></>
        ) : (
          <div className="rq-image-empty">
            <Gamepad2 size={27} strokeWidth={1.5} />
            <span>No preview uploaded</span>
          </div>
        )}
        <span className="rq-type">{listing.type}</span>
        <button
          type="button"
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={saved}
          className={"rq-save" + (saved ? " active" : "")}
          onClick={() => onToggleSave(listing.id)}
          title={saved ? "Remove from watchlist" : "Save to watchlist"}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="rq-listing-content">
        <h3>{listing.title}</h3>
        <div className="rq-seller"><span className="rq-avatar">{(listing.seller || "S").slice(0, 1).toUpperCase()}</span>@{listing.seller || "seller"}</div>
        <div className="rq-price-row rq-real-price-row">
          <div>
            <strong>{listing.price <= 0 ? "Free" : listing.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })}</strong>
            <small>Listing price</small>
          </div>
          <div className="rq-revenue">
            <strong>{Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
            <small>Date listed</small>
          </div>
        </div>
        <Link className="rq-offer-button" href={"/listing/" + listing.id}>
          <MessageSquare size={15} /> View listing & contact seller
        </Link>
        <div className="rq-listing-foot"><span><Clock3 size={13} /> {listing.type}</span><span><Check size={13} /> Details from seller</span></div>
      </div>
    </article>
  );
}

export default function MarketplaceBrowser() {
  const [tab, setTab] = useState<"Games" | "UGC Groups">("Games");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [sidebar, setSidebar] = useState("Home");
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [discordUser, setDiscordUser] = useState<{ id: string; username: string; displayName: string; avatar: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) setDiscordUser(data.user ?? null); })
      .catch(() => { if (active) setDiscordUser(null); });
    try {
      const stored = JSON.parse(localStorage.getItem("spider-marketplace-watchlist") || "[]");
      if (Array.isArray(stored)) setSavedIds(stored.filter((value) => typeof value === "string"));
    } catch { setSavedIds([]); }
    if (new URLSearchParams(window.location.search).get("view") === "watchlist") setSavedOnly(true);
    return () => { active = false; };
  }, []);

  const backendListings = useQuery(api.listings.publicListings, {});
  const isLoading = backendListings === undefined;
  const listings: Listing[] = (backendListings ?? []).map((row: BackendListing) => ({
    id: row._id,
    title: row.title,
    seller: row.sellerName,
    price: row.price,
    type: row.type,
    createdAt: row.createdAt,
    image: row.imageUrl,
  }));

  const filtered = useMemo(() => listings
    .filter((listing) => listing.type === (tab === "Games" ? "Game" : "UGC Group"))
    .filter((listing) => listing.title.toLowerCase().includes(query.trim().toLowerCase()) || listing.seller.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((listing) => !savedOnly || savedIds.includes(listing.id))
    .sort((a, b) => sort === "price-low"
      ? a.price - b.price
      : sort === "price-high"
        ? b.price - a.price
        : b.createdAt - a.createdAt),
  [listings, tab, query, sort, savedOnly, savedIds]);

  function toggleSaved(id: string) {
    setSavedIds((previous) => {
      const next = previous.includes(id) ? previous.filter((savedId) => savedId !== id) : [...previous, id];
      try { localStorage.setItem("spider-marketplace-watchlist", JSON.stringify(next)); } catch { /* Watchlist remains available for this session. */ }
      return next;
    });
  }

  function chooseNav(label: string, key: string) {
    setSidebar(label);
    if (key === "watch") setSavedOnly(true);
    if (key === "home" || key === "browse") setSavedOnly(false);
  }

  const groups = [...navGroups];
  return (
    <div className="rq-app">
      <aside className="rq-sidebar" aria-label="Marketplace navigation">
        <div className="rq-market-brand">
          <img src="/spider-uncopylocked-pfp.webp" alt="" />
          <b>SPIDER <span>MARKETPLACE</span></b>
        </div>
        {groups.map((group) => (
          <div className="rq-nav-group" key={group.label}>
            <h2>{group.label}</h2>
            {group.items.map(([label, key]) => {
              const href = key === "create" ? "/sell" : key === "settings" ? "/settings" : key === "watch" ? "#browse" : key === "browse" ? "#browse" : "/marketplace";
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={(event) => {
                    if (key === "watch") {
                      event.preventDefault();
                      chooseNav(label, key);
                      window.history.replaceState({}, "", "/marketplace?view=watchlist#browse");
                      document.getElementById("browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                      chooseNav(label, key);
                    }
                  }}
                  className={"rq-nav-item " + (sidebar === label ? "selected" : "")}
                >
                  <Icon name={key} />{label}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="rq-nav-group">
          <h2>RESOURCES</h2>
          <Link className="rq-nav-item" href="/marketplace#how-it-works"><CircleHelp size={17} /> How it works</Link>
          <Link className="rq-nav-item" href="/resources"><ShoppingBag size={17} /> Free resources</Link>
        </div>
        <div className="rq-sidebar-bottom"><ShieldCheck size={17} /><span>Check each listing's details</span></div>
      </aside>

      <div className="rq-main">
        <header className="rq-topbar">
          <div className="rq-topbar-brand"><img className="market-brand-mark" src="/spider-uncopylocked-pfp.webp" alt="" /><b>Spider Uncopylocked</b></div>
          <nav><Link href="/marketplace#how-it-works">How it works</Link><Link href="/resources">Free resources</Link><Link href="/settings">Settings</Link></nav>
          <div className="rq-topbar-actions">
            <Link href="/messages" className="rq-icon-button" aria-label="Messages" title="Messages"><MessageSquare size={18} /></Link>
            <button className="rq-icon-button" aria-label="Notifications are not available yet" title="Notifications are not available yet" disabled><span className="rq-notifications-dot" aria-hidden="true" /></button>
            {discordUser ? (
              <div className="rq-profile-link" title={"Discord connected: " + discordUser.username}>
                <img className="rq-profile-image" src={discordUser.avatar || "/spider-uncopylocked-pfp.webp"} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/spider-uncopylocked-pfp.webp"; }} />
                <span className="rq-account-label"><b>{discordUser.displayName}</b><small>@{discordUser.username}</small></span>
                <ChevronDown size={14} />
              </div>
            ) : (
              <Link href="/api/auth/discord/login" className="rq-profile-link"><DiscordMark /><span>Continue with Discord</span><ChevronDown size={14} /></Link>
            )}
          </div>
        </header>

        <main className="rq-content">
          <section className="rq-welcome">
            <div><span className="rq-eyebrow"><Flame size={15} /> ROBLOX MARKETPLACE</span><h1>{savedOnly ? "Your watchlist" : "Browse game listings"}</h1><p>{savedOnly ? "Listings you saved in this browser." : "Explore game and UGC listings shared by their owners."}</p></div>
            <Link href="/sell" className="rq-primary"><Tag size={15} /> Create listing</Link>
          </section>
          <section className="rq-activity-strip">
            <div><span className="rq-activity-icon"><ShieldCheck size={18} /></span><span><b>Review ownership and terms</b><small>Check seller details before agreeing to a transfer.</small></span></div>
            <div><span className="rq-activity-icon"><MessageSquare size={18} /></span><span><b>Contact the seller</b><small>Use the contact details shown on each listing.</small></span></div>
            <div><span className="rq-activity-icon"><Wallet size={18} /></span><span><b>Payments</b><small>Checkout is not active on this marketplace yet.</small></span></div>
          </section>
          <section id="browse" className="rq-browse">
            <div className="rq-section-title"><div><h2>{savedOnly ? "Saved listings" : "Listings"}</h2><p>Prices and listing dates come from the published listing records.</p></div><button className="rq-clear-watchlist" type="button" onClick={() => { const nextSavedOnly = !savedOnly; setSavedOnly(nextSavedOnly); setSidebar(nextSavedOnly ? "Watchlist" : "Home"); window.history.replaceState({}, "", nextSavedOnly ? "/marketplace?view=watchlist#browse" : "/marketplace#browse"); }}>{savedOnly ? "Show all listings" : "Show saved"}</button></div>
            <div className="rq-filters">
              <label className="rq-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games or sellers..." aria-label="Search listings" /></label>
              <div className="rq-tab-group"><button className={tab === "Games" ? "active" : ""} onClick={() => setTab("Games")}><Gamepad2 size={15} /> Games</button><button className={tab === "UGC Groups" ? "active" : ""} onClick={() => setTab("UGC Groups")}><Users size={15} /> UGC Groups</button></div>
              <label className="rq-sort"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option value="newest">Recently listed</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            </div>
            {isLoading ? (
              <div className="rq-empty" role="status"><div className="rq-empty-icon"><Gamepad2 size={23} /></div><h3>Loading listings</h3><p>Fetching public listings from Spider.</p></div>
            ) : filtered.length ? (
              <div className="rq-listing-grid">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onToggleSave={toggleSaved} />)}</div>
            ) : (
              <div className="rq-empty"><div className="rq-empty-icon"><Gamepad2 size={23} /></div><h3>{savedOnly ? "No saved listings" : "No " + (tab === "Games" ? "game" : "UGC group") + " listings yet"}</h3><p>{savedOnly ? "Use the bookmark on a listing to save it to this browser." : "Published listings will appear here when creators add them."}</p>{savedOnly ? <button type="button" className="rq-primary" onClick={() => { setSavedOnly(false); setSidebar("Home"); }}>Browse all listings <ArrowRight size={15} /></button> : <Link href="/sell" className="rq-primary">Create the first listing <ArrowRight size={15} /></Link>}</div>
            )}
          </section>
          <section className="rq-how" id="how-it-works"><div><span className="rq-eyebrow">BUILT FOR ROBLOX CREATORS</span><h2>Clear listings. Direct conversations.</h2><p>Review each listing's ownership information, price, and contact details before making an agreement.</p></div><div className="rq-how-steps"><article><span>01</span><b>Review the listing</b><p>Read the details and review information supplied by its owner.</p></article><article><span>02</span><b>Contact the seller</b><p>Use the listing details to ask questions before agreeing.</p></article><article><span>03</span><b>Agree on next steps</b><p>Set clear terms and verify ownership independently before a transfer.</p></article></div></section>
        </main>
        <footer className="rq-footer"><span>© 2026 SPIDER UNCOPYLOCKED</span><span><Link href="/marketplace">Marketplace</Link><Link href="/sell">Sell on Spider</Link></span></footer>
      </div>
    </div>
  );
}
