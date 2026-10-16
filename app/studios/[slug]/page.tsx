"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import SpiderSidebar from "../../components/SpiderSidebar";
import { ArrowLeft, BriefcaseBusiness, Building2, ExternalLink, LoaderCircle, Users } from "lucide-react";

type Role = { id: string; title: string; description: string; roleType: string; compensation: string; status: string; createdAt: number };
type Studio = { id: string; name: string; slug: string; description: string; specialties: string[]; ownerName: string; ownerAvatar?: string; ownerDiscordId: string; robloxUrl?: string; discordUrl?: string };
export default function StudioDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [studio, setStudio] = useState<Studio | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Role | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/studios/" + encodeURIComponent(slug) + "/roles", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load studio.");
      setStudio(data.studio); setRoles(data.roles || []); setIsOwner(!!data.isOwner);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not load studio."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [slug]);

  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!selected || saving) return;
    setSaving(true); setNotice("");
    try {
      const res = await fetch("/api/studios/" + encodeURIComponent(slug) + "/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selected.id, portfolioUrl, experience, message, attachments: attachments.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 5) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application could not be submitted.");
      setNotice("Application submitted successfully."); setSelected(null); setPortfolioUrl(""); setExperience(""); setMessage(""); setAttachments("");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Application could not be submitted."); }
    finally { setSaving(false); }
  }

  return <main className="market-shell studios-page"><SpiderSidebar /><section className="market-content studios-content">
    <Link href="/studios" className="hire-back"><ArrowLeft size={14}/> Back to studios</Link>
    {loading ? <div className="studios-empty-state"><LoaderCircle className="spin" size={22}/><p>Loading studio…</p></div> : !studio ? <div className="studios-empty-state"><h2>Studio unavailable</h2><p>{notice || "This studio could not be found."}</p></div> : <>
      <header className="studio-detail-hero">
        <div className="studio-detail-avatar">{studio.ownerAvatar ? <img src={studio.ownerAvatar} alt="" /> : <Building2 size={30}/>}</div>
        <div className="studio-detail-main"><span className="spider-eyebrow">SPIDER / STUDIO</span><h1>{studio.name}</h1><p>@{studio.slug} · Managed by {studio.ownerName}</p></div>
        {isOwner && <Link className="hire-primary" href={"/studios/manage/" + encodeURIComponent(slug)}>Manage studio</Link>}
      </header>
      <div className="studio-detail-about"><h2>About the studio</h2><p>{studio.description}</p><div className="studios-directory-specialties">{studio.specialties.map(x => <span key={x}>{x}</span>)}</div><div className="studio-external-links">{studio.robloxUrl && <a href={studio.robloxUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Roblox</a>}{studio.discordUrl && <a href={studio.discordUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Discord</a>}</div></div>
      <section className="studios-section"><div className="studios-section-heading"><div><span className="spider-eyebrow">JOIN THE TEAM</span><h2>Open roles</h2><p>Apply directly to the studio for a role that fits your skills.</p></div><span className="studios-panel-count"><Users size={14}/> {roles.length} open</span></div>
      {roles.length ? <div className="studio-role-list">{roles.map(role => <article className="studio-role-card" key={role.id}><div className="studio-role-card-head"><span className="studio-role-icon"><BriefcaseBusiness size={18}/></span><div><h3>{role.title}</h3><p>{role.roleType} · {role.compensation || "Compensation discussed"}</p></div></div><p className="studio-role-description">{role.description}</p><button className="hire-primary" onClick={() => { setSelected(role); setNotice(""); }}>Apply for this role <ExternalLink size={14}/></button></article>)}</div> : <div className="studios-empty-state studios-empty-compact"><h3>No open roles right now</h3><p>This studio hasn't published any openings yet. Check back later.</p></div>}
      </section>
      {selected && <div className="studio-apply-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="studio-apply-modal" role="dialog" aria-modal="true" aria-label={"Apply for " + selected.title} onClick={e => e.stopPropagation()}><button className="studio-modal-close" onClick={() => setSelected(null)} aria-label="Close application">×</button><span className="spider-eyebrow">APPLICATION / {studio.name}</span><h2>Apply for {selected.title}</h2><form className="studio-apply-form" onSubmit={apply}><label>Portfolio link (optional)<input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://…" /></label><label>Relevant experience (optional)<textarea rows={3} value={experience} onChange={e => setExperience(e.target.value)} placeholder="Share related projects or experience"/></label><label>Why are you a good fit?<textarea required minLength={20} maxLength={3000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell the studio about your skills and availability"/></label><label>Work sample / image links (optional, up to 5; one HTTPS link per line)<textarea rows={2} value={attachments} onChange={e => setAttachments(e.target.value)} placeholder="https://…"/></label><button className="hire-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15}/> : null} Submit application</button></form></section></div>}
      {notice && <p className="studio-status-note" role="status">{notice}</p>}
    </>}
  </section></main>;
}
