"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ArrowUpRight, Gamepad2 } from "lucide-react";

type PublicListing = {
  _id: string;
  title: string;
  type: "Game" | "UGC Group";
  price: number;
  imageUrl?: string;
};

export default function HomeGameShowcase() {
  const listings = useQuery(api.listings.publicListings, {});
  const imageBacked = (listings ?? [])
    .filter((listing: PublicListing) => typeof listing.imageUrl === "string" && listing.imageUrl.trim().length > 0)
    .slice(0, 3) as PublicListing[];

  return (
    <aside className="spider-game-showcase" aria-label="Real marketplace game previews">
      <div className="spider-game-showcase-heading">
        <span>COMMUNITY GAME PREVIEWS</span>
        <Link href="/marketplace">Marketplace <ArrowUpRight size={13} /></Link>
      </div>
      {imageBacked.length > 0 ? (
        <div className="spider-game-showcase-grid">
          {imageBacked.map((listing, index) => (
            <Link
              key={listing._id}
              href={"/listing/" + listing._id}
              className={"spider-game-preview" + (index === 0 ? " is-featured" : "")}
              aria-label={"View listing: " + listing.title}
            >
              <img src={listing.imageUrl} alt={listing.title + " listing preview"} loading={index === 0 ? "eager" : "lazy"} />
              <span className="spider-game-preview-shade" />
              <span className="spider-game-preview-info">
                <small>{listing.type === "Game" ? "ROBLOX EXPERIENCE" : "UGC GROUP"}</small>
                <b>{listing.title}</b>
                <span>{listing.price > 0 ? listing.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "Price not set"}</span>
              </span>
              <span className="spider-game-preview-arrow"><ArrowUpRight size={15} /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="spider-game-showcase-empty" role="status">
          <span className="spider-game-empty-icon"><Gamepad2 size={23} /></span>
          <b>{listings === undefined ? "Loading published games" : "Real game previews will appear here"}</b>
          <p>{listings === undefined ? "Checking the existing public marketplace listings." : "Publish a listing with a real Roblox thumbnail or creator-uploaded image to feature it here."}</p>
          <Link href="/marketplace">Explore marketplace <ArrowUpRight size={14} /></Link>
        </div>
      )}
      <div className="spider-game-showcase-foot"><span>PUBLIC LISTING IMAGES</span><span>NO GENERATED ART</span></div>
    </aside>
  );
}
