"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpiderSidebar from "../components/SpiderSidebar";
import { ArrowRight, BadgeCheck, LifeBuoy, LockKeyhole, MessageSquarePlus, ShieldCheck } from "lucide-react";

const categories = [
  { name: "Account Appeal", detail: "Appeal a moderation action or restriction." },
  { name: "Report a Scammer", detail: "Report suspected fraud or dishonest trading." },
  { name: "Report Content", detail: "Report stolen, unsafe, or prohibited content." },
  { name: "Technical Support", detail: "Get help with website bugs and account issues." },
  { name: "Studio Request", detail: "Ask about studio setup or access." },
  { name: "General Support", detail: "Questions that do not fit another category." },
] as const;
const departments = ["Discord server", "Spider website", "Marketplace", "Resources / Creator Store", "Roblox game or group", "Other"] as const;
const actions = ["Warning", "Temporary suspension", "Permanent suspension / ban", "Restricted access", "Content removal", "Other"] as const;

export default function SupportCenterPage() {
  const [user, setUser] = useState<{id:string;displayName?:string;username?:string}|null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [category, setCategory] = useState<(typeof categories)[number]["name"]>("Account Appeal");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [infractionId, setInfractionId] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [createdNumber, setCreatedNumber] = useState<number|null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/discord/me", { cache: "no-store" }).then(r => r.json()).then(data => { if (active) setUser(data.user || null); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setCreatedNumber(null);
    if (!user) { setMessage("Sign in with Discord before submitting a ticket."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, subject, description, ...(category === "Account Appeal" ? { department, actionTaken, infractionId } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ticket could not be submitted.");
      setCreatedNumber(data.ticketNumber);
      setMessage("Your ticket has been saved. Keep the ticket number for follow-up.");
      setSubject(""); setDescription(""); setDepartment(""); setActionTaken(""); setInfractionId("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ticket submission failed."); }
    finally { setBusy(false); }
  }

  return <main className="market-shell support-center-page">
    <SpiderSidebar />
    <section className="market-content support-center-content">
      <header className="support-hero-panel">
        <span className="spider-eyebrow">SPIDER / SUPPORT CENTER</span>
        <h1>How can we help?</h1>
        <p>Open a private ticket for account appeals, reports, and support. Your submission is linked to your signed-in Discord account.</p>
        <div className="support-hero-actions"><Link href="/tickets" className="hire-secondary"><MessageSquarePlus size={15}/> My tickets</Link><span><ShieldCheck size={15}/> Private case history</span></div>
      </header>
      <div className="support-layout-grid">
        <aside className="support-info-panel">
          <div className="support-info-icon"><LifeBuoy size={20}/></div>
          <h2>Before you submit</h2>
          <p>Choose the closest category and include enough detail for the team to review the issue.</p>
          <div className="support-info-row"><BadgeCheck size={16}/><span>Ticket numbers and replies are saved for later.</span></div>
          <div className="support-info-row"><LockKeyhole size={16}/><span>Only you and authorized staff can view your ticket.</span></div>
          <div className="support-category-list">{categories.map(item=><button type="button" key={item.name} onClick={()=>setCategory(item.name)} className={category===item.name?"selected":""}><span>{item.name}</span><small>{item.detail}</small></button>)}</div>
        </aside>
        <section className="support-form-panel">
          <div className="support-section-heading"><div><span className="spider-eyebrow">NEW REQUEST</span><h2>Submit a ticket</h2></div><span className="support-ticket-pill">PRIVATE</span></div>
          {!authChecked ? <p className="support-feedback">Checking your sign-in…</p> : !user ? <div className="support-signin-gate"><LockKeyhole size={22}/><h3>Sign in to continue</h3><p>Tickets are attached to your verified Spider account so you can track replies and decisions.</p><Link href="/api/auth/discord/login" className="hire-primary">Sign in with Discord <ArrowRight size={15}/></Link></div> : <form className="support-ticket-form" onSubmit={submit}>
            <label>Category <select value={category} onChange={e=>setCategory(e.target.value as typeof category)}>{categories.map(item=><option key={item.name}>{item.name}</option>)}</select></label>
            {category==="Account Appeal"&&<div className="support-appeal-fields">
              <label>Department / area <select required value={department} onChange={e=>setDepartment(e.target.value)}><option value="">Choose a department…</option>{departments.map(value=><option key={value}>{value}</option>)}</select><small>Which part of the community or website issued the action?</small></label>
              <label>Action taken against you <select required value={actionTaken} onChange={e=>setActionTaken(e.target.value)}><option value="">Choose an action…</option>{actions.map(value=><option key={value}>{value}</option>)}</select></label>
              <label>Infraction ID <span className="support-optional">Optional</span><input value={infractionId} maxLength={100} onChange={e=>setInfractionId(e.target.value)} placeholder="Enter the infraction ID if known"/><small>Leave blank if you do not have an ID.</small></label>
            </div>}
            <label>Subject <input required minLength={4} maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)} placeholder={category==="Account Appeal"?"Appeal of moderation action":"A short summary of your request"}/></label>
            <label>{category==="Account Appeal"?"Appeal explanation":"Description"} <textarea required minLength={20} maxLength={8000} rows={8} value={description} onChange={e=>setDescription(e.target.value)} placeholder={category==="Account Appeal"?"Explain what happened, why you believe the action should be reviewed, and any relevant context…":"Describe what happened, what you expected, and any helpful context…"}/><small>{description.length}/8,000 characters. Do not include passwords or payment-card details.</small></label>
            <div className="support-evidence-notice"><ShieldCheck size={17}/><span>Evidence attachments will stay unavailable until private evidence storage and scanning are configured. Include relevant non-sensitive links in your description for now.</span></div>
            {message&&<div className={createdNumber?"support-feedback success":"support-feedback"} role="status">{message}{createdNumber&&<strong> Ticket #{createdNumber} · <Link href={"/tickets/"+createdNumber}>Open ticket <ArrowRight size={13}/></Link></strong>}</div>}
            <button type="submit" className="hire-primary support-submit" disabled={busy}>{busy?"Submitting…":"Submit private ticket"} <ArrowRight size={15}/></button>
          </form>}
        </section>
      </div>
      {message&&!user&&<p className="support-feedback" role="status">{message}</p>}
    </section>
  </main>;
}
