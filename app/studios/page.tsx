import Link from "next/link";
import SpiderSidebar from "../components/SpiderSidebar";
import { api } from "../../convex/_generated/api";
import { getSpiderProfile } from "../../lib/session";
import { getBillingDb } from "../../lib/stripe";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Blocks,
  Building2,
  CirclePlus,
  Code2,
  ExternalLink,
  Gamepad2,
  Hammer,
  Palette,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Studios | Spider Uncopylocked",
  description: "Discover Roblox studios, present your team, and organize studio profiles.",
};

type Studio = {
  id: string;
  name: string;
  slug: string;
  description: string;
  specialties: string[];
  ownerDiscordId: string;
  ownerName: string;
  ownerAvatar?: string;
  robloxUrl?: string;
  discordUrl?: string;
  createdAt: number;
};

const starterRoles = [
  { label: "Scripters", icon: Code2 },
  { label: "Builders", icon: Hammer },
  { label: "UI & GFX artists", icon: Palette },
];

function StudioCard({ studio, owned = false }: { studio: Studio; owned?: boolean }) {
  return (
    <article className="studios-directory-card">
      <div className="studios-directory-top">
        <div className="studios-directory-avatar">
          {studio.ownerAvatar ? (
            <img src={studio.ownerAvatar} alt="" loading="lazy" />
          ) : (
            <Building2 size={23} />
          )}
        </div>
        <div className="studios-directory-title">
          <h3>{studio.name}</h3>
          <span>@{studio.slug}</span>
        </div>
        {owned && <span className="studios-owner-chip"><BadgeCheck size={13} /> Owner</span>}{owned && studio.status === "pending" && <span className="studios-owner-chip">Pending review</span>}{owned && studio.status === "rejected" && <span className="studios-owner-chip">Needs changes</span>}
      </div>
      <p className="studios-directory-description">{studio.description}</p>
      <div className="studios-directory-specialties">
        {studio.specialties.map(tag => <span key={tag}>{tag}</span>)}
      </div>
      <div className="studio-card-actions">
        {studio.status === "active" && <Link href={"/studios/" + encodeURIComponent(studio.slug)} className="studio-card-link">View studio <ArrowRight size={14} /></Link>}{owned && studio.status === "pending" && <span className="studio-card-link">Awaiting staff approval</span>}
        {owned && <Link href={"/studios/manage/" + encodeURIComponent(studio.slug)} className="studio-card-link studio-card-manage">Manage studio <ArrowUpRight size={14} /></Link>}
      </div>
      <div className="studios-directory-footer">
        <span><Users size={14} /> {studio.ownerName}</span>
        <div>
          {studio.robloxUrl && <a href={studio.robloxUrl} target="_blank" rel="noreferrer" aria-label={studio.name + " Roblox link"}><Gamepad2 size={15} /></a>}
          {studio.discordUrl && <a href={studio.discordUrl} target="_blank" rel="noreferrer" aria-label={studio.name + " Discord invite"}><ExternalLink size={15} /></a>}
        </div>
      </div>
    </article>
  );
}

export default async function StudiosPage() {
  const profile = await getSpiderProfile();
  const db = getBillingDb();
  let myStudios: Studio[] = [];
  let publicStudios: Studio[] = [];
  let databaseAvailable = !!db;
  if (db) {
    try {
      const [mine, all] = await Promise.all([
        profile
          ? db.client.query(api.studios.mine, { adminSecret: db.secret, ownerDiscordId: profile.id })
          : Promise.resolve([]),
        db.client.query(api.studios.publicList, { adminSecret: db.secret }),
      ]);
      myStudios = mine as Studio[];
      publicStudios = all as Studio[];
    } catch (error) {
      console.error("Studios page data lookup failed:", error);
      databaseAvailable = false;
    }
  }
  const ownedIds = new Set(myStudios.map(studio => studio.id));
  const discovered = publicStudios.filter(studio => !ownedIds.has(studio.id));

  return (
    <main className="market-shell studios-page">
      <SpiderSidebar />
      <section className="market-content studios-content">
        <header className="studios-page-header">
          <div>
            <span className="spider-eyebrow">SPIDER / CREATOR WORKSPACES</span>
            <h1>Studios</h1>
            <p>Discover teams building Roblox experiences, see what they specialize in, and create a home for your own studio.</p>
          </div>
          <Link href="/studios/create" className="hire-primary studios-create-button">
            <CirclePlus size={16} /> Create a studio
          </Link>
        </header>

        {!profile && (
          <div className="studios-notice">
            <Users size={18} />
            <span><strong>Looking to start a studio?</strong> Sign in with Discord to save a studio to your account.</span>
            <Link href="/api/auth/discord/login">Sign in <ArrowUpRight size={14} /></Link>
          </div>
        )}
        {!databaseAvailable && (
          <div className="studios-notice" role="status">
            <Building2 size={18} />
            <span><strong>Studio storage unavailable.</strong> Existing studio records could not be loaded. Creating or publishing records is not reported as successful until the database connection works.</span>
          </div>
        )}

        <section id="my-studios" className="studios-section">
          <div className="studios-section-heading">
            <div><span className="spider-eyebrow">YOUR WORKSPACE</span><h2>Your studios</h2><p>Studios connected to your signed-in Discord account.</p></div>
            <span className="studios-panel-count"><Building2 size={14} /> {myStudios.length} {myStudios.length === 1 ? "studio" : "studios"}</span>
          </div>
          {myStudios.length ? (
            <div className="studios-directory-grid">{myStudios.map(studio => <StudioCard key={studio.id} studio={studio} owned />)}</div>
          ) : (
            <div className="studios-empty-state">
              <span className="studios-empty-icon"><Building2 size={26} /></span>
              <h3>{profile ? "Your studio workspace starts here" : "Sign in to create your workspace"}</h3>
              <p>{profile ? "Create a studio profile to save your team's name, description, specialties, and Roblox or Discord links to Spider." : "Your own studios will appear here after you sign in and create one."}</p>
              <Link href={profile ? "/studios/create" : "/api/auth/discord/login"} className="hire-primary">
                <CirclePlus size={15} /> {profile ? "Create your first studio" : "Sign in with Discord"}
              </Link>
            </div>
          )}
        </section>

        <section className="studios-section">
          <div className="studios-section-heading">
            <div><span className="spider-eyebrow">COMMUNITY DIRECTORY</span><h2>Discover studios</h2><p>Explore published studio profiles and follow their external project links.</p></div>
            <span className="studios-panel-count"><Users size={14} /> {discovered.length} listed</span>
          </div>
          {discovered.length ? (
            <div className="studios-directory-grid">{discovered.map(studio => <StudioCard key={studio.id} studio={studio} />)}</div>
          ) : (
            <div className="studios-empty-state studios-empty-compact">
              <span className="studios-empty-icon"><Blocks size={25} /></span>
              <h3>No other studios published yet</h3>
              <p>When creators publish studio profiles, they will appear here. No placeholder studios are shown.</p>
            </div>
          )}
        </section>

        <section className="studios-panel studios-team-panel">
          <div className="studios-panel-heading">
            <div><h2>Build your team</h2><p>Find the skills you need before your next project starts.</p></div>
            <Link href="/developers" className="studios-inline-link">Browse developers <ArrowRight size={14} /></Link>
          </div>
          <div className="studios-role-grid">
            {starterRoles.map(({ label, icon: Icon }) => (
              <Link href="/developers" key={label} className="studios-role-card">
                <span><Icon size={18} /></span><strong>{label}</strong><ArrowUpRight size={14} className="studios-role-arrow" />
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
