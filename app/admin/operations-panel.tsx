"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, Archive, CheckCircle2, ChevronLeft, ChevronRight, FileText, LockKeyhole, RefreshCw, Search, ShieldAlert, ShieldCheck, UserRoundX, Settings2 } from "lucide-react";

type Section = "users" | "studios" | "jobs" | "restrictions" | "activity" | "settings";
type Row = Record<string, any>;
type PageData = { rows: Row[]; page: number; pageSize: number; total: number; totalPages: number; generatedAt: number };
const titles: Record<Section, { title: string; description: string }> = {
  users: { title: "Member directory", description: "Members are derived from actual creator, studio, job, application, ticket, report, role, and restriction records—not a claimed total of all Discord members." },
  studios: { title: "Studio management", description: "Manage saved studio records. Changes are confirmed and audit logged." },
  jobs: { title: "Job post management", description: "Inspect actual job records and close or reopen eligible listings. Pending or rejected posts must be reviewed first." },
  restrictions: { title: "Warnings & restrictions", description: "Issue account actions with a reason. Active restrictions are checked by supported server-side write endpoints." },
  activity: { title: "Audit history", description: "Recent recorded moderation, support, and application events. Private notes are shown only to authorized administrators." },
  settings: { title: "Website configuration", description: "Manage the homepage announcement and featured text. Unsupported settings are intentionally not shown." },
};
const filters: Partial<Record<Section, {value:string;label:string}[]>> = {
  studios: [{value:"active",label:"Active"},{value:"archived",label:"Archived"}],
  jobs: [{value:"open",label:"Open"},{value:"closed",label:"Closed"},{value:"pending",label:"Pending moderation"},{value:"rejected",label:"Rejected"}],
  restrictions: [{value:"active",label:"Active"},{value:"expired",label:"Expired"},{value:"lifted",label:"Lifted"}],
};

export default function AdminOperationsPanel({section}:{section:Section}) {
  const [data,setData]=useState<PageData|null>(null),[searchDraft,setSearchDraft]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState(""),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[feedback,setFeedback]=useState("");
  const [kind,setKind]=useState("Warning"),[discordId,setDiscordId]=useState(""),[memberName,setMemberName]=useState(""),[reason,setReason]=useState(""),[expiresAt,setExpiresAt]=useState("");
  const [announcement,setAnnouncement]=useState(""),[announcementEnabled,setAnnouncementEnabled]=useState(false),[featuredText,setFeaturedText]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({section,page:String(page),pageSize:"25"});
      if(search)params.set("search",search);if(status)params.set("status",status);
      const response=await fetch("/api/admin/operations?"+params.toString(),{cache:"no-store"});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not load this admin section.");
      setData(result);
      if(section==="settings")for(const item of result.rows||[]){if(item.key==="announcement")setAnnouncement(item.value||"");if(item.key==="announcementEnabled")setAnnouncementEnabled(item.value==="true");if(item.key==="homepageFeaturedText")setFeaturedText(item.value||"");}
    }catch(caught){setError(caught instanceof Error?caught.message:"This admin section is unavailable.");}finally{setLoading(false);}
  },[section,page,search,status]);
  useEffect(()=>{void load();},[load]);

  async function mutate(action:string,fields:Record<string,unknown>,confirmation:string,method?:"POST"|"PATCH"){
    if(busy||!window.confirm(confirmation))return;
    setBusy(true);setError("");setFeedback("");
    try{
      const response=await fetch("/api/admin/operations",{method:method||(action==="saveSetting"||action==="createRestriction"?"POST":"PATCH"),headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...fields,confirmed:true})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"The operation failed.");
      setFeedback("Saved. The operation was recorded in the audit history.");await load();
    }catch(caught){setError(caught instanceof Error?caught.message:"The operation failed.");}finally{setBusy(false);}
  }
  function promptReason(label:string){const value=window.prompt("Reason for "+label+" (3–1,000 characters):");if(value===null)return null;const clean=value.trim();if(clean.length<3||clean.length>1000){setError("Enter a reason between 3 and 1,000 characters.");return null;}return clean;}
  async function issueRestriction(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    let expiry:string|undefined;
    if(expiresAt){const parsed=new Date(expiresAt);if(Number.isNaN(parsed.getTime())||parsed.getTime()<=Date.now()){setError("Expiration must be a future date and time.");return;}expiry=parsed.toISOString();}
    await mutate("createRestriction",{kind,subjectDiscordId:discordId.trim(),subjectName:memberName.trim(),reason:reason.trim(),...(expiry?{expiresAt:expiry}:{})},"Issue this account action? It will be audit logged and enforced by protected write endpoints.");
    setDiscordId("");setMemberName("");setReason("");setExpiresAt("");
  }
  const heading=titles[section];

  return <section className="admin-workflow-panel admin-operations-panel">
    <header className="admin-workflow-heading"><div><span className="admin-kicker">LIVE ADMIN OPERATIONS</span><h2>{heading.title}</h2><p>{heading.description}</p></div><button type="button" onClick={()=>void load()} disabled={loading||busy}><RefreshCw size={14}/>{loading?"Refreshing…":"Refresh"}</button></header>
    {error&&<div className="support-feedback" role="alert"><AlertTriangle size={15}/><span>{error}</span></div>}
    {feedback&&<div className="support-feedback success" role="status"><CheckCircle2 size={15}/><span>{feedback}</span></div>}

    {section==="restrictions"&&<form className="admin-restriction-form" onSubmit={issueRestriction}>
      <div className="admin-form-title"><ShieldAlert size={18}/><div><h3>Issue an account action</h3><p>Use a factual reason. Warnings are recorded; restrictions, suspensions and bans block supported account writes.</p></div></div>
      <div className="admin-operation-form-grid">
        <label>Action<select required value={kind} onChange={e=>setKind(e.target.value)}><option>Warning</option><option>Restricted</option><option>Suspended</option><option>Banned</option></select></label>
        <label>Discord user ID<input required inputMode="numeric" pattern="[0-9]{5,32}" maxLength={32} value={discordId} onChange={e=>setDiscordId(e.target.value)} placeholder="Discord user ID"/></label>
        <label>Member display name<input required maxLength={100} value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="Staff reference name"/></label>
        <label>Expires at (optional)<input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} disabled={kind==="Warning"}/></label>
        <label className="wide">Reason<textarea required minLength={3} maxLength={2000} rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Policy reason and relevant context."/></label>
      </div>
      <button className="hire-primary" disabled={busy}><LockKeyhole size={14}/>{busy?"Saving…":"Issue action"}</button>
    </form>}

    {section==="settings"&&<div className="admin-website-settings">
      <section className="admin-setting-editor"><div className="admin-form-title"><Settings2 size={18}/><div><h3>Homepage announcement</h3><p>Stored in Convex and displayed on the public homepage after saving.</p></div></div>
        <label className="admin-setting-toggle"><input type="checkbox" checked={announcementEnabled} onChange={e=>setAnnouncementEnabled(e.target.checked)}/> Show announcement</label>
        <label>Announcement text<textarea maxLength={1000} rows={3} value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Maintenance notice or community announcement."/></label>
        <button className="hire-primary" type="button" disabled={busy} onClick={()=>void mutate("saveSetting",{key:"announcement",value:announcement},"Save the homepage announcement text?")}>Save announcement text</button>
        <button className="hire-secondary" type="button" disabled={busy} onClick={()=>void mutate("saveSetting",{key:"announcementEnabled",value:announcementEnabled?"true":"false"},"Change whether the homepage announcement is visible?")}>{announcementEnabled?"Enable announcement":"Keep announcement hidden"}</button>
      </section>
      <section className="admin-setting-editor"><div className="admin-form-title"><Activity size={18}/><div><h3>Featured homepage text</h3><p>Optional editorial line. Leave blank to hide it.</p></div></div>
        <label>Featured text<input maxLength={300} value={featuredText} onChange={e=>setFeaturedText(e.target.value)} placeholder="Explore this week's community releases"/></label>
        <button className="hire-primary" type="button" disabled={busy} onClick={()=>void mutate("saveSetting",{key:"homepageFeaturedText",value:featuredText},"Save featured homepage text?")}>Save featured text</button>
      </section>
      <p className="admin-operations-note">Website payment activation, Pro pricing and automated content scanning remain disabled until external configuration is verified.</p>
    </div>}

    {section!=="settings"&&<>
      <div className="admin-operations-summary"><div><span>Matching records</span><strong>{loading?"—":(data?.total??0).toLocaleString()}</strong></div><div><span>Source</span><strong>Convex records</strong></div><div><span>Loaded</span><strong>{data?.generatedAt?new Date(data.generatedAt).toLocaleTimeString():"—"}</strong></div></div>
      <form className="admin-workflow-toolbar admin-operations-toolbar" onSubmit={event=>{event.preventDefault();setPage(1);setSearch(searchDraft.trim());}}>
        <label className="admin-operation-search"><Search size={15}/><input value={searchDraft} onChange={e=>setSearchDraft(e.target.value)} placeholder={section==="users"?"Name or Discord ID…":"Search saved records…"}/></label>
        {filters[section]&&<label>Status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All statuses</option>{filters[section]!.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
        <button className="hire-secondary" type="submit"><Search size={14}/> Search</button>
      </form>
      {loading?<div className="support-empty">Loading live records…</div>:!data||data.rows.length===0?<div className="support-empty"><FileText size={25}/><h3>No records found</h3><p>{search||status?"Try another search or status filter.":"There are no matching records in the database yet."}</p></div>:<div className="admin-operations-table-wrap"><table className="admin-operations-table">
        {section==="users"?<><thead><tr><th>Member</th><th>Known sources</th><th>Developer status</th><th>Restrictions</th><th>Last activity</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.discordId}><td><strong>{row.name}</strong><small>{row.discordId}</small></td><td>{(row.sources||[]).join(", ")}</td><td>{row.developerStatus||"—"}</td><td>{row.restrictionCount||0}</td><td>{new Date(row.lastSeenAt).toLocaleString()}</td></tr>)}</tbody></>
        :section==="studios"?<><thead><tr><th>Studio</th><th>Owner</th><th>Specialties</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td><strong>{row.name}</strong><small>@{row.slug}</small></td><td>{row.ownerName}<small>{row.ownerDiscordId}</small></td><td>{(row.specialties||[]).join(", ")}</td><td><span className="support-status-chip">{row.status}</span></td><td>{new Date(row.updatedAt).toLocaleString()}</td><td><button type="button" className="hire-secondary" disabled={busy} onClick={()=>{const target=row.status==="active"?"archived":"active";const why=promptReason(target+" studio "+row.slug);if(why)void mutate("studioStatus",{id:row.id,status:target,reason:why},(target==="archived"?"Archive":"Reactivate")+" this studio?");}}>{row.status==="active"?<><Archive size={13}/> Archive</>:<><CheckCircle2 size={13}/> Reactivate</>}</button></td></tr>)}</tbody></>
        :section==="jobs"?<><thead><tr><th>Job</th><th>Poster</th><th>Budget</th><th>Status</th><th>Moderation</th><th>Actions</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td><strong>{row.title}</strong><small>{row.craft} · {row.deadline||"No deadline"}</small></td><td>{row.posterName}<small>{row.posterDiscordId}</small></td><td>{"$"+Number(row.budgetMin).toLocaleString()+"–$"+Number(row.budgetMax).toLocaleString()}</td><td>{row.status}</td><td>{row.moderationStatus||"Legacy record"}</td><td><button type="button" className="hire-secondary" disabled={busy||row.moderationStatus==="pending"||row.moderationStatus==="rejected"} onClick={()=>{const target=row.status==="open"?"closed":"open";const why=promptReason(target+" job "+row.title);if(why)void mutate("jobStatus",{id:row.id,status:target,reason:why},(target==="closed"?"Close":"Reopen")+" this job post?");}}>{row.status==="open"?"Close job":"Reopen job"}</button></td></tr>)}</tbody></>
        :section==="restrictions"?<><thead><tr><th>Member</th><th>Action</th><th>Reason</th><th>Issued by</th><th>Expires</th><th>State</th><th>Actions</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td><strong>{row.subjectName}</strong><small>{row.subjectDiscordId}</small></td><td>{row.kind}</td><td>{row.reason}</td><td>{row.issuedByName}<small>{new Date(row.createdAt).toLocaleString()}</small></td><td>{row.expiresAt?new Date(row.expiresAt).toLocaleString():"No expiry"}</td><td><span className="support-status-chip">{row.effectiveStatus}</span></td><td>{row.active&&row.effectiveStatus!=="Expired"?<button type="button" className="hire-secondary" disabled={busy} onClick={()=>{const why=promptReason("lift this restriction");if(why)void mutate("liftRestriction",{id:row.id,reason:why},"Lift this restriction?");}}><UserRoundX size={13}/> Lift</button>:"—"}</td></tr>)}</tbody></>
        :<><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th><th>Source</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td>{new Date(row.createdAt).toLocaleString()}</td><td>{row.actorName}<small>{row.actorDiscordId}</small></td><td>{row.action}</td><td>{row.targetType}: {row.targetId}</td><td>{row.details||"—"}</td><td>{row.source}</td></tr>)}</tbody></>}
      </table></div>}
      {data&&data.totalPages>1&&<nav className="admin-operations-pagination" aria-label="Table pages"><button type="button" className="hire-secondary" disabled={page<=1||loading} onClick={()=>setPage(current=>Math.max(1,current-1))}><ChevronLeft size={14}/> Previous</button><span>Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} records</span><button type="button" className="hire-secondary" disabled={page>=data.totalPages||loading} onClick={()=>setPage(current=>Math.min(data.totalPages,current+1))}>Next <ChevronRight size={14}/></button></nav>}
    </>}
  </section>;
}
