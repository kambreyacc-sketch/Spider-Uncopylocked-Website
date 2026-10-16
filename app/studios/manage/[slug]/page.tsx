"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import SpiderSidebar from "../../../components/SpiderSidebar";
import { ArrowLeft, BriefcaseBusiness, Check, LoaderCircle, Plus, Users, X } from "lucide-react";

type Role = { id: string; title: string; description: string; roleType: string; compensation: string; status: string; createdAt: number };
type Application = { id: string; roleId: string; roleTitle: string; applicantName: string; applicantDiscordId: string; portfolioUrl?: string; experience?: string; message: string; attachments: string[]; status: string; createdAt: number };
export default function ManageStudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [studio, setStudio] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [roleType, setRoleType] = useState("Contract"); const [compensation, setCompensation] = useState("Discussed with applicants");
  const [notice, setNotice] = useState(""); const [saving, setSaving] = useState(false); const [tab, setTab] = useState<"roles"|"applications">("roles");
  async function load() {
    try {
      const [rr, ar] = await Promise.all([
        fetch("/api/studios/" + encodeURIComponent(slug) + "/roles", { cache: "no-store" }),
        fetch("/api/studios/" + encodeURIComponent(slug) + "/applications", { cache: "no-store" }),
      ]);
      const rd = await rr.json(); const ad = await ar.json();
      if (!rr.ok) throw new Error(rd.error || "Studio could not be loaded.");
      if (!ar.ok) throw new Error(ad.error || "Applications could not be loaded.");
      setStudio(rd.studio); setRoles(rd.roles || []); setApplications(ad.applications || []);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not load studio management."); }
  }
  useEffect(() => { void load(); }, [slug]);
  async function createRole(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (saving) return; setSaving(true); setNotice("");
    try {
      const r = await fetch("/api/studios/" + encodeURIComponent(slug) + "/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, roleType, compensation }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not publish role.");
      setTitle(""); setDescription(""); setCompensation("Discussed with applicants"); setNotice("Role published."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not publish role."); }
    finally { setSaving(false); }
  }
  async function patch(path: "roles"|"applications", payload: Record<string,string>) {
    setNotice("");
    try { const r = await fetch("/api/studios/" + encodeURIComponent(slug) + "/" + path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Update failed."); await load(); }
    catch(e) { setNotice(e instanceof Error ? e.message : "Update failed."); }
  }
  return <main className="market-shell studios-page"><SpiderSidebar/><section className="market-content studios-content"><Link href={"/studios/" + encodeURIComponent(slug)} className="hire-back"><ArrowLeft size={14}/> View public studio</Link>
    <header className="studios-page-header"><div><span className="spider-eyebrow">STUDIO WORKSPACE / MANAGEMENT</span><h1>{studio ? studio.name : "Manage studio"}</h1><p>Create open roles, review applications, and keep your hiring organized.</p></div></header>
    <div className="studio-manage-tabs"><button className={tab==="roles"?"active":""} onClick={()=>setTab("roles")}><BriefcaseBusiness size={15}/> Roles ({roles.length})</button><button className={tab==="applications"?"active":""} onClick={()=>setTab("applications")}><Users size={15}/> Applications ({applications.length})</button></div>
    {tab==="roles" ? <div className="studio-manage-grid"><section className="studio-manage-panel"><h2><Plus size={17}/> Publish a role</h2><p>Give applicants a clear description of the work and expectations.</p><form className="studio-apply-form" onSubmit={createRole}><label>Role title<input required minLength={3} maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Luau Scripter"/></label><label>Role type<select value={roleType} onChange={e=>setRoleType(e.target.value)}><option>Full-time</option><option>Contract</option><option>Commission</option><option>Volunteer</option></select></label><label>Compensation<input maxLength={120} value={compensation} onChange={e=>setCompensation(e.target.value)} placeholder="e.g. $250 fixed / negotiable"/></label><label>Role description<textarea required minLength={20} maxLength={3000} rows={6} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Responsibilities, skills, expected availability, and how the project works…"/></label><button className="hire-primary" disabled={saving}>{saving?<LoaderCircle size={15} className="spin"/>:<Plus size={15}/>} Publish role</button></form></section><section className="studio-manage-panel"><h2>Published roles</h2><p>Close a role when you have enough applicants or have filled it.</p>{roles.length?roles.map(role=><article className="studio-manage-role" key={role.id}><div><strong>{role.title}</strong><small>{role.roleType} · {role.compensation}</small><span className={"studio-status-pill "+(role.status==="open"?"open":"closed")}>{role.status}</span></div><button className="studio-secondary-button" onClick={()=>void patch("roles",{action:"status",roleId:role.id,status:role.status==="open"?"closed":"open"})}>{role.status==="open"?"Close role":"Reopen role"}</button></article>):<div className="studio-inline-empty">No roles yet. Publish your first opening.</div>}</section></div> : <section className="studio-manage-panel"><h2>Applications inbox</h2><p>Review applicant details and update each application as it moves forward.</p>{applications.length?applications.map(app=><article className="studio-application-card" key={app.id}><header><div><span className="spider-eyebrow">{app.roleTitle}</span><h3>{app.applicantName}</h3><small>Discord ID: {app.applicantDiscordId} · {new Date(app.createdAt).toLocaleDateString()}</small></div><select value={app.status} onChange={e=>void patch("applications",{applicationId:app.id,status:e.target.value})}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></header><p>{app.message}</p>{app.experience&&<p><strong>Experience:</strong> {app.experience}</p>}{app.portfolioUrl&&<a href={app.portfolioUrl} target="_blank" rel="noreferrer">Portfolio ↗</a>}{app.attachments?.length>0&&<div className="studio-application-links">{app.attachments.map((url,i)=><a key={url+i} href={url} target="_blank" rel="noreferrer">Work sample {i+1} ↗</a>)}</div>}</article>):<div className="studio-inline-empty">No applications yet. Your open roles will appear here once developers apply.</div>}</section>}
    {notice&&<p className="studio-status-note" role="status">{notice}</p>}
  </section></main>;
}
